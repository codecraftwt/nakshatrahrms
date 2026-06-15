import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import { store } from '../redux/store';
import { postTrackingLocation } from '../redux/slice/trackingSlice';

// ─── Constants ────────────────────────────────────────────────────────────────
const OFFLINE_QUEUE_KEY = 'offlineLocations';
const MAX_QUEUE_SIZE = 10000;     // cap to avoid unbounded AsyncStorage growth (10000 points covers ~11 hours of offline time at 4s intervals)
const ACCURACY_THRESHOLD = 200;   // metres — skip points less accurate than this
const TRACKING_DELAY_MS = 4000;   // 4 seconds between location pings

// ─── State ────────────────────────────────────────────────────────────────────
let isProcessingQueue = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Read the offline queue from storage, returning [] on any error. */
const readQueue = async (): Promise<LocationPayload[]> => {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[LocationService] Failed to read queue:', e);
    return [];
  }
};

/** Persist the queue to storage. */
const writeQueue = async (queue: LocationPayload[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[LocationService] Failed to write queue:', e);
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface LocationPayload {
  id: string;         // FIX: unique UUID per point — prevents dedup collisions on datetime
  latitude: number;
  longitude: number;
  datetime: string;
}

// ─── Queue Processor ──────────────────────────────────────────────────────────
/**
 * Drains the offline queue, sending each item to the server in order.
 * Stops on the first network failure and leaves remaining items in storage.
 *
 * FIX: After draining, re-checks for newly added items (fixes the race condition
 * where items written during processing were never picked up).
 */
const processQueue = async (): Promise<void> => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    let continueProcessing = true;

    while (continueProcessing) {
      const queue = await readQueue();
      if (queue.length === 0) break;

      let networkFailed = false;

      for (const item of queue) {
        const action = await store.dispatch(postTrackingLocation(item));

        if (postTrackingLocation.rejected.match(action)) {
          console.log('[LocationService] Network down — pausing queue processing');
          networkFailed = true;
          break; // keep remaining items in storage and stop
        }

        // FIX: Filter by unique `id` instead of `datetime` to avoid collision deletions
        const latest = await readQueue();
        await writeQueue(latest.filter((i) => i.id !== item.id));
      }

      // FIX: If we completed without a failure, loop once more to pick up any
      // items that were appended during this processing pass (race condition fix).
      if (networkFailed) {
        continueProcessing = false;
      } else {
        const remaining = await readQueue();
        continueProcessing = remaining.length > 0;
      }
    }
  } catch (e) {
    console.warn('[LocationService] Unexpected queue processing error:', e);
  } finally {
    isProcessingQueue = false;
  }
};

// ─── Background Task ──────────────────────────────────────────────────────────
const trackingTask = async (taskDataArguments: any): Promise<void> => {
  const { delay } = taskDataArguments;

  await new Promise<void>(async (resolve) => {
    while (BackgroundService.isRunning()) {
      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Anti-jitter filter: skip low-accuracy fixes
            if (position.coords.accuracy && position.coords.accuracy > ACCURACY_THRESHOLD) {
              console.log('[LocationService] Skipping inaccurate point:', position.coords.accuracy);
              return;
            }

            // FIX: Assign a UUID so the dedup filter in processQueue is collision-safe
            const payload: LocationPayload = {
              id: uuidv4(),
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              datetime: new Date(position.timestamp).toISOString(),
            };

            // Append to offline queue
            const queue = await readQueue();

            // FIX: Enforce max queue size — drop oldest point when limit is reached
            if (queue.length >= MAX_QUEUE_SIZE) {
              console.warn('[LocationService] Queue full — dropping oldest point');
              queue.shift();
            }

            queue.push(payload);
            await writeQueue(queue);

            // FIX: processQueue handles the re-entry guard and the post-drain re-check
            processQueue();
          } catch (err) {
            console.warn('[LocationService] Error handling location point:', err);
          }
        },
        (error) => {
          console.warn('[LocationService] Location fetch error:', error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );

      await sleep(delay);
    }

    resolve();
  });
};

// ─── Background Service Options ───────────────────────────────────────────────
const serviceOptions = {
  taskName: 'LocationTracking',
  taskTitle: 'Active Tracking',
  taskDesc: 'Your location is being tracked for attendance.',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  parameters: {
    delay: TRACKING_DELAY_MS,
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const LocationService = {
  /**
   * Requests all necessary location permissions for the current platform/OS version.
   * Returns true only when enough permissions are granted to run background tracking.
   */
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    // Android 12+: FINE and COARSE must be requested together
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    const fineGranted =
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const coarseGranted =
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED;

    // FIX: Use || (OR) — we need AT LEAST ONE of fine/coarse to be granted.
    // The original && meant we'd pass even if both were denied.
    if (!fineGranted && !coarseGranted) {
      console.warn('[LocationService] Location permissions denied');
      return false;
    }

    // Android 10+ (API 29+): background location is a separate permission
    if (Platform.Version >= 29) {
      const bgResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      );

      // FIX: Actually check the result — previously the return value was ignored
      if (bgResult !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('[LocationService] Background location permission denied — tracking may not work in background');
        // Not returning false here: foreground tracking can still work.
        // Adjust to `return false` if your app strictly requires background access.
      }
    }

    // Android 13+ (API 33+): POST_NOTIFICATIONS for the foreground-service notification
    if (Platform.Version >= 33) {
      const notifResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (notifResult !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('[LocationService] Notification permission denied — foreground service notification may not appear');
      }
    }

    return true;
  },

  /** Start background location tracking. No-op if already running. */
  startTracking: async (): Promise<void> => {
    const hasPerms = await LocationService.requestPermissions();
    if (!hasPerms) {
      console.warn('[LocationService] Cannot start tracking — permissions not granted');
      return;
    }

    if (BackgroundService.isRunning()) {
      console.log('[LocationService] Tracking already running');
      return;
    }

    try {
      await BackgroundService.start(trackingTask, serviceOptions);
      console.log('[LocationService] Background service started');
    } catch (e) {
      console.warn('[LocationService] Error starting background service:', e);
    }
  },

  /** Stop background location tracking. No-op if not running. */
  stopTracking: async (): Promise<void> => {
    if (!BackgroundService.isRunning()) return;

    try {
      await BackgroundService.stop();
      console.log('[LocationService] Background service stopped');
    } catch (e) {
      console.warn('[LocationService] Error stopping background service:', e);
    }
  },

  /** Returns true if the background service is currently active. */
  isTracking: (): boolean => BackgroundService.isRunning(),

  /**
   * Returns the number of location points currently sitting in the offline queue.
   * Useful for debugging or showing a UI indicator when the device is offline.
   */
  getPendingQueueSize: async (): Promise<number> => {
    const queue = await readQueue();
    return queue.length;
  },

  /** Clears the offline queue (e.g. on logout). */
  clearQueue: async (): Promise<void> => {
    await writeQueue([]);
    console.log('[LocationService] Offline queue cleared');
  },
};
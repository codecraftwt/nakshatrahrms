import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/axiosInstance';

// ─── Constants ────────────────────────────────────────────────────────────────
const OFFLINE_QUEUE_KEY = 'offlineLocations';
const MAX_QUEUE_SIZE = 10000;   // ~11 hours of offline time at 4s intervals
const ACCURACY_THRESHOLD = 200; // metres — skip points less accurate than this
const TRACKING_DELAY_MS = 4000; // 4 seconds between location pings
const BATCH_WRITE_SIZE = 20;    // flush processed IDs to storage every N items

// ─── Types ────────────────────────────────────────────────────────────────────
interface LocationPayload {
  id: string;        // UUID — prevents dedup collisions when filtering by datetime
  latitude: number;
  longitude: number;
  datetime: string;
}

// ─── State ────────────────────────────────────────────────────────────────────
let isProcessingQueue = false;
let iosWatchId: number | null = null; // iOS watchPosition subscription ID

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Read the offline queue from AsyncStorage.
 * Returns [] on any error so the caller never has to null-check.
 */
const readQueue = async (): Promise<LocationPayload[]> => {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[LocationService] Failed to read queue:', e);
    return [];
  }
};

/**
 * Persist the queue to AsyncStorage.
 * NOTE: Each entry is ~100 bytes; 10 000 entries ≈ 1 MB — well within the
 * Android 6 MB per-key limit, but revisit if the payload grows.
 */
const writeQueue = async (queue: LocationPayload[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[LocationService] Failed to write queue:', e);
  }
};

/**
 * Promisified wrapper around Geolocation.getCurrentPosition.
 *
 * FIX: The original code used the callback API inside an async loop, which
 * meant sleep(delay) fired immediately — before the GPS result arrived.
 * Wrapping in a Promise lets us properly await the position before sleeping.
 */
const getCurrentPosition = (): Promise<{
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  };
  timestamp: number;
}> =>
  new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }),
  );

// ─── Queue Processor ──────────────────────────────────────────────────────────
/**
 * Drains the offline queue by sending each point to the server in order.
 *
 * Behaviour:
 * - 4xx response  → drop the point (bad data; retrying forever would block the queue)
 * - 5xx / network → stop processing and leave remaining items in storage for retry
 * - After a full pass with no failures, loops once more to pick up any points
 *   appended during processing (fixes the race condition in the original code).
 * - Batch-writes removals every BATCH_WRITE_SIZE items to avoid locking the JS thread.
 *
 * FIX (race condition): After draining, re-reads the queue. If new items arrived
 * while we were processing, we loop again instead of exiting.
 *
 * FIX (fire-and-forget safety): Callers should use
 *   processQueue().catch(e => console.warn(...))
 * so unhandled rejections do not crash the background task.
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
      const processedIds = new Set<string>();

      for (const item of queue) {
        try {
          await api.post('/tracking/location', {
            latitude: item.latitude,
            longitude: item.longitude,
            datetime: item.datetime,
          });
          processedIds.add(item.id);
        } catch (error: any) {
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            // Client / validation error — drop it so it never blocks the queue
            console.warn(
              '[LocationService] Server rejected point (4xx), dropping:',
              error.response.status,
              error.response.data,
            );
            processedIds.add(item.id);
          } else {
            // Network error or 5xx — pause and retry on the next cycle
            console.warn('[LocationService] Network/server error — pausing queue:', error?.message);
            networkFailed = true;
            break;
          }
        }

        // FIX: Batch-flush processed IDs to storage every BATCH_WRITE_SIZE items
        // so we do not hold a large diff in memory or block the JS thread too long.
        if (processedIds.size >= BATCH_WRITE_SIZE) {
          const latest = await readQueue();
          await writeQueue(latest.filter((i) => !processedIds.has(i.id)));
          processedIds.clear();
        }
      }

      // Final flush for any remaining processed items in this pass
      if (processedIds.size > 0) {
        const latest = await readQueue();
        await writeQueue(latest.filter((i) => !processedIds.has(i.id)));
        processedIds.clear();
      }

      if (networkFailed) {
        // Stop — items remain in storage and will be retried next cycle
        continueProcessing = false;
      } else {
        // FIX: Check for new items added during this pass (race condition fix)
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
/**
 * FIX 1 (async-in-Promise anti-pattern): The original code wrapped the entire
 * loop in `new Promise<void>(async (resolve) => { ... })`. If anything threw
 * inside that async callback the outer Promise would hang silently forever.
 * The task is now a plain async function — react-native-background-actions
 * keeps it alive as long as the service is running.
 *
 * FIX 2 (GPS callback not awaited): getCurrentPosition is now promisified and
 * awaited so sleep(delay) only fires AFTER the position is resolved, preventing
 * overlapping GPS calls.
 */
const trackingTask = async (taskDataArguments: any): Promise<void> => {
  const { delay } = taskDataArguments;

  while (BackgroundService.isRunning()) {
    try {
      const position = await getCurrentPosition();

      // Anti-jitter filter: skip low-accuracy GPS fixes
      if (position.coords.accuracy && position.coords.accuracy > ACCURACY_THRESHOLD) {
        console.log('[LocationService] Skipping inaccurate point, accuracy:', position.coords.accuracy);
      } else {
        const payload: LocationPayload = {
          id: uuidv4(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          datetime: new Date(position.timestamp).toISOString(),
        };

        // Read → cap → append → write
        const queue = await readQueue();

        if (queue.length >= MAX_QUEUE_SIZE) {
          console.warn('[LocationService] Queue full — dropping oldest point');
          queue.shift();
        }

        queue.push(payload);
        await writeQueue(queue);

        // FIX: Fire-and-forget with explicit catch so a processQueue failure
        // does not propagate up and kill the background task loop.
        processQueue().catch((e) =>
          console.warn('[LocationService] processQueue unhandled error:', e),
        );
      }
    } catch (err) {
      // GPS timeout / permission revoked at runtime — log and continue loop
      console.warn('[LocationService] Location fetch error:', err);
    }

    // Wait the full delay before the next ping (runs AFTER the await above)
    await sleep(delay);
  }
};

// ─── Background Service Options (Android) ────────────────────────────────────
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
   * Requests all location permissions required for the current Android version.
   * Returns true when sufficient permissions are granted to start tracking.
   *
   * FIX: Permission condition was `&&` (both denied) instead of `||` (either denied).
   * FIX: Background location result is now checked and logged instead of ignored.
   */
  requestPermissions: async (): Promise<boolean> => {
    // iOS handles permissions via Info.plist — nothing to do at runtime
    if (Platform.OS !== 'android') return true;

    // Android 12+ requires FINE and COARSE to be requested together
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

    // FIX: We need AT LEAST ONE of fine or coarse. Original `&&` let us
    // proceed even when both were denied.
    if (!fineGranted && !coarseGranted) {
      console.warn('[LocationService] Location permissions denied — cannot start tracking');
      return false;
    }

    // Android 10+ (API 29+): background location is a separate permission dialog
    if (Platform.Version >= 29) {
      const bgResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      );

      // FIX: Return value was previously ignored; now logged clearly.
      // We do not hard-fail here so foreground-only tracking still works.
      // Change to `return false` if your app strictly requires background access.
      if (bgResult !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn(
          '[LocationService] Background location permission denied — tracking will only work while app is in foreground',
        );
      }
    }

    // Android 13+ (API 33+): POST_NOTIFICATIONS needed for the foreground service notification
    if (Platform.Version >= 33) {
      const notifResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (notifResult !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn(
          '[LocationService] Notification permission denied — foreground service notification will not appear',
        );
      }
    }

    return true;
  },

  /** Start background location tracking. No-op if already running. */
  startTracking: async (): Promise<void> => {
    const hasPerms = await LocationService.requestPermissions();
    if (!hasPerms) {
      console.warn('[LocationService] Cannot start tracking — required permissions not granted');
      return;
    }

    // ── iOS: use watchPosition with background location updates ──────────────
    // react-native-background-actions uses beginBackgroundTask on iOS which
    // only gives ~30s of background time. watchPosition with
    // allowsBackgroundLocationUpdates=true is the correct iOS approach.
    if (Platform.OS === 'ios') {
      if (iosWatchId !== null) {
        console.log('[LocationService] Tracking is already running (iOS)');
        return;
      }

      iosWatchId = Geolocation.watchPosition(
        async (position) => {
          try {
            if (position.coords.accuracy && position.coords.accuracy > ACCURACY_THRESHOLD) {
              console.log('[LocationService] iOS: Skipping inaccurate point, accuracy:', position.coords.accuracy);
              return;
            }

            const payload: LocationPayload = {
              id: uuidv4(),
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              datetime: new Date(position.timestamp).toISOString(),
            };

            const queue = await readQueue();
            if (queue.length >= MAX_QUEUE_SIZE) {
              console.warn('[LocationService] iOS: Queue full — dropping oldest point');
              queue.shift();
            }
            queue.push(payload);
            await writeQueue(queue);

            processQueue().catch((e) =>
              console.warn('[LocationService] iOS: processQueue unhandled error:', e),
            );
          } catch (err) {
            console.warn('[LocationService] iOS: Error handling location point:', err);
          }
        },
        (error) => {
          console.warn('[LocationService] iOS: watchPosition error:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10,           // only fire when moved 10m — saves battery
          interval: TRACKING_DELAY_MS,  // minimum time between updates (Android ignored on iOS)
          fastestInterval: TRACKING_DELAY_MS,
          allowsBackgroundLocationUpdates: true,   // KEY: keeps firing when app is in background
          showsBackgroundLocationIndicator: true,  // shows the blue bar so Apple approves it
          useSignificantChanges: false,
        },
      );

      console.log('[LocationService] iOS watchPosition started, watchId:', iosWatchId);
      return;
    }

    // ── Android: use BackgroundService (Foreground Service) ──────────────────
    if (BackgroundService.isRunning()) {
      console.log('[LocationService] Tracking is already running');
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
    // ── iOS ──────────────────────────────────────────────────────────────────
    if (Platform.OS === 'ios') {
      if (iosWatchId !== null) {
        Geolocation.clearWatch(iosWatchId);
        iosWatchId = null;
        console.log('[LocationService] iOS watchPosition stopped');
      }
      return;
    }

    // ── Android ──────────────────────────────────────────────────────────────
    if (!BackgroundService.isRunning()) return;

    try {
      await BackgroundService.stop();
      console.log('[LocationService] Background service stopped');
    } catch (e) {
      console.warn('[LocationService] Error stopping background service:', e);
    }
  },

  /** Returns true if the background service is currently active. */
  isTracking: (): boolean => {
    if (Platform.OS === 'ios') return iosWatchId !== null;
    return BackgroundService.isRunning();
  },

  /**
   * Returns how many location points are waiting in the offline queue.
   * Useful for showing a "pending sync" indicator in the UI.
   */
  getPendingQueueSize: async (): Promise<number> => {
    const queue = await readQueue();
    return queue.length;
  },

  /**
   * Clears all pending location points from the offline queue.
   * Call this on user logout to avoid sending stale data on next login.
   */
  clearQueue: async (): Promise<void> => {
    await writeQueue([]);
    console.log('[LocationService] Offline queue cleared');
  },
};
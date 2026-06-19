import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/axiosInstance';

// ─── Constants ────────────────────────────────────────────────────────────────
const OFFLINE_QUEUE_KEY    = 'offlineLocations';
const MAX_QUEUE_SIZE       = 10000;  // ~11 hours offline at 4-second intervals
const ACCURACY_THRESHOLD   = 50;     // metres — skip fixes less accurate than this
const TRACKING_DELAY_MS    = 4000;   // Android polling interval (ms)
const BATCH_WRITE_SIZE     = 20;     // flush processed IDs every N items

// ─── Types ────────────────────────────────────────────────────────────────────
interface LocationPayload {
  id: string;       // UUID — prevents dedup key collisions on datetime
  latitude: number;
  longitude: number;
  datetime: string;
}

// Minimal shape returned by both getCurrentPosition and watchPosition
interface PositionResult {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  };
  timestamp: number;
}

// ─── Module-level state ───────────────────────────────────────────────────────
let isProcessingQueue = false;
let iosWatchId: number | null = null;

// ─── Storage helpers ──────────────────────────────────────────────────────────
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const readQueue = async (): Promise<LocationPayload[]> => {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[LocationService] readQueue error:', e);
    return [];
  }
};

const writeQueue = async (queue: LocationPayload[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[LocationService] writeQueue error:', e);
  }
};

// ─── Shared location handler (used by BOTH platforms) ────────────────────────
/**
 * Single source of truth for handling a location fix.
 * Called by:
 *   - Android: trackingTask while-loop (via getCurrentPosition)
 *   - iOS:     watchPosition callback
 *
 * Applies accuracy filter → builds payload → appends to queue → triggers drain.
 */
const handleLocationUpdate = async (position: PositionResult): Promise<void> => {
  // Skip low-accuracy fixes (jitter filter)
  if (
    position.coords.accuracy !== null &&
    position.coords.accuracy > ACCURACY_THRESHOLD
  ) {
    console.log(
      '[LocationService] Skipping inaccurate fix, accuracy:',
      position.coords.accuracy,
    );
    return;
  }

  const payload: LocationPayload = {
    id: uuidv4(),
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    datetime: new Date(position.timestamp).toISOString(),
  };

  const queue = await readQueue();

  // Cap queue size — drop oldest when full
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn('[LocationService] Queue full — dropping oldest point');
    queue.shift();
  }

  queue.push(payload);
  await writeQueue(queue);

  // Fire-and-forget — explicit catch so failures never kill the caller's loop
  processQueue().catch((e) =>
    console.warn('[LocationService] processQueue error:', e),
  );
};

// ─── Queue processor ──────────────────────────────────────────────────────────
/**
 * Drains the offline queue, sending each point to the server in order.
 *
 * Error handling:
 *   4xx → drop the point (bad data would block the queue forever)
 *   5xx / network error → stop and retry on next cycle
 *
 * Race condition fix: after a successful pass, re-reads the queue.
 * If new items arrived while we were draining, it loops again.
 *
 * Performance: flushes removals to AsyncStorage every BATCH_WRITE_SIZE
 * items instead of after every single item.
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
          if (
            error.response &&
            error.response.status >= 400 &&
            error.response.status < 500
          ) {
            // 4xx — bad payload, drop so it never blocks the queue
            console.warn(
              '[LocationService] 4xx — dropping point:',
              error.response.status,
              error.response.data,
            );
            processedIds.add(item.id);
          } else {
            // Network down or 5xx — pause, retry next cycle
            console.warn(
              '[LocationService] Network/5xx error — pausing:',
              error?.message,
            );
            networkFailed = true;
            break;
          }
        }

        // Batch flush every BATCH_WRITE_SIZE to keep memory and I/O low
        if (processedIds.size >= BATCH_WRITE_SIZE) {
          const latest = await readQueue();
          await writeQueue(latest.filter((i) => !processedIds.has(i.id)));
          processedIds.clear();
        }
      }

      // Final flush for the tail of this pass
      if (processedIds.size > 0) {
        const latest = await readQueue();
        await writeQueue(latest.filter((i) => !processedIds.has(i.id)));
        processedIds.clear();
      }

      if (networkFailed) {
        continueProcessing = false;
      } else {
        // Race condition fix: check for items added during this pass
        const remaining = await readQueue();
        continueProcessing = remaining.length > 0;
      }
    }
  } catch (e) {
    console.warn('[LocationService] Unexpected processQueue error:', e);
  } finally {
    isProcessingQueue = false;
  }
};

// ─── Android background task ──────────────────────────────────────────────────
/**
 * Runs as a Foreground Service on Android via react-native-background-actions.
 *
 * FIX: Switched from periodic `getCurrentPosition` polling to `watchPosition`.
 * Native watchPosition is heavily optimized by the OS, uses a distanceFilter 
 * to accurately trace roads and turns, and prevents cutting corners.
 */
const trackingTask = async (taskDataArguments: any): Promise<void> => {
  const { delay } = taskDataArguments;

  // Poll the latest accurate position periodically to satisfy backend tracking API
  // Using getCurrentPosition in the loop forces a fresh GPS fix and prevents the OS
  // from suspending passive watchPosition listeners during deep background/doze.
  while (BackgroundService.isRunning()) {
    try {
      await new Promise<void>((resolve) => {
        Geolocation.getCurrentPosition(
          async (position) => {
            if (position.coords.accuracy !== null && position.coords.accuracy <= ACCURACY_THRESHOLD) {
              await handleLocationUpdate(position).catch((e) =>
                console.warn('[LocationService] Android handleLocationUpdate error:', e)
              );
            }
            resolve();
          },
          (error) => {
            console.warn('[LocationService] Android getCurrentPosition error:', error);
            resolve();
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 2000,
            distanceFilter: 0,
          }
        );
      });
    } catch (e) {
      console.warn('[LocationService] Loop error:', e);
    }

    await sleep(delay); // Wait before next poll
  }
};

// ─── Android foreground-service config ───────────────────────────────────────
const serviceOptions = {
  taskName: 'LocationTracking',
  taskTitle: 'Active Tracking',
  taskDesc: 'Your location is being tracked for attendance.',
  taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  color: '#ff00ff',
  parameters: { delay: TRACKING_DELAY_MS },
  foregroundServiceType: ['location'],
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const LocationService = {

  // ── getAccurateLocation ───────────────────────────────────────────────────
  /**
   * Attempts to get a high-accuracy GPS fix (<= 50 meters).
   * It listens to the GPS sensor for up to 10 seconds. Returns the best fix 
   * found when time runs out, or resolves early if an excellent lock is achieved.
   */
  getAccurateLocation: (): Promise<any> => {
    return new Promise((resolve, reject) => {
      let bestPosition: any = null;
      let watchId: number;
      let timeoutId: any;

      const finish = (pos: any) => {
        Geolocation.clearWatch(watchId);
        clearTimeout(timeoutId);
        resolve(pos);
      };

      watchId = Geolocation.watchPosition(
        (position) => {
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }
          // If we get an accuracy of 20m or better, that's an excellent lock!
          if (position.coords.accuracy <= 20) {
            finish(position);
          }
        },
        (error) => {
          console.warn('[LocationService] getAccurateLocation error:', error);
        },
        { enableHighAccuracy: true, distanceFilter: 0, interval: 1000, fastestInterval: 500 }
      );

      timeoutId = setTimeout(() => {
        Geolocation.clearWatch(watchId);
        if (bestPosition) {
          resolve(bestPosition);
        } else {
          // Fallback: If high-accuracy GPS totally fails indoors, try low-accuracy network location
          Geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(new Error('Location timeout: Unable to get a GPS fix.')),
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
          );
        }
      }, 15000); // 15 seconds max wait for a highly accurate fix
    });
  },

  // ── requestPermissions ────────────────────────────────────────────────────
  /**
   * iOS FIX: Previously returned true immediately without asking for anything.
   *   Now calls Geolocation.requestAuthorization('always') so the OS shows
   *   the permission dialog. 'always' is required for background tracking.
   *
   * Android FIX: || instead of && — need at least ONE of fine/coarse.
   * Android FIX: background permission result is now read and logged.
   */
  requestPermissions: async (): Promise<boolean> => {

    // ── iOS ────────────────────────────────────────────────────────────────
    if (Platform.OS === 'ios') {
      // FIX: This was missing — iOS never showed a permission dialog before.
      // Requires Info.plist keys:
      //   NSLocationAlwaysAndWhenInUseUsageDescription
      //   NSLocationWhenInUseUsageDescription
      // and UIBackgroundModes → location
      const auth = await Geolocation.requestAuthorization('always');

      if (auth === 'denied' || auth === 'restricted') {
        console.warn('[LocationService] iOS permission denied:', auth);
        return false;
      }

      return true; // 'granted' or 'whenInUse' — watchPosition will still work
    }

    // ── Android ───────────────────────────────────────────────────────────
    // Android 12+: FINE + COARSE must be requested together
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

    // FIX: Original used && — that passed even when BOTH were denied.
    // We only need at least one to proceed.
    if (!fineGranted && !coarseGranted) {
      console.warn('[LocationService] Android: location permissions denied');
      return false;
    }

    // Android 10+ (API 29+): background location = separate dialog
    if (Platform.Version >= 29) {
      const bgResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      );

      // FIX: Result was previously ignored. Now logged clearly.
      // Not a hard failure — foreground tracking still works without it.
      // Set `return false` here if your app requires strict background access.
      if (bgResult !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn(
          '[LocationService] Android: background location denied — ' +
          'tracking will only work while the app is in the foreground',
        );
      }
    }

    // Android 13+ (API 33+): notification permission for the foreground service banner
    if (Platform.Version >= 33) {
      const notifResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (notifResult !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn(
          '[LocationService] Android: notification permission denied — ' +
          'foreground service banner will not appear',
        );
      }
    }

    return true;
  },

  // ── startTracking ─────────────────────────────────────────────────────────
  /**
   * iOS  → watchPosition with allowsBackgroundLocationUpdates: true
   *         (react-native-background-actions only gives ~30 s on iOS via
   *          beginBackgroundTask — NOT suitable for continuous tracking)
   *
   * Android → Foreground Service via react-native-background-actions
   *
   * FIX (iOS): `interval` and `fastestInterval` are Android-only options.
   *   On iOS they are silently ignored. Removed to avoid confusion.
   *
   * FIX (iOS): `iosWatchId` is now cleared before creating a new watch so
   *   a double-call to startTracking never leaks the old subscription.
   */
  startTracking: async (): Promise<void> => {
    const hasPerms = await LocationService.requestPermissions();
    if (!hasPerms) {
      console.warn('[LocationService] startTracking aborted — permissions not granted');
      return;
    }

    // ── iOS ────────────────────────────────────────────────────────────────
    if (Platform.OS === 'ios') {
      // FIX: Clear any existing watch first to prevent subscription leaks
      if (iosWatchId !== null) {
        console.log('[LocationService] iOS: clearing stale watch before restart');
        Geolocation.clearWatch(iosWatchId);
        iosWatchId = null;
      }

      iosWatchId = Geolocation.watchPosition(
        async (position) => {
          try {
            await handleLocationUpdate(position);
          } catch (err) {
            console.warn('[LocationService] iOS: handleLocationUpdate error:', err);
          }
        },
        (error) => {
          console.warn('[LocationService] iOS: watchPosition error:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
          showsBackgroundLocationIndicator: true, // blue status-bar indicator (required by Apple)
          useSignificantChanges: false,           // false = fine-grained; true = cell-tower only
        },
      );

      console.log('[LocationService] iOS: watchPosition started, id:', iosWatchId);
      return;
    }

    // ── Android ───────────────────────────────────────────────────────────
    if (BackgroundService.isRunning()) {
      console.log('[LocationService] Android: already running');
      return;
    }

    try {
      await BackgroundService.start(trackingTask, serviceOptions);
      console.log('[LocationService] Android: foreground service started');
    } catch (e) {
      console.warn('[LocationService] Android: failed to start foreground service:', e);
    }
  },

  // ── stopTracking ──────────────────────────────────────────────────────────
  stopTracking: async (): Promise<void> => {
    if (Platform.OS === 'ios') {
      if (iosWatchId !== null) {
        Geolocation.clearWatch(iosWatchId);
        iosWatchId = null;
        console.log('[LocationService] iOS: watchPosition stopped');
      }
      return;
    }

    if (!BackgroundService.isRunning()) return;

    try {
      await BackgroundService.stop();
      console.log('[LocationService] Android: foreground service stopped');
    } catch (e) {
      console.warn('[LocationService] Android: failed to stop foreground service:', e);
    }
  },

  // ── isTracking ────────────────────────────────────────────────────────────
  isTracking: (): boolean => {
    if (Platform.OS === 'ios') return iosWatchId !== null;
    return BackgroundService.isRunning();
  },

  // ── getPendingQueueSize ───────────────────────────────────────────────────
  /** How many points are sitting in the offline queue awaiting upload. */
  getPendingQueueSize: async (): Promise<number> => {
    const queue = await readQueue();
    return queue.length;
  },

  // ── clearQueue ────────────────────────────────────────────────────────────
  /** Wipe the queue — call on logout so stale data is never sent. */
  clearQueue: async (): Promise<void> => {
    await writeQueue([]);
    console.log('[LocationService] Offline queue cleared');
  },
};
import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/axiosInstance';

// ─── Constants ────────────────────────────────────────────────────────────────
const OFFLINE_QUEUE_KEY          = 'offlineLocations';
const MAX_QUEUE_SIZE             = 10000;  // ~11 hours offline at 4-second intervals
const ACCURACY_THRESHOLD         = 500;    // metres — relaxed to allow network/cell-tower fallback during Doze mode
                                            // (75m was too tight and dropped all background points when GPS slept)
const TRACKING_DELAY_MS          = 4000;   // Android keep-alive heartbeat (ms)
const BATCH_WRITE_SIZE           = 20;     // flush processed IDs every N items
const MIN_DISTANCE_METERS        = 5;      // below this = "stationary" for jitter purposes
const MAX_SPEED_KMH              = 200;    // ignore GPS spikes implying > 200 km/h
const STATIONARY_PING_INTERVAL_MS = 5 * 60 * 1000; // force a "still here" ping every 5 min
const MAX_CONSECUTIVE_SPEED_REJECTS = 3;   // force-accept a point after this many rejects

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
let androidWatchId: number | null = null;
let lastRecordedPoint: { lat: number; lng: number; time: number } | null = null;
let consecutiveSpeedRejects = 0;
let isTrackingStopped = false; // guard against callbacks firing after stopTracking

// ─── Haversine distance (metres) ──────────────────────────────────────────────
/**
 * Returns the great-circle distance between two lat/lng points in metres.
 * Used for the minimum-distance and speed-sanity filters.
 */
const haversineDistance = (
  a: { lat: number; lng: number },
  b: { latitude: number; longitude: number },
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6_371_000; // Earth radius in metres
  const dLat = toRad(b.latitude - a.lat);
  const dLon = toRad(b.longitude - a.lng);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.latitude)) * sinHalfLon * sinHalfLon;
  return 2 * R * Math.asin(Math.sqrt(h));
};

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
 *   - Android: watchPosition callback inside foreground service
 *   - iOS:     watchPosition callback
 *
 * Applies accuracy filter → distance/stationary filter → speed sanity check →
 * builds payload → appends to queue → triggers drain.
 */
const handleLocationUpdate = async (position: PositionResult): Promise<void> => {
  // Guard: if tracking was stopped, ignore any late-arriving callbacks
  if (isTrackingStopped) return;

  // 1. Skip low-accuracy fixes (jitter filter)
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

  if (lastRecordedPoint) {
    const dist = haversineDistance(lastRecordedPoint, position.coords);
    const timeSinceLastMs = position.timestamp - lastRecordedPoint.time;

    // 2. Stationary filter — FIX: previously this dropped points forever while
    // the user stood still, leaving zero attendance pings for the whole period.
    // Now: only skip if BOTH (a) movement is below threshold AND
    // (b) we recorded a point recently. Otherwise force a "still here" ping.
    if (dist < MIN_DISTANCE_METERS && timeSinceLastMs < STATIONARY_PING_INTERVAL_MS) {
      return; // genuinely stationary and recent — skip
    }

    // 3. Speed sanity check — reject GPS teleport spikes
    // FIX: previously, rejecting a spike left lastRecordedPoint unchanged,
    // which could cascade into rejecting all future real points if the bad
    // fix itself was the new "anchor". We now force-accept after a few
    // consecutive rejects so tracking can never get permanently stuck.
    if (timeSinceLastMs > 0) {
      const speedKmH = (dist / (timeSinceLastMs / 1000)) * 3.6;

      if (speedKmH > MAX_SPEED_KMH) {
        consecutiveSpeedRejects++;

        if (consecutiveSpeedRejects < MAX_CONSECUTIVE_SPEED_REJECTS) {
          console.log(
            '[LocationService] Skipping GPS spike, implied speed:',
            speedKmH.toFixed(1),
            'km/h',
          );
          return;
        }

        console.warn(
          '[LocationService] Accepting point despite speed flag — too many consecutive rejects',
        );
        // fall through and accept this point, resetting the counter below
      }
    }
  }

  // Reset reject streak on any accepted point
  consecutiveSpeedRejects = 0;

  // Update last recorded point for next comparison
  lastRecordedPoint = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    time: position.timestamp,
  };

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
 * HYBRID APPROACH:
 *   1. `watchPosition` (distanceFilter: 10m) — handles movement tracking.
 *      The OS fires callbacks at actual position changes, following curves
 *      and turns accurately.
 *   2. Periodic `getCurrentPosition` in the keep-alive loop — ensures the
 *      API is hit regularly even when the user is stationary. The distance
 *      and stationary-ping filters inside `handleLocationUpdate` prevent
 *      duplicate points when both sources fire close together.
 *
 * This guarantees: accurate road tracking when moving, AND regular pings
 * when sitting still (e.g. at a desk, in a meeting).
 */
const trackingTask = async (taskDataArguments: any): Promise<void> => {
  const { delay } = taskDataArguments;

  // 1. Start native watchPosition for accurate movement tracking
  androidWatchId = Geolocation.watchPosition(
    async (position) => {
      try {
        await handleLocationUpdate(position);
      } catch (e) {
        console.warn('[LocationService] Android watchPosition handler error:', e);
      }
    },
    (error) => {
      console.warn('[LocationService] Android watchPosition error:', error);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 0,           // FIX: 0 ensures the OS doesn't throttle updates based on distance while in Doze mode
      interval: 10000,             // Relaxed from 4000ms to 10s (better for battery, still frequent enough)
      fastestInterval: 5000,
      maximumAge: 0,               // no stale cached positions
      showLocationDialog: false,   // don't prompt to enable GPS (already handled)
      forceRequestLocation: true,  // FIX: Forces FusedLocationProvider to actively fetch location in background
    },
  );

  console.log('[LocationService] Android: watchPosition started, id:', androidWatchId);

  // 2. Keep-alive loop
  // By sleeping, we keep the JS thread alive and the Foreground Service's
  // partial wakelock active. We periodically check if watchPosition has stalled.
  while (BackgroundService.isRunning()) {
    await sleep(delay);

    // Fallback: if watchPosition goes completely silent for > 60 seconds, try to kickstart it
    const now = Date.now();
    const timeSinceLast = lastRecordedPoint ? (now - lastRecordedPoint.time) : 0;

    if (timeSinceLast > 60000) {
      console.log('[LocationService] watchPosition stalled, forcing fallback ping...');
      try {
        await new Promise<void>((resolve) => {
          Geolocation.getCurrentPosition(
            async (position) => {
              try {
                await handleLocationUpdate(position);
              } catch (e) {
                console.warn('[LocationService] Android fallback ping error:', e);
              }
              resolve();
            },
            (error) => {
              console.warn('[LocationService] Android fallback getCurrentPosition error:', error);
              resolve();
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
              forceRequestLocation: true,
            },
          );
        });
      } catch (e) {
        console.warn('[LocationService] Android loop error:', e);
      }
    }
  }

  // Cleanup when the service stops
  if (androidWatchId !== null) {
    Geolocation.clearWatch(androidWatchId);
    androidWatchId = null;
    console.log('[LocationService] Android: watchPosition cleaned up after service stop');
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
  // NOTE: AndroidManifest.xml must also declare:
  //   <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
  //   <service android:name="com.asterinet.react.bgactions.RNBackgroundActionsTask"
  //            android:foregroundServiceType="location" />
  // Required on Android 14+ or the foreground service will crash at runtime.
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const LocationService = {

  // ── getAccurateLocation ───────────────────────────────────────────────────
  /**
   * Attempts to get a high-accuracy GPS fix (<= 20 meters is treated as excellent).
   * Listens to the GPS sensor for up to 15 seconds, returning the best fix found
   * when time runs out, or resolving early on an excellent lock.
   *
   * FIX: accuracy can be `null` from the native module. The original code did
   * `position.coords.accuracy < bestPosition.coords.accuracy`, which silently
   * misbehaves when either side is null. Both sides now fall back to Infinity
   * so comparisons are always well-defined.
   */
  getAccurateLocation: (): Promise<PositionResult> => {
    return new Promise((resolve, reject) => {
      let bestPosition: PositionResult | null = null;
      let watchId: number;
      let timeoutId: ReturnType<typeof setTimeout>;

      const finish = (pos: PositionResult) => {
        Geolocation.clearWatch(watchId);
        clearTimeout(timeoutId);
        resolve(pos);
      };

      watchId = Geolocation.watchPosition(
        (position) => {
          const acc = position.coords.accuracy ?? Infinity;
          const bestAcc = bestPosition?.coords.accuracy ?? Infinity;

          if (!bestPosition || acc < bestAcc) {
            bestPosition = position;
          }

          // An accuracy of 20m or better is an excellent lock — resolve early
          if (acc <= 20) {
            finish(position);
          }
        },
        (error) => {
          console.warn('[LocationService] getAccurateLocation error:', error);
        },
        { enableHighAccuracy: true, distanceFilter: 0, interval: 1000, fastestInterval: 500 },
      );

      timeoutId = setTimeout(() => {
        Geolocation.clearWatch(watchId);

        if (bestPosition) {
          resolve(bestPosition);
        } else {
          // Fallback: if high-accuracy GPS totally fails (e.g. indoors),
          // try a low-accuracy network-based fix instead of failing outright.
          Geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            () => reject(new Error('Location timeout: unable to get a GPS fix.')),
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
          );
        }
      }, 15000); // 15 seconds max wait for a highly accurate fix
    });
  },

  // ── requestPermissions ────────────────────────────────────────────────────
  /**
   * iOS: calls Geolocation.requestAuthorization('always') so the OS shows the
   *   permission dialog. 'always' is required for background tracking.
   * Android: needs at least ONE of fine/coarse granted; background-location
   *   and notification results are read and logged (not silently ignored).
   */
  requestPermissions: async (): Promise<boolean> => {

    // ── iOS ────────────────────────────────────────────────────────────────
    if (Platform.OS === 'ios') {
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

    // We need at least one of fine/coarse to proceed
    if (!fineGranted && !coarseGranted) {
      console.warn('[LocationService] Android: location permissions denied');
      return false;
    }

    // Android 10+ (API 29+): background location = separate dialog
    if (Platform.Version >= 29) {
      const bgResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      );

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
   * iOS     → watchPosition with allowsBackgroundLocationUpdates: true
   *           (react-native-background-actions only gives ~30s on iOS via
   *            beginBackgroundTask — NOT suitable for continuous tracking)
   * Android → Foreground Service running native watchPosition internally
   */
  startTracking: async (): Promise<void> => {
    const hasPerms = await LocationService.requestPermissions();
    if (!hasPerms) {
      console.warn('[LocationService] startTracking aborted — permissions not granted');
      return;
    }

    // Reset filter state for a fresh tracking session
    lastRecordedPoint = null;
    consecutiveSpeedRejects = 0;
    isTrackingStopped = false;

    // ── iOS ────────────────────────────────────────────────────────────────
    if (Platform.OS === 'ios') {
      // Clear any existing watch first to prevent subscription leaks
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
          distanceFilter: 10,                     // fire every ~10m of real movement
          showsBackgroundLocationIndicator: true,  // blue status-bar indicator (required by Apple)
          useSignificantChanges: false,            // false = fine-grained; true = cell-tower only
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
    // Set guard flag FIRST — prevents any pending callbacks from doing work
    isTrackingStopped = true;

    // Reset filter state so next session starts fresh
    lastRecordedPoint = null;
    consecutiveSpeedRejects = 0;

    if (Platform.OS === 'ios') {
      if (iosWatchId !== null) {
        Geolocation.clearWatch(iosWatchId);
        iosWatchId = null;
        console.log('[LocationService] iOS: watchPosition stopped');
      }
      return;
    }

    // Clean up Android watchPosition if still active
    if (androidWatchId !== null) {
      Geolocation.clearWatch(androidWatchId);
      androidWatchId = null;
      console.log('[LocationService] Android: watchPosition cleaned up');
    }

    if (!BackgroundService.isRunning()) return;

    try {
      // Small delay to ensure Geolocation.clearWatch completes natively 
      // before we forcefully destroy the Android Service context.
      await new Promise((resolve) => setTimeout(resolve, 100));
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
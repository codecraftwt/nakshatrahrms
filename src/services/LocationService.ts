import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';
import { PermissionsAndroid, Platform } from 'react-native';
// @ts-ignore
import { store } from '../redux/store';
import { postTrackingLocation } from '../redux/slice/trackingSlice';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

const trackingTask = async (taskDataArguments: any) => {
  const { delay } = taskDataArguments;

  await new Promise<void>(async (resolve) => {
    while (BackgroundService.isRunning()) {
      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            const payload = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              datetime: new Date(position.timestamp).toISOString(),
            };
            await store.dispatch(postTrackingLocation(payload));
            console.log('Location sent every 2 secs:', payload.latitude, payload.longitude);
          } catch (err) {
            console.log('Error posting location:', err);
          }
        },
        (error) => {
          console.log('Location fetch error:', error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );

      await sleep(delay);
    }
    resolve();
  });
};

const options = {
  taskName: 'LocationTracking',
  taskTitle: 'Active Tracking',
  taskDesc: 'Your location is being tracked for attendance.',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  parameters: {
    delay: 2000, // 2 seconds delay
  },
};

export const LocationService = {
  requestPermissions: async () => {
    if (Platform.OS === 'android') {
      // On Android 12+, we MUST request FINE and COARSE together
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      
      if (
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !== PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        return false;
      }

      if (Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      }

      return true;
    }
    return true;
  },

  startTracking: async () => {
    const hasPerms = await LocationService.requestPermissions();
    if (!hasPerms) {
      console.log('Location permissions denied');
      return;
    }

    if (!BackgroundService.isRunning()) {
      try {
        await BackgroundService.start(trackingTask, options);
        console.log('Background service started');
      } catch (e) {
        console.log('Error starting background service', e);
      }
    }
  },

  stopTracking: async () => {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
      console.log('Background service stopped');
    }
  }
};

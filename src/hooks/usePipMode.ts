import { useEffect, useState } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { PipModule } = NativeModules;
// PipModule might be null during development/reloads if not properly linked or if on iOS
const pipEmitter = Platform.OS === 'android' && PipModule ? new NativeEventEmitter(PipModule) : null;

export const usePipMode = () => {
  const [isPipMode, setIsPipMode] = useState(false);

  useEffect(() => {
    if (!pipEmitter) return;

    const subscription = pipEmitter.addListener('onPipModeChanged', (isPip) => {
      setIsPipMode(isPip);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const setPipAllowed = (allowed: boolean) => {
    if (Platform.OS === 'android' && PipModule) {
      try {
        PipModule.setPipAllowed(allowed);
      } catch (e) {
        console.warn('PipModule not available');
      }
    }
  };

  return { isPipMode, setPipAllowed };
};

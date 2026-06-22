import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function resetToLogin() {
  if (navigationRef.isReady()) {
    // Navigate provides a smooth slide animation.
    // The previous stack is naturally dropped when Redux state wipes in the background anyway!
    navigationRef.navigate('LoginScreen' as never);
  }
}

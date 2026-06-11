import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/theme/colors';
import { ThemeProvider } from './src/theme/ThemeContext';
import { store, persistor, RootState } from './src/redux/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

const App = () => {
  return (
    <ThemeProvider>
       <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
};

export default App;

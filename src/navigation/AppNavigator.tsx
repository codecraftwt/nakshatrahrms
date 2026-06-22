import React from 'react';
import { StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { setSessionExpiredModalVisible, logoutCandidate } from '../redux/slice/authSlice';
import { resetToLogin } from './navigationService';
import { CustomAlertModal } from '../components/CustomAlertModal';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { MainTabs } from './MainTabs';
import { PunchInScreen } from '../screens/PunchInScreen';
import { LiveTrackingScreen } from '../screens/LiveTrackingScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';
import { RegularisationScreen } from '../screens/RegularisationScreen';
import { ApplyLeaveScreen } from '../screens/ApplyLeaveScreen';
import { LeaveDetailScreen } from '../screens/LeaveDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AllLeavesScreen } from '../screens/AllLeavesScreen';
import { AllLogsScreen } from '../screens/AllLogsScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { theme, colors } = useTheme();
  const dispatch = useDispatch<any>();
  const isSessionExpiredModalVisible = useSelector((state: RootState) => state.auth.isSessionExpiredModalVisible);

  const handleSessionExpiredOk = () => {
    // 1. Hide the modal
    dispatch(setSessionExpiredModalVisible(false));
    
    // 2. Smoothly start navigation
    resetToLogin();
    
    // 3. Wait for animation, then wipe state
    setTimeout(() => {
      dispatch(logoutCandidate());
    }, 400);
  };

  return (
    <>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.bgPage} 
      />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SplashScreen">
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        
        {/* Sub screens */}
        <Stack.Screen name="PunchInScreen" component={PunchInScreen} />
        <Stack.Screen name="LiveTrackingScreen" component={LiveTrackingScreen} />
        <Stack.Screen name="RouteDetailScreen" component={RouteDetailScreen} />
        <Stack.Screen name="RegularisationScreen" component={RegularisationScreen} />
        <Stack.Screen name="ApplyLeaveScreen" component={ApplyLeaveScreen} />
        <Stack.Screen name="LeaveDetailScreen" component={LeaveDetailScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="AllLeavesScreen" component={AllLeavesScreen} />
        <Stack.Screen name="AllLogsScreen" component={AllLogsScreen} />
      </Stack.Navigator>

      <CustomAlertModal
        visible={isSessionExpiredModalVisible}
        title="Session Expired"
        message="Your token is expired or invalid. Please re-login to continue."
        type="error"
        onPrimaryPress={handleSessionExpiredOk}
      />
    </>
  );
};

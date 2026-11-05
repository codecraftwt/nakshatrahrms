import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, PermissionsAndroid, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { PrimaryButton } from '../components/PrimaryButton';
import { launchCamera, CameraOptions } from 'react-native-image-picker';
import { LocationService } from '../services/LocationService';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { postPunchIn, fetchGeoFencing } from '../redux/slice/attendanceSlice';
import { getDistanceInMeters } from '../utils/distance';
import Geolocation from 'react-native-geolocation-service';
import { ActivityIndicator, Modal } from 'react-native';
import { CustomAlertModal } from '../components/CustomAlertModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceSettingsModal } from '../components/DeviceSettingsModal';

export const PunchInScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { geoFencingData, statusData } = useSelector((state: RootState) => state.attendance);
  const { data: dashboardData } = useSelector((state: RootState) => state.dashboard);
  const isLiveTrackingDisabled = user?.track_live_location === false;

  const allowMobileAttendance =
    dashboardData?.allow_mobile_attendance ??
    dashboardData?.employee?.allow_mobile_attendance ??
    statusData?.allow_mobile_attendance ??
    user?.employee?.allow_mobile_attendance ??
    true;

  const canPunchIn =
    dashboardData?.can_punch_in ??
    statusData?.can_punch_in ??
    true;
  
  const isTargetDevice = Platform.OS === 'android' && ['vivo', 'oppo', 'oneplus'].includes(String(Platform.constants.Brand || Platform.constants.Manufacturer || '').toLowerCase());

  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [inRemarks, setInRemarks] = useState('');
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onPrimaryPress?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distanceToNearest, setDistanceToNearest] = useState<number | null>(null);
  const [nearestLocationInfo, setNearestLocationInfo] = useState<{name: string, latitude: number, longitude: number} | null>(null);

  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [deviceBrand, setDeviceBrand] = useState('');
  const [isInterceptingPunchIn, setIsInterceptingPunchIn] = useState(false);

  useEffect(() => {
    if (isTargetDevice && Platform.OS === 'android') {
      setDeviceBrand(String(Platform.constants.Brand || Platform.constants.Manufacturer || '').toLowerCase());
    }
  }, [isTargetDevice]);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'error', onPrimaryPress?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onPrimaryPress });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
    if (alertConfig.onPrimaryPress) {
      alertConfig.onPrimaryPress();
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    dispatch(fetchGeoFencing());

    const fetchLocation = async () => {
      try {
        const gpsEnabled = await LocationService.isLocationServicesEnabled();
        if (!gpsEnabled) return;
        
        const hasPermission = await LocationService.requestPermissions();
        if (!hasPermission) return;

        Geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.log('Map location error', error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (err) {
         console.warn(err);
      }
    };
    fetchLocation();
  }, [dispatch]);

  useEffect(() => {
    if (currentLocation && geoFencingData?.locations && geoFencingData.locations.length > 0) {
      let minDistance = Infinity;
      let nearestLoc = null;

      geoFencingData.locations.forEach((loc: any) => {
        const d = getDistanceInMeters(currentLocation.lat, currentLocation.lng, loc.latitude, loc.longitude);
        if (d < minDistance) {
          minDistance = d;
          nearestLoc = loc;
        }
      });

      setDistanceToNearest(minDistance);
      setNearestLocationInfo(nearestLoc);
    }
  }, [currentLocation, geoFencingData]);

  const takeSelfie = async () => {
    if (!allowMobileAttendance) {
      showAlert(
        'Mobile Attendance Restricted',
        'You are not allowed to punch in from the Mobile App because your attendance rule is Biometric, Manual.'
      );
      return;
    }

    if (!canPunchIn) {
      showAlert(
        'Cannot Punch In',
        'Punch in is currently not allowed for your attendance status.'
      );
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs access to your camera to take a selfie for punch in.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showAlert("Permission Denied", "Camera permission is required to take a selfie.");
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options: CameraOptions = {
      mediaType: 'photo',
      saveToPhotos: false,
      cameraType: 'front',
      quality: 0.5,
      maxWidth: 500,
      maxHeight: 500,
      includeBase64: true,
    };
    
    try {
      const result = await launchCamera(options);
      if (result.didCancel) {
        console.log('User cancelled camera picker');
      } else if (result.errorCode) {
        showAlert('Camera Error', result.errorMessage || 'Failed to open camera');
      } else if (result.assets && result.assets.length > 0) {
        setSelfieUri(result.assets[0].uri || null);
        setSelfieBase64(result.assets[0].base64 || null);
      }
    } catch (error) {
      showAlert('Error', 'An unexpected error occurred while opening the camera.');
      console.log('Error launching camera:', error);
    }
  };

  const handleConfirmPunchIn = async (skipDeviceCheck = false) => {
    if (loading) return;

    if (!allowMobileAttendance) {
      showAlert(
        'Mobile Attendance Restricted',
        'You are not allowed to punch in from the Mobile App because your attendance rule is Biometric, Manual.'
      );
      return;
    }

    if (!canPunchIn) {
      showAlert(
        'Cannot Punch In',
        'Punch in is currently not allowed for your attendance status.'
      );
      return;
    }

    if (!skipDeviceCheck) {
      try {
        let brand = '';
        if (Platform.OS === 'android') {
          brand = String(Platform.constants.Brand || Platform.constants.Manufacturer || '');
        }
        const lowerBrand = brand.toLowerCase();
        
        if (['vivo', 'oppo', 'oneplus'].includes(lowerBrand)) {
          const today = new Date().toISOString().split('T')[0];
          const lastShown = await AsyncStorage.getItem('@last_device_settings_shown_punchin');
          
          if (lastShown !== today) {
            setDeviceBrand(lowerBrand);
            setIsInterceptingPunchIn(true);
            setDeviceModalVisible(true);
            await AsyncStorage.setItem('@last_device_settings_shown_punchin', today);
            return;
          }
        }
      } catch (err) {
        console.warn('Device check failed', err);
      }
    }

    setLoading(true);

    try {
      // ── Step 0: Pre-check global Location/GPS status ─────────────────────────
      const gpsEnabled = await LocationService.isLocationServicesEnabled();
      if (!gpsEnabled) {
        await LocationService.promptEnableLocationServices();
        setLoading(false);
        return;
      }

      // ── Step 1: Request all permissions first ────────────────────────────────
      const hasLocationPermission = await LocationService.requestPermissions();
      if (!hasLocationPermission) {
        showAlert('Permission Denied', 'Location permission is required to punch in.');
        setLoading(false);
        return;
      }

      // ── Step 2: Take selfie ──────────────────────────────────────────────────
      // Do this before starting the background service because launchCamera()
      // briefly moves the app to the background on some devices.
      let currentSelfieUri = selfieUri;
      let currentSelfieBase64 = selfieBase64;

      if (!currentSelfieUri || !currentSelfieBase64) {
        await takeSelfie();
        // takeSelfie sets state — re-check after camera closes
        setLoading(false);
        return;
      }

      // ── Step 3: Get High-Accuracy GPS location ───────────────────────────────
      const position = await LocationService.getAccurateLocation();

      // ── Step 3.5: Geo Fencing Validation ───────────────────────────────────────
      if (geoFencingData?.geo_fencing && geoFencingData.locations && geoFencingData.locations.length > 0) {
        let isWithinRange = false;
        let minDist = Infinity;
        let nearestLocName = 'an office';
        
        for (const loc of geoFencingData.locations) {
          const d = getDistanceInMeters(position.coords.latitude, position.coords.longitude, loc.latitude, loc.longitude);
          if (d < minDist) {
            minDist = d;
            nearestLocName = loc.name;
          }
          if (d <= 50) {
            isWithinRange = true;
            break;
          }
        }
        
        if (!isWithinRange) {
          showAlert('Outside Geo-Fence', `You are not able to punch in. If you want to punch in, go near ${nearestLocName}.`);
          setLoading(false);
          return;
        }
      }

      // ── Step 4: Send punch-in to server ──────────────────────────────────────
      const payload = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        selfie: currentSelfieBase64,
        timestamp: new Date().toISOString(),
        in_remarks: inRemarks,
      };

      try {
        await dispatch(postPunchIn(payload)).unwrap();
      } catch (punchErr: any) {
        setLoading(false);
        const errMsg = typeof punchErr === 'string' ? punchErr : (punchErr?.message || 'Failed to punch in');
        showAlert('Punch In Failed', errMsg);
        return;
      }

      // ── Step 5: Start background tracking AFTER punch in succeeds ────────────
      let trackingStarted = false;
      if (user?.track_live_location !== false) {
        try {
          await LocationService.startTracking();
          trackingStarted = true;
        } catch (trackErr) {
          console.warn('PunchIn: Failed to start tracking:', trackErr);
          // Continue with punch-in anyway — worst case user has no live tracking
        }
      }

      // ── Step 6: Navigate to live tracking screen ──────────────────────────────
      setLoading(false);
      navigation.replace('LiveTrackingScreen');

    } catch (err: any) {
      console.error('Punch in error:', err);
      setLoading(false);
      if (err?.code !== undefined) {
        showAlert('Location Error', 'Failed to get current location. Please try again.');
      } else {
        const errMsg = typeof err === 'string' ? err : (err?.message || 'Failed to punch in. Please try again.');
        showAlert('Error', errMsg);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Punch in</Text>

        {isTargetDevice && (
          <TouchableOpacity style={styles.manualBtn} onPress={() => setDeviceModalVisible(true)}>
            <Icon name="book-open-page-variant" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        {geoFencingData?.geo_fencing && distanceToNearest !== null && (
          <View style={[styles.inRangeBadge, distanceToNearest > 50 ? { backgroundColor: colors.dangerBg } : undefined]}>
            <Text style={[styles.inRangeText, distanceToNearest > 50 ? { color: colors.danger } : undefined]}>
              {distanceToNearest <= 50 ? 'In range' : 'Out of range'}
            </Text>
          </View>
        )}
      </View>

      {!allowMobileAttendance && (
        <View style={[styles.bannerContainer, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
          <Icon name="lock-alert-outline" size={20} color={colors.danger} style={styles.bannerIcon} />
          <Text style={[styles.bannerText, { color: colors.danger }]}>
            You are not allowed to punch in from the Mobile App because your attendance rule is Biometric, Manual.
          </Text>
        </View>
      )}

      {isLiveTrackingDisabled && (
        <View style={styles.bannerContainer}>
          <Icon name="alert-circle-outline" size={20} color={colors.warning} style={styles.bannerIcon} />
          <Text style={styles.bannerText}>
            Live tracking is disabled. You can only punch in and punch out. Location must be enabled at the time of punching.
          </Text>
        </View>
      )}

      <KeyboardAwareScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} enableOnAndroid={true} extraScrollHeight={20}>
        <View style={styles.cameraContainer}>
          <TouchableOpacity style={styles.cameraBox} onPress={takeSelfie} activeOpacity={0.8}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={styles.cameraImage} />
            ) : (
              <>
                <View style={styles.iconCircleLarge}>
                  <Icon name="face-recognition" size={40} color={colors.primary} />
                </View>
                <Text style={styles.cameraInstruction}>Tap to capture selfie</Text>
                <Text style={styles.cameraPreviewText}>Required for punch in</Text>
              </>
            )}

            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </TouchableOpacity>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={styles.iconCircle}>
              <Icon name="map-marker-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>
                {geoFencingData?.geo_fencing 
                  ? (nearestLocationInfo ? nearestLocationInfo.name : 'Checking location...')
                  : (nearestLocationInfo ? nearestLocationInfo.name : 'Anywhere (Geo-fencing disabled)')}
              </Text>
              <Text style={styles.locationSub}>
                {nearestLocationInfo ? `${nearestLocationInfo.latitude.toFixed(4)}° N, ${nearestLocationInfo.longitude.toFixed(4)}° E` : ''}
              </Text>
            </View>
            {geoFencingData?.geo_fencing && distanceToNearest !== null && (
              <View style={[styles.distanceBadge, distanceToNearest > 50 ? { backgroundColor: colors.dangerBg } : undefined]}>
                <Text style={[styles.distanceText, distanceToNearest > 50 ? { color: colors.danger } : undefined]}>
                  {distanceToNearest <= 50 ? 'Within 50m' : `${Math.round(distanceToNearest)}m away`}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.locationRow}>
            <View style={styles.iconCircle}>
              <Icon name="clock-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Current Time</Text>
              <Text style={styles.locationSub}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Remarks (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter punch in remarks"
            placeholderTextColor={colors.textSecondary}
            value={inRemarks}
            onChangeText={setInRemarks}
            multiline
          />
        </View>

        <View style={styles.bottomSection}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.confirmBtn} />
          ) : (
            <PrimaryButton 
              label="✓ Confirm punch in"
              onPress={handleConfirmPunchIn}
              style={styles.confirmBtn}
            />
          )}
          <Text style={styles.helperText}>GPS + selfie will be captured</Text>
        </View>
      </KeyboardAwareScrollView>

      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onPrimaryPress={closeAlert}
      />

      <DeviceSettingsModal
        visible={deviceModalVisible}
        brand={deviceBrand}
        onClose={() => {
          setDeviceModalVisible(false);
          if (isInterceptingPunchIn) {
            setIsInterceptingPunchIn(false);
            handleConfirmPunchIn(true); // Continue with punch in
          }
        }}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.bgPage,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    ...Typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  manualBtn: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(21, 88, 176, 0.1)',
    borderRadius: 8,
  },
  inRangeBadge: {
    backgroundColor: colors.successBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  inRangeText: {
    color: colors.successText,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cameraContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  cameraBox: {
    width: '100%',
    aspectRatio: 1.1,
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  iconCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(21, 88, 176, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraInstruction: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  cameraPreviewText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  locationCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    padding: 16,
    marginTop: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.04)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(21, 88, 176, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: 'rgba(21, 88, 176, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.3,
    marginVertical: 12,
    marginLeft: 52,
  },
  inputContainer: {
    marginTop: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 80,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  bottomSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  confirmBtn: {
    height: 54,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  bannerIcon: {
    marginRight: 2,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.warningText,
    fontWeight: '500',
    lineHeight: 16,
  },
});

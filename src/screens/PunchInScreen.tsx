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
import { postPunchIn } from '../redux/slice/attendanceSlice';
import Geolocation from 'react-native-geolocation-service';
import { ActivityIndicator } from 'react-native';
import { CustomAlertModal } from '../components/CustomAlertModal';

export const PunchInScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isLiveTrackingDisabled = user?.track_live_location === false;
  
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

  const takeSelfie = async () => {
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

  const handleConfirmPunchIn = async () => {
    if (loading) return;

    setLoading(true);

    try {
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

      // ── Step 4: Send punch-in to server ──────────────────────────────────────
      const payload = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        selfie: currentSelfieBase64,
        timestamp: new Date().toISOString(),
        In_remarks: inRemarks,
      };

      try {
        await dispatch(postPunchIn(payload)).unwrap();
      } catch (punchErr) {
        throw punchErr;
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
        showAlert('Error', 'Failed to punch in. Please try again.');
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
        <View style={styles.inRangeBadge}>
          <Text style={styles.inRangeText}>In range</Text>
        </View>
      </View>

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
              <Text style={styles.locationTitle}>HQ Office</Text>
              <Text style={styles.locationSub}>19.0760° N, 72.8777° E</Text>
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>Within 200m</Text>
            </View>
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

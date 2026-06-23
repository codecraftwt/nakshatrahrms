import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { MetricTile } from '../components/MetricTile';
import { PrimaryButton } from '../components/PrimaryButton';
import { LocationService } from '../services/LocationService';
import { launchCamera, CameraOptions } from 'react-native-image-picker';
import { ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { postPunchOut } from '../redux/slice/attendanceSlice';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { usePipMode } from '../hooks/usePipMode';
import { CustomAlertModal } from '../components/CustomAlertModal';

import { PermissionsAndroid, Platform } from 'react-native';

export const LiveTrackingScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<{lat: number, lng: number} | null>(null);
  const [outRemarks, setOutRemarks] = React.useState('');
  const [alertConfig, setAlertConfig] = React.useState<{
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

  const { isPipMode, setPipAllowed } = usePipMode();

  React.useEffect(() => {
    setPipAllowed(true);
    return () => {
      setPipAllowed(false);
    };
  }, []);

  React.useEffect(() => {
    const fetchLocation = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            // Fallback so it doesn't spin forever
            setCurrentLocation({ lat: 16.7908, lng: 74.2816 });
            return;
          }
        }
        
        Geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.log('Map location error', error);
            // Fallback so it doesn't spin forever if emulator has no GPS
            setCurrentLocation({ lat: 16.7908, lng: 74.2816 });
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (err) {
        setCurrentLocation({ lat: 16.7908, lng: 74.2816 });
      }
    };
    
    fetchLocation();
  }, []);

  const handlePunchOut = async () => {
    setLoading(true);
    try {
      const options: CameraOptions = {
        mediaType: 'photo',
        saveToPhotos: false,
        cameraType: 'front',
        quality: 0.5,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: true,
      };

      const result = await launchCamera(options);
      if (result.didCancel) {
        setLoading(false);
        return;
      }
      if (result.errorCode || !result.assets || result.assets.length === 0) {
        showAlert('Error', 'Failed to capture selfie for punch out.');
        setLoading(false);
        return;
      }

      const base64Selfie = result.assets[0].base64;
      if (!base64Selfie) {
        showAlert('Error', 'Failed to read image data.');
        setLoading(false);
        return;
      }

      try {
        const position = await LocationService.getAccurateLocation();
        const payload = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          selfie: base64Selfie,
          timestamp: new Date().toISOString(),
          out_remarks: outRemarks,
        };
        
        await dispatch(postPunchOut(payload)).unwrap();
        await LocationService.stopTracking();
        
        showAlert('Success', 'Punched out successfully!', 'success', () => navigation.navigate('MainTabs'));
      } catch (err: any) {
        if (err.message && err.message.includes('Location timeout')) {
          showAlert('Location Error', 'Failed to get an accurate GPS lock. Please try again outside.');
        } else {
          showAlert('Error', 'Failed to punch out. Please try again.');
          console.error('Punch out error:', err);
        }
      } finally {
        setLoading(false);
      }
    } catch (err) {
      showAlert('Error', 'An unexpected error occurred during punch out.');
      console.error(err);
      setLoading(false);
    }
  };

  if (isPipMode) {
    return (
      <View style={{ flex: 1 }}>
        {currentLocation ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ width: '100%', height: '100%' }}
            initialRegion={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            pitchEnabled={false}
            rotateEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }} />
          </MapView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPage }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Modern PiP Overlays */}
        <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 }} />
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>LIVE</Text>
        </View>

        <View style={{ position: 'absolute', bottom: 12, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>Tracking Route...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {user?.track_live_location !== false ? 'Live tracking' : 'Punch Out'}
        </Text>
        {user?.track_live_location !== false && (
          <View style={styles.recordingBadge}>
            <Text style={styles.recordingText}>● Recording</Text>
          </View>
        )}
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} enableOnAndroid={true} extraScrollHeight={20}>
        <View style={styles.mapBox}>
          {currentLocation ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              initialRegion={{
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={{ latitude: currentLocation.lat, longitude: currentLocation.lng }} />
            </MapView>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
          
          <View style={styles.gpsActiveOverlay}>
            <View style={styles.greenDot} />
            <Text style={styles.gpsText}>GPS active</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <MetricTile label="Distance today" value="0.0" unit="km" />
          <MetricTile label="Time elapsed" value="Tracking..." subtext="since punch in" />
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.blueDot]} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeTitle}>HQ Office</Text>
              <Text style={styles.routeSub}>Punch in successful</Text>
            </View>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.routeRow}>
            <View style={styles.hollowCircle} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeTitle}>Current location</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Remarks (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter punch out remarks"
            placeholderTextColor={colors.textSecondary}
            value={outRemarks}
            onChangeText={setOutRemarks}
            multiline
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.danger} style={styles.punchOutBtn} />
        ) : (
          <PrimaryButton 
            label="⏹ Punch out"
            onPress={handlePunchOut}
            color={colors.danger}
            style={styles.punchOutBtn}
          />
        )}
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
    paddingVertical: 12,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    ...Typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  recordingBadge: {
    backgroundColor: colors.dangerBg,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  recordingText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '500',
  },
  body: {
    padding: 16,
    flexGrow: 1,
  },
  mapBox: {
    height: 450,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mapText: {
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  gpsActiveOverlay: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  gpsText: {
    color: colors.success,
    fontSize: 11,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    padding: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  blueDot: {
    backgroundColor: colors.primary,
  },
  hollowCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: 4,
  },
  verticalLine: {
    width: 2,
    height: 28,
    backgroundColor: colors.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  routeTextContainer: {
    marginLeft: 12,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  routeSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    marginTop: 24,
    marginBottom: 8,
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
  punchOutBtn: {
    marginTop: 'auto',
  },
});

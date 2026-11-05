import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Image, Modal } from 'react-native';
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
import { postPunchOut, fetchGeoFencing } from '../redux/slice/attendanceSlice';
import { fetchLiveKm, fetchKmSummary, fetchRouteData } from '../redux/slice/trackingSlice';
import { getDistanceInMeters } from '../utils/distance';
import Geolocation from 'react-native-geolocation-service';
import { OsmMapView } from '../components/OsmMapView';
import { usePipMode } from '../hooks/usePipMode';
import { CustomAlertModal } from '../components/CustomAlertModal';

import { PermissionsAndroid, Platform } from 'react-native';

export const LiveTrackingScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { liveKmData, kmSummaryData, routeData } = useSelector((state: RootState) => state.tracking);
  const { data: dashboardData } = useSelector((state: RootState) => state.dashboard);
  const { statusData, todayData, geoFencingData } = useSelector((state: RootState) => state.attendance);
  const [isMapExpanded, setIsMapExpanded] = React.useState(false);
  const [routeCoordinates, setRouteCoordinates] = React.useState<{ latitude: number, longitude: number }[]>([]);
  const mapRef = React.useRef<any>(null);
  const [loading, setLoading] = React.useState(false);

  const allowMobileAttendance =
    dashboardData?.allow_mobile_attendance ??
    dashboardData?.employee?.allow_mobile_attendance ??
    statusData?.allow_mobile_attendance ??
    user?.employee?.allow_mobile_attendance ??
    true;

  const canPunchOut =
    dashboardData?.can_punch_out ??
    statusData?.can_punch_out ??
    true;

  React.useEffect(() => {
    dispatch(fetchGeoFencing());
    dispatch(fetchLiveKm());
    dispatch(fetchKmSummary('today,month'));
    const today = new Date().toISOString().split('T')[0];
    dispatch(fetchRouteData(today));

    const interval = setInterval(() => {
      dispatch(fetchLiveKm());
      dispatch(fetchRouteData(today));
    }, 15000);

    return () => clearInterval(interval);
  }, [dispatch]);

  React.useEffect(() => {
    const sessions = routeData?.attendance_sessions || [];
    const ongoingSession = sessions.find((s: any) => !s.attendance?.check_out) || sessions[sessions.length - 1];
    let points: any[] = ongoingSession?.route || routeData?.route || [];

    if (points.length > 0) {
      const formattedPoints = points.slice()
        .sort((a: any, b: any) => {
          const timeA = new Date(a.datetime || a.recorded_at || 0).getTime();
          const timeB = new Date(b.datetime || b.recorded_at || 0).getTime();
          return timeA - timeB;
        })
        .map((pt: any) => ({
          latitude: Number(pt.lat || pt.latitude),
          longitude: Number(pt.lng || pt.longitude),
        }));
      setRouteCoordinates(formattedPoints);
    }
  }, [routeData]);
  const [currentLocation, setCurrentLocation] = React.useState<{ lat: number, lng: number } | null>(null);
  const [outRemarks, setOutRemarks] = React.useState('');
  const [selfieUri, setSelfieUri] = React.useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = React.useState<string | null>(null);

  const takeSelfie = async () => {
    try {
      setPipAllowed(false);
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
      setPipAllowed(true);

      if (result.didCancel) return;
      if (result.errorCode || !result.assets || result.assets.length === 0) {
        showAlert('Error', 'Failed to capture selfie.');
        return;
      }

      setSelfieUri(result.assets[0].uri || null);
      setSelfieBase64(result.assets[0].base64 || null);
    } catch (err) {
      showAlert('Error', 'Failed to capture selfie.');
    }
  };
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
    // Subscribe to background location updates in real-time
    const unsubscribe = LocationService.subscribeToLocationUpdates((lat, lng) => {
      setCurrentLocation({ lat, lng });
      setRouteCoordinates(prev => {
        const last = prev[prev.length - 1];
        if (last && last.latitude === lat && last.longitude === lng) return prev;
        return [...prev, { latitude: lat, longitude: lng }];
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const fetchLocation = async () => {
      try {
        const gpsEnabled = await LocationService.isLocationServicesEnabled();
        if (!gpsEnabled) {
          await LocationService.promptEnableLocationServices();
          setCurrentLocation({ lat: 16.7908, lng: 74.2816 });
          return;
        }

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
    if (!allowMobileAttendance) {
      showAlert(
        'Mobile Attendance Restricted',
        'You are not allowed to punch out from the Mobile App because your attendance rule is Biometric, Manual.'
      );
      return;
    }

    if (!canPunchOut) {
      showAlert(
        'Cannot Punch Out',
        'Punch out is currently not allowed for your attendance status.'
      );
      return;
    }

    setLoading(true);
    try {
      let base64Selfie = selfieBase64;

      if (user?.track_live_location === false) {
        if (!base64Selfie) {
          setPipAllowed(false);
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
          setPipAllowed(true);

          if (result.didCancel) {
            setLoading(false);
            return;
          }
          if (result.errorCode || !result.assets || result.assets.length === 0) {
            showAlert('Error', 'Failed to capture selfie for punch out.');
            setLoading(false);
            return;
          }

          base64Selfie = result.assets[0].base64 || null;
          if (!base64Selfie) {
            showAlert('Error', 'Failed to read image data.');
            setLoading(false);
            return;
          }

          setSelfieUri(result.assets[0].uri || null);
          setSelfieBase64(base64Selfie);
        }
      } else {
        setPipAllowed(false);
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
        setPipAllowed(true);

        if (result.didCancel) {
          setLoading(false);
          return;
        }
        if (result.errorCode || !result.assets || result.assets.length === 0) {
          showAlert('Error', 'Failed to capture selfie for punch out.');
          setLoading(false);
          return;
        }

        base64Selfie = result.assets[0].base64 || null;
        if (!base64Selfie) {
          showAlert('Error', 'Failed to read image data.');
          setLoading(false);
          return;
        }
      }

      try {
        const position = await LocationService.getAccurateLocation();

        // ── Geo Fencing Validation for Punch Out ──────────────────────────────────
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
            showAlert('Outside Geo-Fence', `You are not able to punch out. If you want to punch out, go near ${nearestLocName}.`);
            setLoading(false);
            return;
          }
        }

        const sessions = routeData?.attendance_sessions || [];
        const ongoingSession = sessions.find((s: any) => !s.attendance?.check_out) || sessions[sessions.length - 1];

        // Comprehensive fallback for attendance_id since routeData may not have it instantly
        const attendanceId = ongoingSession?.attendance_id ||
          ongoingSession?.attendance?.id ||
          dashboardData?.attendance_id ||
          dashboardData?.id ||
          statusData?.attendance_id ||
          statusData?.id ||
          todayData?.id;

        if (!attendanceId) {
          showAlert('Error', 'Could not determine active attendance session for punch out. Please wait a moment and try again.');
          setLoading(false);
          return;
        }

        const payload = {
          attendance_id: attendanceId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          selfie: base64Selfie as string,
          timestamp: new Date().toISOString(),
          out_remarks: outRemarks,
        };

        try {
          await dispatch(postPunchOut(payload)).unwrap();
          await LocationService.stopTracking();
          showAlert('Success', 'Punched out successfully!', 'success', () => navigation.navigate('MainTabs'));
        } catch (punchErr: any) {
          const errMsg = typeof punchErr === 'string' ? punchErr : (punchErr?.message || 'Failed to punch out');
          showAlert('Punch Out Failed', errMsg);
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Location timeout')) {
          showAlert('Location Error', 'Failed to get an accurate GPS lock. Please try again outside.');
        } else {
          const errMsg = typeof err === 'string' ? err : (err?.message || 'Failed to punch out. Please try again.');
          showAlert('Error', errMsg);
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

  const renderMap = (expanded: boolean) => (
    <View style={expanded ? styles.expandedMapContainer : styles.mapBox}>
      {currentLocation ? (
        <OsmMapView
          ref={expanded ? mapRef : undefined}
          style={{ width: '100%', height: '100%', borderRadius: expanded ? 0 : 12 }}
          region={{
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            latitudeDelta: expanded ? 0.005 : 0.01,
            longitudeDelta: expanded ? 0.005 : 0.01,
          }}
          polylines={routeCoordinates.length > 0 ? [{ coordinates: routeCoordinates, strokeColor: colors.primary, strokeWidth: 4 }] : []}
          markers={[{ coordinate: { latitude: currentLocation.lat, longitude: currentLocation.lng }, pinColor: 'blue' }]}
        />
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}

      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setIsMapExpanded(!expanded)}
      >
        <Icon name={expanded ? "fullscreen-exit" : "fullscreen"} size={28} color={colors.primary} />
      </TouchableOpacity>

      {!expanded && (
        <View style={styles.gpsActiveOverlay}>
          <View style={styles.greenDot} />
          <Text style={styles.gpsText}>GPS active</Text>
        </View>
      )}
    </View>
  );

  if (isPipMode) {
    return (
      <View style={{ flex: 1 }}>
        {currentLocation ? (
          <OsmMapView
            style={{ width: '100%', height: '100%' }}
            region={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            polylines={routeCoordinates.length > 0 ? [{ coordinates: routeCoordinates, strokeColor: colors.primary, strokeWidth: 4 }] : []}
            markers={[{ coordinate: { latitude: currentLocation.lat, longitude: currentLocation.lng }, pinColor: 'blue' }]}
          />
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

      <KeyboardAwareScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={true} enableOnAndroid={true} extraScrollHeight={20}>
        {user?.track_live_location !== false ? (
          <>
            {renderMap(false)}
            <Modal visible={isMapExpanded} animationType="slide" transparent={false} onRequestClose={() => setIsMapExpanded(false)}>
              <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setIsMapExpanded(false)} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Live Route</Text>
                </View>
                {renderMap(true)}
              </SafeAreaView>
            </Modal>
          </>
        ) : (
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
                  <Text style={styles.cameraPreviewText}>Required for punch out</Text>
                </>
              )}

              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.metricRow}>
          <MetricTile
            label="Distance today"
            value={liveKmData?.live_km !== undefined ? liveKmData.live_km.toFixed(1) : (kmSummaryData?.today?.total_km !== undefined ? kmSummaryData.today.total_km.toFixed(1) : "0.0")}
            unit="km"
          />
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
    height: 280,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  expandedMapContainer: {
    flex: 1,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  expandButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  cameraContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraBox: {
    width: '100%',
    aspectRatio: 1.6,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 8,
    left: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 6,
  },
  iconCircleLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(21, 88, 176, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cameraInstruction: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cameraPreviewText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

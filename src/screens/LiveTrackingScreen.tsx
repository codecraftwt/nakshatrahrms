import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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
import { Alert, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { postPunchOut } from '../redux/slice/attendanceSlice';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export const LiveTrackingScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<{lat: number, lng: number} | null>(null);

  React.useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.log('Map location error', error),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
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
        Alert.alert('Error', 'Failed to capture selfie for punch out.');
        setLoading(false);
        return;
      }

      const base64Selfie = result.assets[0].base64;
      if (!base64Selfie) {
        Alert.alert('Error', 'Failed to read image data.');
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            const payload = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              selfie: base64Selfie,
              timestamp: new Date().toISOString(),
            };
            
            await dispatch(postPunchOut(payload)).unwrap();
            await LocationService.stopTracking();
            
            Alert.alert('Success', 'Punched out successfully!', [
              { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
            ]);
          } catch (err) {
            Alert.alert('Error', 'Failed to punch out. Please try again.');
            console.error('Punch out error:', err);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          Alert.alert('Error', 'Failed to get current location.');
          setLoading(false);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live tracking</Text>
        <View style={styles.recordingBadge}>
          <Text style={styles.recordingText}>● Recording</Text>
        </View>
      </View>

      <View style={styles.body}>
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
      </View>
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
    flex: 1,
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
  punchOutBtn: {
    marginTop: 'auto',
  },
});

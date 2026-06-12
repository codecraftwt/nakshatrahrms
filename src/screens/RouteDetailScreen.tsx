import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { MetricTile } from '../components/MetricTile';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRouteData } from '../redux/slice/trackingSlice';
import { RootState, AppDispatch } from '../redux/store';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

export const RouteDetailScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const route = useRoute<any>();
  const dateParam = route.params?.date;

  const dispatch = useDispatch<AppDispatch>();
  const { routeData, routeLoading } = useSelector((state: RootState) => state.tracking);
  const { historyData } = useSelector((state: RootState) => state.attendance);

  useFocusEffect(
    React.useCallback(() => {
      if (dateParam) {
        dispatch(fetchRouteData(dateParam));
      }
    }, [dispatch, dateParam])
  );

  const routePoints = routeData?.route?.map((pt: any) => ({
    latitude: Number(pt.lat || pt.latitude),
    longitude: Number(pt.lng || pt.longitude),
  })) || [];

  const startLocation = routePoints.length > 0 ? routePoints[0] : null;
  const endLocation = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;

  // Find attendance record for this date to get punch in/out times
  const record = historyData?.records?.find((r: any) => r.date === dateParam);
  const attendance = record?.attendances?.[0];
  
  const formatTimeStr = (dateTimeStr: string) => {
    if (!dateTimeStr) return '--:--';
    const timePart = dateTimeStr.split(' ')[1];
    if (!timePart) return dateTimeStr;
    const [h, m] = timePart.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
  };

  const punchInTime = attendance?.check_in ? formatTimeStr(attendance.check_in) : 'Not Punched In';
  const punchOutTime = attendance?.check_out ? formatTimeStr(attendance.check_out) : 'Ongoing';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route · {routeData?.date || dateParam || ''}</Text>
        <Text style={styles.headerDistance}>{routeData?.total_km !== undefined ? routeData.total_km.toFixed(1) : '0.0'} km</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.mapBox}>
          {routePoints.length > 0 ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              initialRegion={{
                latitude: startLocation.latitude,
                longitude: startLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Polyline
                coordinates={routePoints}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
              {startLocation && (
                <Marker coordinate={startLocation} pinColor="green" title="Start Location" />
              )}
              {endLocation && (
                <Marker coordinate={endLocation} pinColor="red" title="End Location" />
              )}
            </MapView>
          ) : (
            <>
              <Icon name="map-marker-path" size={28} color={colors.textSecondary} />
              <Text style={styles.mapText}>No route data available</Text>
            </>
          )}
        </View>

        <View style={styles.metricRow}>
          <MetricTile label="Total distance" value={routeData?.total_km !== undefined ? routeData.total_km.toFixed(1) : '0.0'} unit="km" />
          <MetricTile label="Total points" value={routeData?.total_points || 0} subtext="captured" />
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Punch in</Text>
            <Text style={styles.detailValue}>{punchInTime}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Punch out</Text>
            <Text style={styles.detailValue}>{punchOutTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Selfie</Text>
            <View style={styles.selfiePlaceholder} />
          </View>
        </View>
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
  headerDistance: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  body: {
    padding: 16,
    flex: 1,
  },
  mapBox: {
    height: 520,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.border,
  },
  selfiePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
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

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (dateParam) {
        dispatch(fetchRouteData(dateParam));
      }
    }, [dispatch, dateParam])
  );

  useEffect(() => {
    if (routeData?.attendance_sessions?.length === 1) {
      setSelectedSessionId(routeData.attendance_sessions[0].attendance_id);
    } else {
      setSelectedSessionId(null);
    }
  }, [routeData]);

  const formatTimeStr = (dateTimeStr: string) => {
    if (!dateTimeStr) return '--:--';

    let isoStr = dateTimeStr;
    if (dateTimeStr.includes(' ') && !dateTimeStr.includes('T')) {
      isoStr = dateTimeStr.replace(' ', 'T') + 'Z';
    }
    const d = new Date(isoStr);

    if (isNaN(d.getTime())) {
      const timePart = dateTimeStr.split(' ')[1];
      if (!timePart) return dateTimeStr;
      const [h, m] = timePart.split(':');
      let hours = parseInt(h, 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${m} ${ampm}`;
    }

    let hours = d.getHours();
    let minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const sessions = routeData?.attendance_sessions || [];

  // 1. Loading State
  if (routeLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Routes</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // 2. List View (Multiple Sessions, None Selected)
  if (sessions.length > 1 && selectedSessionId === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Route Session</Text>
        </View>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {sessions.map((session: any, index: number) => {
            const punchIn = session.attendance?.check_in ? formatTimeStr(session.attendance.check_in) : '--:--';
            const punchOut = session.attendance?.check_out ? formatTimeStr(session.attendance.check_out) : 'Ongoing';
            return (
              <TouchableOpacity 
                key={session.attendance_id} 
                style={styles.sessionCard}
                activeOpacity={0.8}
                onPress={() => setSelectedSessionId(session.attendance_id)}
              >
                <View style={styles.sessionHeader}>
                  <Icon name="map-marker-path" size={20} color={colors.primary} />
                  <Text style={styles.sessionTitle}>Route Session {index + 1}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.sessionRow}>
                  <View style={styles.sessionCol}>
                    <Text style={styles.sessionLabel}>Punch In</Text>
                    <Text style={styles.sessionValue}>{punchIn}</Text>
                  </View>
                  <View style={styles.sessionCol}>
                    <Text style={styles.sessionLabel}>Punch Out</Text>
                    <Text style={styles.sessionValue}>{punchOut}</Text>
                  </View>
                </View>
                <View style={styles.sessionRow}>
                  <View style={styles.sessionCol}>
                    <Text style={styles.sessionLabel}>Distance</Text>
                    <Text style={styles.sessionValue}>{session.total_km?.toFixed(2)} km</Text>
                  </View>
                  <View style={styles.sessionCol}>
                    <Text style={styles.sessionLabel}>Points Tracked</Text>
                    <Text style={styles.sessionValue}>{session.total_points}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. Map Detail View
  const activeSession = selectedSessionId 
    ? sessions.find((s: any) => s.attendance_id === selectedSessionId)
    : (sessions.length === 1 ? sessions[0] : null);

  const routePoints = (activeSession ? activeSession.route : routeData?.route)
    ?.slice()
    .sort((a: any, b: any) => {
      const timeA = new Date(a.datetime || a.recorded_at || 0).getTime();
      const timeB = new Date(b.datetime || b.recorded_at || 0).getTime();
      return timeA - timeB;
    })
    .map((pt: any) => ({
      latitude: Number(pt.lat || pt.latitude),
      longitude: Number(pt.lng || pt.longitude),
    })) || [];

  const startLocation = routePoints.length > 0 ? routePoints[0] : null;
  const endLocation = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;

  // Find attendance record for this date to get punch in/out times (fallback)
  const record = historyData?.records?.find((r: any) => r.date === dateParam);
  const attendance = activeSession ? activeSession.attendance : record?.attendances?.[0];

  const punchInTime = attendance?.check_in ? formatTimeStr(attendance.check_in) : 'Not Punched In';
  const punchOutTime = attendance?.check_out ? formatTimeStr(attendance.check_out) : 'Ongoing';
  const displayKm = activeSession?.total_km ?? routeData?.total_km;
  const displayPoints = activeSession?.total_points ?? routeData?.total_points;

  const handleBack = () => {
    if (sessions.length > 1 && selectedSessionId !== null) {
      setSelectedSessionId(null);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route · {routeData?.date || dateParam || ''}</Text>
        <Text style={styles.headerDistance}>{displayKm !== undefined ? displayKm.toFixed(1) : '0.0'} km</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.mapBox}>
          {routePoints.length > 0 ? (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              initialRegion={{
                latitude: startLocation.latitude,
                longitude: startLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onLayout={() => {
                if (routePoints.length > 1 && mapRef.current) {
                  mapRef.current.fitToCoordinates(routePoints, {
                    edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
                    animated: false,
                  });
                }
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
          <MetricTile label="Total distance" value={displayKm !== undefined ? displayKm.toFixed(1) : '0.0'} unit="km" />
          <MetricTile label="Total points" value={displayPoints || 0} subtext="captured" />
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
        </View>
      </ScrollView>
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
    flexGrow: 1,
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
    marginVertical: 4,
  },
  selfiePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  sessionCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.05)',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sessionCol: {
    flex: 1,
  },
  sessionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sessionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});

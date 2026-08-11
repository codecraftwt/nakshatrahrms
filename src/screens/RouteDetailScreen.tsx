import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, BackHandler, Modal, Pressable } from 'react-native';
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
import { OsmMapView } from '../components/OsmMapView';

const formatBackendTime = (timeStr?: string) => {
  if (!timeStr) return undefined;
  const parts = timeStr.split(':');
  if (parts.length !== 3) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const RouteDetailScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const route = useRoute<any>();
  const dateParam = route.params?.date;

  const dispatch = useDispatch<AppDispatch>();
  const { routeData, routeLoading } = useSelector((state: RootState) => state.tracking);
  const { historyData } = useSelector((state: RootState) => state.attendance);

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const mapRef = useRef<any>(null);


  const isCorrectDate = !dateParam || routeData?.date === dateParam;
  const sessions = isCorrectDate ? (routeData?.attendance_sessions || []) : [];
  
  const isOngoingRef = useRef(false);
  useEffect(() => {
    isOngoingRef.current = sessions.some((session: any) => !session.attendance?.check_out);
  }, [sessions]);

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (sessions.length > 1 && selectedSessionId !== null) {
          setSelectedSessionId(null);
          return true;
        }
        navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [sessions.length, selectedSessionId, navigation])
  );

  useFocusEffect(
    React.useCallback(() => {
      let intervalId: NodeJS.Timeout;

      if (dateParam) {
        // Initial fetch
        dispatch(fetchRouteData(dateParam));

        // Setup polling if viewing today's date
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

        if (dateParam === todayStr) {
          intervalId = setInterval(() => {
            if (isOngoingRef.current) {
              dispatch(fetchRouteData(dateParam));
            }
          }, 10000); // Poll every 10 seconds only if ongoing
        }
      }

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }, [dispatch, dateParam])
  );

  // Removed auto-select for single session to always show the list first

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

  // const sessions = routeData?.attendance_sessions || [];

  // 1. Loading State
  if (routeLoading && !isCorrectDate) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // 2. List View (Show if there are any sessions and none is selected)
  if (sessions.length > 0 && selectedSessionId === null) {
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
                  {!session.attendance?.check_out && (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveIndicator} />
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  )}
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
                    <Text style={styles.sessionValue}>{session.travelledDistance?.toFixed(2)} km</Text>
                  </View>
                  <View style={styles.sessionCol}>
                    <Text style={styles.sessionLabel}>Total Time</Text>
                    <Text style={styles.sessionValue}>{session.totalTime ? formatBackendTime(session.totalTime) : '--:--'}</Text>
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

  const routePoints = (activeSession ? activeSession.route : (isCorrectDate ? routeData?.route : []))
    ?.slice()
    .sort((a: any, b: any) => {
      const timeA = new Date(a.datetime || a.recorded_at || 0).getTime();
      const timeB = new Date(b.datetime || b.recorded_at || 0).getTime();
      return timeA - timeB;
    })
    .map((pt: any) => ({
      latitude: Number(pt.lat || pt.latitude),
      longitude: Number(pt.lng || pt.longitude),
      datetime: pt.datetime || pt.recorded_at,
      segment_km: pt.segment_km || 0
    })) || [];

  let movingTimeMs = 0;
  let idleTimeMs = 0;
  let movingKm = 0;
  let idleKm = 0;

  if (routePoints.length > 1) {
    for (let i = 1; i < routePoints.length; i++) {
      const prev = routePoints[i - 1];
      const curr = routePoints[i];
      if (!prev.datetime || !curr.datetime) continue;

      const timeA = new Date(prev.datetime).getTime();
      const timeB = new Date(curr.datetime).getTime();
      const diffMs = Math.max(0, timeB - timeA);

      const diffHours = diffMs / (1000 * 60 * 60);
      const speedKmh = diffHours > 0 ? (curr.segment_km / diffHours) : 0;

      // If speed is less than 2 km/h, consider it idle/fluctuation.
      if (speedKmh < 2.0) {
        idleTimeMs += diffMs;
        idleKm += (curr.segment_km || 0);
      } else {
        movingTimeMs += diffMs;
        movingKm += (curr.segment_km || 0);
      }
    }
  }

  const formatDuration = (ms: number) => {
    if (ms === 0) return '0m';
    const totalMins = Math.floor(ms / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const startLocation = routePoints.length > 0 ? routePoints[0] : null;
  const endLocation = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;

  // Find attendance record for this date to get punch in/out times (fallback)
  const record = historyData?.records?.find((r: any) => r.date === dateParam);
  const attendance = activeSession ? activeSession.attendance : record?.attendances?.[0];

  const punchInTime = (isCorrectDate || record) && attendance?.check_in ? formatTimeStr(attendance.check_in) : '--:--';
  const isOngoing = (isCorrectDate || record) && !attendance?.check_out;
  const punchOutTime = isOngoing ? 'Ongoing' : formatTimeStr(attendance?.check_out);
  const displayKm = isCorrectDate ? (activeSession?.total_km ?? routeData?.total_km) : undefined;
  const displayPoints = isCorrectDate ? (activeSession?.total_points ?? routeData?.total_points) : undefined;

  const finalMovingKm = activeSession?.travelledDistance ?? routeData?.travelledDistance ?? movingKm;
  const finalIdleKm = activeSession?.standingDistance ?? routeData?.standingDistance ?? idleKm;
  const backendMovingTime = activeSession?.travelledTime ?? routeData?.travelledTime;
  const backendIdleTime = activeSession?.standingTime ?? routeData?.standingTime;
  const backendTotalTime = activeSession?.totalTime ?? routeData?.totalTime;

  const displayMovingTime = backendMovingTime ? (formatBackendTime(backendMovingTime) ?? formatDuration(movingTimeMs)) : formatDuration(movingTimeMs);
  const displayIdleTime = backendIdleTime ? (formatBackendTime(backendIdleTime) ?? formatDuration(idleTimeMs)) : formatDuration(idleTimeMs);
  const displayTotalTime = backendTotalTime ? (formatBackendTime(backendTotalTime) ?? formatDuration(movingTimeMs + idleTimeMs)) : formatDuration(movingTimeMs + idleTimeMs);

  const punchInSelfie = activeSession?.punch_in_selfie;
  const punchOutSelfie = activeSession?.punch_out_selfie;

  const renderSelfie = (base64Str?: string) => {
    if (!base64Str) return <View style={styles.selfiePlaceholder} />;
    const uri = base64Str.startsWith('data:image') ? base64Str : `data:image/jpeg;base64,${base64Str}`;
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => setViewerImage(uri)}>
        <Image source={{ uri }} style={styles.selfiePlaceholder} />
      </TouchableOpacity>
    );
  };

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
            <OsmMapView
              ref={mapRef}
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
              fitToCoordinates={routePoints.length > 1 ? routePoints : undefined}
              polylines={[{ coordinates: routePoints, strokeColor: "#4285F4", strokeWidth: 4 }]}
              markers={[
                ...(startLocation ? [{ coordinate: startLocation, pinColor: 'green', title: 'Start Location' }] : []),
                ...(endLocation ? [{
                  coordinate: endLocation,
                  pinColor: isOngoing ? 'blue' : 'red',
                  title: isOngoing ? 'Current Location' : 'End Location'
                }] : [])
              ]}
            />
          ) : routeLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Icon name="map-marker-path" size={28} color={colors.textSecondary} />
              <Text style={styles.mapText}>No route data available</Text>
            </>
          )}
        </View>

        <View style={styles.metricRow}>
          <MetricTile label="Total Distance" value={displayKm !== undefined ? displayKm.toFixed(2) : '0.00'} unit="km" />
          <MetricTile label="Total Time" value={displayTotalTime} subtext="tracked" />
        </View>

        {(routePoints.length > 1 || backendMovingTime) && (
          <View style={styles.metricRow}>
            <MetricTile
              label="Travelled Time"
              value={displayMovingTime}
              subtext={`${finalMovingKm.toFixed(2)} km covered`}
            />
            <MetricTile
              label="Standing Time"
              value={displayIdleTime}
              subtext={`${finalIdleKm.toFixed(2)} km fluctuation`}
            />
          </View>
        )}

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View>
              <Text style={styles.detailLabel}>Punch in</Text>
              <Text style={styles.detailValue}>{punchInTime}</Text>
            </View>
            {renderSelfie(punchInSelfie)}
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View>
              <Text style={styles.detailLabel}>Punch out</Text>
              <Text style={styles.detailValue}>{punchOutTime}</Text>
            </View>
            {renderSelfie(punchOutSelfie)}
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={viewerImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={styles.viewerCloseBtn}
            onPress={() => setViewerImage(null)}
            activeOpacity={0.7}
          >
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
  viewerCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
    letterSpacing: 0.5,
  },
});

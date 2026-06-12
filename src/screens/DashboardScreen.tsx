import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { MetricTile } from '../components/MetricTile';
import { mockUser, mockDashboard } from '../data/mockData';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardSummary } from '../redux/slice/dashboardSlice';
import { fetchCurrentShift, fetchAssignedShift } from '../redux/slice/shiftSlice';
import { fetchPayrollShiftDetails } from '../redux/slice/payrollSlice';
import { fetchLiveKm, fetchDailyKm, fetchKmSummary } from '../redux/slice/trackingSlice';
import { RootState, AppDispatch } from '../redux/store';

export const DashboardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const dispatch = useDispatch<AppDispatch>();
  const { data: dashboardData, loading } = useSelector((state: RootState) => state.dashboard);
  const { data: shiftData, assignedData } = useSelector((state: RootState) => state.shift);
  const { liveKmData, kmSummaryData } = useSelector((state: RootState) => state.tracking);

  const formatTime = (time: number | undefined) => {
    if (time === undefined || time === null) return '';
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getSafeHours = (hours: number | undefined) => {
    if (!hours) return 0;
    // Backend bug: returning seconds instead of hours
    if (hours > 24) return hours / 3600;
    return hours;
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchDashboardSummary());
      dispatch(fetchCurrentShift());
      dispatch(fetchAssignedShift());
      dispatch(fetchPayrollShiftDetails());
      dispatch(fetchLiveKm());

      // Fetch today's daily KM as a baseline
      const today = new Date().toISOString().split('T')[0];
      dispatch(fetchDailyKm(today));
      
      // Fetch KM Summary for the dashboard metric tiles
      dispatch(fetchKmSummary('today,month'));
    }, [dispatch])
  );

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good morning, {dashboardData?.employee?.name?.split(' ')[0] || 'User'}</Text>
          <Text style={styles.subGreeting}>{dashboardData?.employee?.designation || 'Employee'} · {dashboardData?.employee?.employee_code || ''}</Text>
        </View>
        <TouchableOpacity 
          style={styles.avatar} 
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>{dashboardData?.employee?.name ? dashboardData.employee.name.charAt(0) : 'U'}</Text>
          <View style={styles.onlineDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Premium Punch Card */}
        <View style={styles.punchCard}>
          {/* Decorative Background Elements */}
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />

          <View style={styles.punchHeader}>
            <Text style={styles.punchDate}>Today, {dashboardData?.date || ''}</Text>
            <View style={styles.badgeContainer}>
              <Icon name="clock-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>{dashboardData?.attendance_state === 'checked_in' ? 'Working' : 'Pending'}</Text>
            </View>
          </View>

          <Text style={styles.punchStatus}>
            {dashboardData?.attendance_state === 'checked_in' ? 'Currently Punched In' : 'Ready for work?'}
          </Text>
          <Text style={styles.punchSubStatus}>
            {dashboardData?.attendance_state === 'checked_in' 
              ? `You have worked ${getSafeHours(dashboardData?.hours_today).toFixed(1)} hours today.` 
              : "You haven't punched in yet today."}
          </Text>
          
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              style={styles.punchBtn}
              activeOpacity={0.9}
              onPress={() => {
                if (dashboardData?.attendance_state === 'checked_in' || dashboardData?.can_punch_out) {
                  navigation.navigate('LiveTrackingScreen');
                } else {
                  navigation.navigate('PunchInScreen');
                }
              }}
            >
              <Icon name="fingerprint" size={20} color={colors.punchBtnText} style={styles.punchBtnIcon} />
              <Text style={styles.punchBtnText}>
                {dashboardData?.can_punch_out ? 'Punch out now' : 'Punch in now'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.metricRow}>
          <MetricTile 
            label="KM Today" 
            value={liveKmData?.live_km !== undefined ? liveKmData.live_km.toFixed(1) : (kmSummaryData?.today?.total_km !== undefined ? kmSummaryData.today.total_km.toFixed(1) : "0.0")} 
            unit="km" 
          />
          <MetricTile 
            label="KM Month" 
            value={kmSummaryData?.month?.total_km !== undefined ? kmSummaryData.month.total_km.toFixed(1) : "0.0"} 
            unit="km" 
          />
        </View>

        <View style={styles.metricRow}>
          <MetricTile label="Present" value="0" subtext="this month" />
          <MetricTile label="Leave Balance" value="0" subtext="days left" />
        </View>

        <Text style={styles.sectionTitle}>Shift Details</Text>

        {/* Current Shift */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftIconBox}>
            <Icon name="briefcase-clock-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.shiftLeft}>
            <Text style={styles.shiftName}>Current: {shiftData?.name || dashboardData?.shift?.name || dashboardData?.employee?.shift?.name || 'GEN'}</Text>
            <Text style={styles.shiftTime}>
              {shiftData?.sessions?.length > 0 
                ? `${formatTime(shiftData.sessions[0].in_time)} - ${formatTime(shiftData.sessions[shiftData.sessions.length - 1].out_time)}`
                : '09:30 - 18:00'}
            </Text>
          </View>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>

        {/* Assigned Shift */}
        <View style={[styles.shiftCard, { marginTop: 12 }]}>
          <View style={styles.shiftIconBox}>
            <Icon name="calendar-clock-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.shiftLeft}>
            <Text style={styles.shiftName}>Assigned: {assignedData?.name || dashboardData?.shift?.name || dashboardData?.employee?.shift?.name || 'GEN'}</Text>
            <Text style={styles.shiftTime}>
              {assignedData?.sessions?.length > 0 
                ? `${formatTime(assignedData.sessions[0].in_time)} - ${formatTime(assignedData.sessions[assignedData.sessions.length - 1].out_time)}`
                : '09:30 - 18:00'}
            </Text>
          </View>
        </View>
        
        <View style={{ height: 20 }} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.bgPage,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarText: {
    fontSize: 16,
    color: '#FFFFFF', // Keep white since primary background guarantees contrast
    fontWeight: '600',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bgPage,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  punchCard: {
    backgroundColor: colors.bgPunchCard,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  decoCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40,
    right: -20,
  },
  decoCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -80,
    left: -40,
  },
  punchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  punchDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  punchStatus: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  punchSubStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    marginBottom: 24,
  },
  punchBtn: {
    backgroundColor: colors.punchBtnBg,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  punchBtnIcon: {
    marginRight: 8,
  },
  punchBtnText: {
    color: colors.punchBtnText,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  shiftCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.05)',
  },
  shiftIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shiftLeft: {
    flex: 1,
  },
  shiftName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shiftTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  activeBadgeText: {
    color: colors.successText,
    fontSize: 12,
    fontWeight: '600',
  },
});

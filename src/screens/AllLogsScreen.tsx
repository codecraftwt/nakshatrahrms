import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { StatusBadge } from '../components/StatusBadge';

export const AllLogsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const { historyData } = useSelector((state: RootState) => state.attendance);
  const { user } = useSelector((state: RootState) => state.auth);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const logs = historyData?.records?.filter((r: any) => r.date <= todayStr).slice().reverse() || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Logs</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {logs.map((item: any, idx: number) => {
            const attendance = item.attendances?.[0];
            const leave = item.leave_requests?.[0];

            let badgeStatus = item.status || 'present';
            let iconName = 'check-circle-outline';
            let iconColor = colors.success;

            if (badgeStatus === 'leave') {
              iconName = 'calendar-minus';
              iconColor = colors.warning;
            } else if (badgeStatus === 'absent') {
              iconName = 'close-circle-outline';
              iconColor = colors.danger;
            } else if (badgeStatus === 'half_day') {
              iconName = 'clock-outline';
              iconColor = '#7C54D1';
            }

            return (
              <TouchableOpacity 
                key={idx} 
                style={styles.listCard}
                activeOpacity={0.8}
                disabled={!(badgeStatus === 'present' || badgeStatus === 'half_day') || user?.track_live_location === false}
                onPress={() => {
                  if ((badgeStatus === 'present' || badgeStatus === 'half_day') && user?.track_live_location !== false) {
                    navigation.navigate('RouteDetailScreen', { date: item.date });
                  }
                }}
              >
                <View style={styles.listIconBox}>
                  <Icon 
                    name={iconName} 
                    size={24} 
                    color={iconColor} 
                  />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.itemDate}>{item.date}</Text>
                  {attendance?.check_in && <Text style={styles.itemTime}>In: {(() => {
                    let isoStr = attendance.check_in;
                    if (isoStr.includes(' ') && !isoStr.includes('T')) {
                      isoStr = isoStr.replace(' ', 'T') + 'Z';
                    }
                    const d = new Date(isoStr);
                    if (isNaN(d.getTime())) return attendance.check_in.split(' ')[1];
                    let hours = d.getHours();
                    let minutes = d.getMinutes().toString().padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    return `${hours}:${minutes} ${ampm}`;
                  })()}</Text>}
                  {leave && !attendance && <Text style={styles.itemTime}>{leave.leave_type?.name}</Text>}
                </View>
                <StatusBadge status={badgeStatus as any} />
              </TouchableOpacity>
            )
          })}
          
          {logs.length === 0 && (
            <Text style={styles.emptyText}>No logs found for this month.</Text>
          )}
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
  body: {
    padding: 16,
    flexGrow: 1,
  },
  listContainer: {
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.04)',
  },
  listIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listTextContainer: {
    flex: 1,
  },
  itemDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center', 
    color: colors.textSecondary, 
    marginTop: 20,
    fontSize: 14,
  }
});

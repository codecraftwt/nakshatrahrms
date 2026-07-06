import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { StatusBadge } from '../components/StatusBadge';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { fetchLeaveBalances, fetchLeaveRequests } from '../redux/slice/leaveSlice';
import { RootState, AppDispatch } from '../redux/store';

const parseDate = (dateStr: string) => {
  if (!dateStr) return { month: 'JAN', day: '01' };
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNum = parseInt(parts[1], 10);
      const day = parts[2].padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      if (monthNum >= 1 && monthNum <= 12) {
        return { month: months[monthNum - 1], day };
      }
    }
  } catch {}
  return { month: 'JAN', day: '01' };
};

export const LeaveScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const dispatch = useDispatch<AppDispatch>();
  const { balanceData, requestsData, balanceLoading } = useSelector((state: RootState) => state.leave);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchLeaveBalances());
      dispatch(fetchLeaveRequests({}));
    }, [dispatch])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leave Balance</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('ApplyLeaveScreen')}
        >
          <Icon name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {balanceData?.balances?.map((balance: any, idx: number) => (
            <View key={idx} style={styles.horizontalCard}>
              <View style={styles.spiralsContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={styles.spiralRing} />
                ))}
              </View>
              <View style={styles.hCardTopRow}>
                <View style={styles.hCardValueRow}>
                  <Text style={styles.hCardValue}>{balance.virtual_remaining_leaves || 0}</Text>
                  <Text style={styles.hCardUnit}>{balance.request_unit === 'hour' ? 'hrs' : 'days'}</Text>
                </View>
                <Icon name="clipboard-check-outline" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.hCardLabel} numberOfLines={2}>{balance.name}</Text>
            </View>
          ))}
          {(!balanceData?.balances || balanceData.balances.length === 0) && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ color: colors.textSecondary }}>No leave balances available.</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllLeavesScreen')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {requestsData?.records?.slice(0, 3).map((item: any, idx: number) => {
            const dateText = item.from === item.to ? item.from : `${item.from} to ${item.to}`;
            return (
            <TouchableOpacity 
              key={item.id || idx} 
              style={styles.listCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LeaveDetailScreen', { id: item.id })}
            >
              {(() => {
                const { month, day } = parseDate(item.from);
                return (
                  <View style={styles.calendarSheet}>
                    <View style={styles.calendarSheetHeader}>
                      <Text style={styles.calendarSheetMonth}>{month}</Text>
                    </View>
                    <View style={styles.calendarSheetBody}>
                      <Text style={styles.calendarSheetDay}>{day}</Text>
                    </View>
                  </View>
                );
              })()}
              <View style={styles.listTextContainer}>
                <Text style={styles.itemTitle}>{item.leave_type?.name}</Text>
                <Text style={styles.itemDate}>{dateText}</Text>
                <Text style={styles.itemSub}>{item.number_of_days} day{item.number_of_days > 1 ? 's' : ''} · {item.reason}</Text>
              </View>
              <StatusBadge status={item.status as any} />
            </TouchableOpacity>
          )})}
          {(!requestsData?.records || requestsData.records.length === 0) && (
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 10 }}>No recent requests found.</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  scrollContent: {
    paddingTop: 16,
  },
  horizontalScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
  },
  horizontalCard: {
    backgroundColor: '#FFFFFF',
    width: 140,
    height: 110,
    borderRadius: 16,
    padding: 16,
    paddingTop: 18,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderLeftWidth: 6,
    borderLeftColor: '#81C784',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  spiralsContainer: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
  },
  spiralRing: {
    width: 5,
    height: 12,
    borderRadius: 2.5,
    backgroundColor: '#9FB5A2',
    marginHorizontal: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  hCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  hCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hCardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  hCardUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  hCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calendarSheet: {
    width: 44,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    alignItems: 'stretch',
  },
  calendarSheetHeader: {
    backgroundColor: '#7C92A6',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarSheetMonth: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarSheetBody: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarSheetDay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A6B7C',
  },
  listTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

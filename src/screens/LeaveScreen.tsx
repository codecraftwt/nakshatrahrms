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
              <View style={styles.hCardValueRow}>
                <Text style={styles.hCardValue}>{balance.virtual_remaining_leaves || 0}</Text>
                <Text style={styles.hCardUnit}>{balance.request_unit === 'hour' ? 'hrs' : 'days'}</Text>
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
              <View style={styles.listIconBox}>
                <Icon 
                  name={item.leave_type?.name?.includes('Sick') ? 'medical-bag' : 'calendar-text-outline'} 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
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
    gap: 12,
  },
  horizontalCard: {
    backgroundColor: colors.bgSurface,
    width: 140,
    height: 110,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.08)',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
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

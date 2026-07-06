import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { StatusBadge } from '../components/StatusBadge';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { fetchLeaveRequests } from '../redux/slice/leaveSlice';
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

export const AllLeavesScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const dispatch = useDispatch<AppDispatch>();
  const { requestsData } = useSelector((state: RootState) => state.leave);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchLeaveRequests({}));
    }, [dispatch])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Leaves</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {requestsData?.records?.map((item: any, idx: number) => {
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
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No leave requests found.</Text>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
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

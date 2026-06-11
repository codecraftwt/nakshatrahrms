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

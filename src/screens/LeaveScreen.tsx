import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { MetricTile } from '../components/MetricTile';
import { mockLeaveBalance, mockLeaveRequests } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';

export const LeaveScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

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
        <View style={styles.metricRow}>
          <MetricTile label="Earned Leave" value={`${mockLeaveBalance.earned}`} unit="days" />
          <MetricTile label="Sick Leave" value={`${mockLeaveBalance.sick}`} unit="days" />
        </View>

        <View style={styles.casualLeaveCard}>
          <View style={styles.casualHeader}>
            <View style={styles.casualHeaderLeft}>
              <View style={styles.iconBox}>
                <Icon name="beach" size={20} color={colors.primary} />
              </View>
              <Text style={styles.casualLabel}>Casual Leave</Text>
            </View>
            <Text style={styles.casualValue}>{mockLeaveBalance.casual.remaining} left</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '40%' }]} />
          </View>
          <Text style={styles.progressText}>4 out of 10 days used</Text>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllLeavesScreen')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {mockLeaveRequests.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.listCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LeaveDetailScreen')}
            >
              <View style={styles.listIconBox}>
                <Icon 
                  name={item.type.includes('Sick') ? 'medical-bag' : 'calendar-text-outline'} 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.listTextContainer}>
                <Text style={styles.itemTitle}>{item.type}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
                <Text style={styles.itemSub}>{item.days} day{item.days > 1 ? 's' : ''} · {item.reason}</Text>
              </View>
              <StatusBadge status={item.status as any} />
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  casualLeaveCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.05)',
  },
  casualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  casualHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  casualLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  casualValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgPage,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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

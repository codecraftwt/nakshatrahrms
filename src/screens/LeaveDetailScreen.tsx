import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { StatusBadge } from '../components/StatusBadge';
import { OutlineButton } from '../components/OutlineButton';

export const LeaveDetailScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Standard Clean Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave Request</Text>
          <StatusBadge status="pending" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        
        {/* Detail Card */}
        <View style={styles.detailCard}>
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="tag-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>Casual leave</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="calendar-clock-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>3 Jun · 1 day</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="card-text-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Reason</Text>
            <Text style={styles.detailValue}>Family function</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="calendar-check-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Applied on</Text>
            <Text style={styles.detailValue}>1 Jun 2025</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={[styles.detailRow, { paddingBottom: 0 }]}>
            <View style={styles.iconBox}>
              <Icon name="account-tie-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Approver</Text>
            <Text style={styles.detailValue}>Rahul Sharma</Text>
          </View>
          
        </View>

        {/* Status Box */}
        <View style={styles.statusBox}>
          <Icon name="clock-outline" size={20} color={colors.warning} style={styles.statusIcon} />
          <Text style={styles.statusText}>Awaiting manager approval</Text>
        </View>

        {/* Action Button */}
        <OutlineButton 
          label="Cancel Request"
          onPress={() => navigation.goBack()}
          color={colors.danger}
          style={styles.cancelBtn}
        />
        
        <View style={{ height: 40 }} />
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
    backgroundColor: colors.bgPage,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  body: {
    padding: 20,
  },
  detailCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.04)',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.3,
    marginLeft: 48, // aligns with text
  },
  statusBox: {
    backgroundColor: colors.warningBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.2)',
    marginBottom: 20,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    backgroundColor: colors.dangerBg, // dynamic background
  },
});

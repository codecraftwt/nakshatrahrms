import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { StatusBadge } from '../components/StatusBadge';
import { OutlineButton } from '../components/OutlineButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaveDetail, cancelLeave, resetCancelSuccess } from '../redux/slice/leaveSlice';
import { syncLeave, resetSyncLeaveSuccess } from '../redux/slice/payrollSlice';
import { RootState, AppDispatch } from '../redux/store';

export const LeaveDetailScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const route = useRoute<any>();
  const leaveId = route.params?.id;

  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { leaveDetailData, leaveDetailLoading, cancelLoading, cancelSuccess, cancelError } = useSelector((state: RootState) => state.leave);
  const { syncLeaveLoading, syncLeaveSuccess, syncLeaveError } = useSelector((state: RootState) => state.payroll);

  useFocusEffect(
    React.useCallback(() => {
      if (leaveId) {
        dispatch(fetchLeaveDetail(leaveId));
      }
    }, [dispatch, leaveId])
  );

  React.useEffect(() => {
    if (cancelSuccess) {
      dispatch(resetCancelSuccess());
      setIsCancelModalVisible(false);
      setIsSuccessModalVisible(true);
    }
    if (cancelError) {
      Alert.alert('Error', cancelError);
      dispatch(resetCancelSuccess());
    }
  }, [cancelSuccess, cancelError]);

  React.useEffect(() => {
    if (syncLeaveSuccess) {
      Alert.alert('Sync Successful', 'Leave data has been synced to payroll successfully.');
      dispatch(resetSyncLeaveSuccess());
    }
    if (syncLeaveError) {
      Alert.alert('Sync Error', syncLeaveError);
      dispatch(resetSyncLeaveSuccess());
    }
  }, [syncLeaveSuccess, syncLeaveError]);

  const handleCancelSubmit = () => {
    if (!cancelReason.trim()) {
      Alert.alert('Validation Error', 'Please provide a reason for cancellation.');
      return;
    }
    dispatch(cancelLeave({ id: leaveId, reason: cancelReason }));
  };

  const leave = leaveDetailData?.leave;

  if (leaveDetailLoading || !leave) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <Text style={{ color: colors.textSecondary }}>Loading detail...</Text>
      </SafeAreaView>
    );
  }

  const durationText = leave.from === leave.to ? leave.from : `${leave.from} to ${leave.to}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Standard Clean Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave Request</Text>
          <StatusBadge status={leave.status as any} />
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
            <Text style={styles.detailValue}>{leave.leave_type?.name}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="calendar-clock-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{durationText} · {leave.number_of_days} day{leave.number_of_days > 1 ? 's' : ''}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="card-text-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Reason</Text>
            <Text style={styles.detailValue}>{leave.reason}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="calendar-check-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailLabel}>From Session</Text>
            <Text style={styles.detailValue}>{leave.from_session?.name || 'Full Day'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={[styles.detailRow, { paddingBottom: 0 }]}>
            <View style={styles.iconBox}>
              <Icon name="account-tie-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.detailLabel}>Approver</Text>
            <Text style={styles.detailValue}>{leave.approver_name || 'Pending Manager'}</Text>
          </View>
          
        </View>

        {/* Status Box */}
        {leave.status === 'pending' && (
          <View style={styles.statusBox}>
            <Icon name="clock-outline" size={20} color={colors.warning} style={styles.statusIcon} />
            <Text style={styles.statusText}>Level {leave.current_approval_level} of {leave.total_approval_levels}</Text>
          </View>
        )}

        {/* Action Button */}
        <OutlineButton 
          label="Cancel Request"
          onPress={() => setIsCancelModalVisible(true)}
          color={colors.danger}
          style={styles.cancelBtn}
        />

        {/* Sync Payroll Button */}
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(21, 88, 176, 0.08)', paddingVertical: 14, borderRadius: 16, marginTop: 12 }}
          onPress={() => dispatch(syncLeave({ leave_id: leaveId }))}
          disabled={syncLeaveLoading}
          activeOpacity={0.7}
        >
          <Icon name="sync" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
            {syncLeaveLoading ? 'Syncing...' : 'Sync Leave to Payroll'}
          </Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Cancel Modal */}
      <Modal visible={isCancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Leave</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for cancelling this leave request.</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.bgPage, color: colors.textPrimary }]}
              placeholder="Reason for cancellation..."
              placeholderTextColor={colors.textSecondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={styles.modalActions}>
              <OutlineButton 
                label="Back" 
                onPress={() => setIsCancelModalVisible(false)} 
                style={{ flex: 1, marginRight: 8 }} 
                color={colors.textSecondary} 
              />
              <PrimaryButton 
                label={cancelLoading ? "Cancelling..." : "Confirm"} 
                onPress={handleCancelSubmit} 
                style={{ flex: 1, marginLeft: 8 }} 
                disabled={cancelLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={isSuccessModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', paddingVertical: 40 }]}>
            <View style={styles.successIconBox}>
              <Icon name="check" size={36} color={colors.success} />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Cancellation Successful</Text>
            <Text style={[styles.modalSubtitle, { textAlign: 'center', marginBottom: 24 }]}>Your leave request has been successfully cancelled and removed from your records.</Text>
            <PrimaryButton 
              label="Done" 
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.goBack();
              }} 
              style={{ width: '100%' }} 
            />
          </View>
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
    backgroundColor: colors.dangerBg, 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  modalInput: {
    height: 100,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});

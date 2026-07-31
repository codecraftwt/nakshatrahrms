import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { approveRegularisation, rejectRegularisation, fetchRegularisationApprovals } from '../redux/slice/regularisationSlice';
import { CustomAlertModal } from '../components/CustomAlertModal';

export const ManagerRegularisationDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  
  const { regularisation } = route.params;
  const [loadingAction, setLoadingAction] = useState<'approve' | 'refuse' | null>(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' as any });

  const employeeName = regularisation.employee?.name || (Array.isArray(regularisation.employee_id) ? regularisation.employee_id[1] : regularisation.employee_id?.name) || 'Employee';
  const typeName = regularisation.permission_type ? (regularisation.permission_type.charAt(0).toUpperCase() + regularisation.permission_type.slice(1)) : 'Regularization';
  const date = regularisation.start_date || regularisation.create_date?.split(' ')[0] || '';
  
  const getStatusLabel = (state: string) => {
    if (!state) return 'Pending';
    if (state === 'to_approve' || state === 'pending') return 'Pending';
    if (state === 'approved') return 'Approved';
    if (state === 'refused' || state === 'rejected') return 'Rejected';
    return state.charAt(0).toUpperCase() + state.slice(1);
  };
  const statusLabel = getStatusLabel(regularisation.state);

  const departmentName = regularisation.department?.name || 'Department';
  const note = regularisation.note || '';
  const endDate = regularisation.end_date || '';
  const count = regularisation.attendance_count !== undefined ? regularisation.attendance_count : '';

  const handleApprove = async () => {
    setLoadingAction('approve');
    const action = await dispatch(approveRegularisation(regularisation.id));
    if (approveRegularisation.fulfilled.match(action)) {
      await dispatch(fetchRegularisationApprovals({ state: 'to_approve', limit: 50 }));
      navigation.goBack();
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: (action.payload as string) || 'Failed to approve regularization.',
        type: 'error'
      });
    }
    setLoadingAction(null);
  };

  const handleRefuse = async () => {
    setLoadingAction('refuse');
    const action = await dispatch(rejectRegularisation(regularisation.id));
    if (rejectRegularisation.fulfilled.match(action)) {
      await dispatch(fetchRegularisationApprovals({ state: 'to_approve', limit: 50 }));
      navigation.goBack();
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: (action.payload as string) || 'Failed to refuse regularization.',
        type: 'error'
      });
    }
    setLoadingAction(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Approval Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Top Info Banner */}
        <View style={styles.topBanner}>
          <View style={styles.iconCircle}>
            <Icon name="clock-check-outline" size={32} color="#00BCD4" />
          </View>
          <Text style={styles.titleText}>{typeName}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>General Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Employee</Text>
            <View style={styles.employeeRow}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>{employeeName.charAt(0)}</Text>
              </View>
              <Text style={styles.detailValue}>{employeeName}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department</Text>
            <Text style={styles.detailValue}>{departmentName}</Text>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>

          {endDate ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValue}>{endDate}</Text>
              </View>
            </>
          ) : null}

          {count !== '' ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Count</Text>
                <Text style={styles.detailValue}>{count}</Text>
              </View>
            </>
          ) : null}

          {note ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Note</Text>
                <Text style={styles.detailValue}>{note}</Text>
              </View>
            </>
          ) : null}

        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.refuseBtn]} 
          onPress={handleRefuse}
          disabled={loadingAction !== null}
        >
          {loadingAction === 'refuse' ? (
            <ActivityIndicator color={colors.textSecondary} size="small" />
          ) : (
            <>
              <Icon name="close" size={20} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.refuseBtnText}>Refuse</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.approveBtn]} 
          onPress={handleApprove}
          disabled={loadingAction !== null}
        >
          {loadingAction === 'approve' ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Icon name="check" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.approveBtnText}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onPrimaryPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.bgPage,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  topBanner: {
    alignItems: 'center',
    marginVertical: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: colors.warningText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarMiniText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  refuseBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  refuseBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 16,
  },
  approveBtn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

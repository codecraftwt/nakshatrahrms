import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Alert, PermissionsAndroid, Platform } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { approveExpenseRequest, refuseExpenseRequest, fetchExpenseApprovals } from '../redux/slice/expenseSlice';
import { CustomAlertModal } from '../components/CustomAlertModal';
import RNFS from 'react-native-fs';

export const ManagerExpenseDetailScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();

  const { expense } = route.params;
  const [loadingAction, setLoadingAction] = useState<'approve' | 'refuse' | null>(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' as any });
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);

  const categoryName = expense.category?.name || (Array.isArray(expense.product_id) ? expense.product_id[1] : expense.product_id?.name) || 'Expense';
  const displayCategoryName = categoryName.replace(/^\[.*?\]\s*/, '').trim();
  const descriptionName = (expense.name || expense.description || 'Expense').replace(/^\[.*?\]\s*/, '').trim();
  const employeeName = Array.isArray(expense.employee) ? expense.employee[1] : expense.employee?.name || 'Employee';
  const amount = expense.total_amount || 0;
  const date = expense.date || expense.create_date?.split(' ')[0] || '';
  const statusLabel = expense.state_label || expense.status || 'Pending';
  const paymentMode = expense.payment_mode_label || 'Employee (to reimburse)';

  const getCategoryIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('food')) return 'food-fork-drink';
    if (lower.includes('fuel') || lower.includes('mil')) return 'gas-station';
    if (lower.includes('gift')) return 'gift';
    if (lower.includes('recharge')) return 'cellphone-charging';
    if (lower.includes('travel') || lower.includes('rent') || lower.includes('hotel')) return 'airplane';
    return 'receipt';
  };

  const handleApprove = async () => {
    setLoadingAction('approve');
    const action = await dispatch(approveExpenseRequest(expense.id));
    if (approveExpenseRequest.fulfilled.match(action)) {
      await dispatch(fetchExpenseApprovals({ limit: 50 }));
      navigation.goBack();
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: (action.payload as string) || 'Failed to approve expense.',
        type: 'error'
      });
    }
    setLoadingAction(null);
  };

  const handleRefuse = async () => {
    setLoadingAction('refuse');
    const action = await dispatch(refuseExpenseRequest(expense.id));
    if (refuseExpenseRequest.fulfilled.match(action)) {
      await dispatch(fetchExpenseApprovals({ limit: 50 }));
      navigation.goBack();
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: (action.payload as string) || 'Failed to refuse expense.',
        type: 'error'
      });
    }
    setLoadingAction(null);
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Number(Platform.Version) >= 33) return true;
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const handleDownloadAttachment = async (att: any) => {
    if (!att || !att.base64) {
       Alert.alert("Error", "No file data available to download.");
       return;
    }
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
       Alert.alert("Permission Denied", "Cannot download file without storage permission.");
       return;
    }

    try {
       const path = `${RNFS.DownloadDirectoryPath}/${att.name}`;
       await RNFS.writeFile(path, att.base64, 'base64');
       Alert.alert("Success", `File downloaded to Downloads folder:\n${att.name}`);
    } catch (error) {
       Alert.alert("Download Failed", "There was an error saving the file.");
       console.log("Download error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Top Info Banner */}
        <View style={styles.topBanner}>
          <View style={styles.iconCircle}>
            <Icon name={getCategoryIcon(categoryName)} size={32} color={colors.primary} />
          </View>
          <Text style={styles.titleText}>{descriptionName}</Text>
          <Text style={styles.amountText}>${amount.toFixed(2)}</Text>
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
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{displayCategoryName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Mode</Text>
            <Text style={styles.detailValue}>{paymentMode}</Text>
          </View>

          {expense.quantity !== undefined && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>{expense.quantity}</Text>
              </View>
            </>
          )}

          {expense.unit_price !== undefined && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Unit Price</Text>
                <Text style={styles.detailValue}>${expense.unit_price.toFixed(2)}</Text>
              </View>
            </>
          )}

          {expense.attachments && expense.attachments.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={{ paddingTop: 16 }}>
                <Text style={styles.detailLabel}>Attachments</Text>
                <View style={styles.attachmentContainer}>
                  {expense.attachments.map((att: any, idx: number) => {
                    const isImage = att.mimetype?.startsWith('image/');
                    return (
                      <TouchableOpacity key={idx} style={styles.attachmentCard} onPress={() => setSelectedAttachment(att)}>
                        {isImage && att.base64 ? (
                          <Image 
                            source={{ uri: `data:${att.mimetype};base64,${att.base64}` }} 
                            style={styles.attachmentImage} 
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.attachmentFile}>
                            <Icon name="file-document-outline" size={32} color={colors.textSecondary} />
                          </View>
                        )}
                        <Text style={styles.attachmentName} numberOfLines={1}>{att.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
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

      {/* Attachment Viewer Modal */}
      <Modal visible={!!selectedAttachment} transparent animationType="fade" onRequestClose={() => setSelectedAttachment(null)}>
        <View style={styles.viewerOverlay}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setSelectedAttachment(null)} style={styles.viewerBtn}>
              <Icon name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {selectedAttachment?.name}
            </Text>
            <TouchableOpacity onPress={() => handleDownloadAttachment(selectedAttachment)} style={styles.viewerBtn}>
              <Icon name="download" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.viewerContent}>
            {selectedAttachment?.mimetype?.startsWith('image/') && selectedAttachment?.base64 ? (
              <Image 
                source={{ uri: `data:${selectedAttachment.mimetype};base64,${selectedAttachment.base64}` }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="contain"
              />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Icon name="file-document" size={80} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', marginTop: 16, fontSize: 16 }}>Preview not available</Text>
              </View>
            )}
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
    backgroundColor: 'rgba(21, 88, 176, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  amountText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 12,
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
  attachmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  attachmentCard: {
    width: 100,
    alignItems: 'center',
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  attachmentFile: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  attachmentName: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  viewerBtn: {
    padding: 8,
  },
  viewerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  viewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  }
});

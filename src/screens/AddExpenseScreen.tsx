import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Switch, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { 
  fetchExpenseProducts, 
  fetchExpenseTaxes, 
  fetchExpenseVendors, 
  createExpenseRequest, 
  uploadExpenseAttachment, 
  submitExpenseRequest,
  resetCreateSuccess
} from '../redux/slice/expenseSlice';
import { useFocusEffect } from '@react-navigation/native';

export const AddExpenseScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const {
    productsData, productsLoading,
    taxesData, taxesLoading,
    vendorsData, vendorsLoading,
    createLoading, createSuccess, createdExpenseId,
    attachmentLoading, submitLoading
  } = useSelector((state: RootState) => state.expense);

  // Form State
  const [description, setDescription] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedTax, setSelectedTax] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [date, setDate] = useState(new Date());
  const [paidByEmployee, setPaidByEmployee] = useState(true);
  
  // Modals and UI State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'product' | 'tax' | 'vendor' | null>(null);
  const [attachment, setAttachment] = useState<{ uri: string, base64?: string, filename: string, type: string } | null>(null);
  
  const [customAlert, setCustomAlert] = useState<{ visible: boolean, title: string, message: string, onConfirm?: () => void }>({
    visible: false, title: '', message: ''
  });

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchExpenseProducts({ limit: 100 }));
      dispatch(fetchExpenseTaxes({ limit: 100 }));
      dispatch(fetchExpenseVendors({ limit: 100 }));
    }, [dispatch])
  );

  // Computed total
  const numericPrice = parseFloat(unitPrice) || 0;
  const numericQuantity = parseFloat(quantity) || 0;
  const total = numericPrice * numericQuantity;

  const formatDate = (dateObj: Date) => {
    return dateObj.toISOString().split('T')[0];
  };

  const handlePickAttachment = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.8
      });
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri || '',
          base64: asset.base64,
          filename: asset.fileName || 'receipt.jpg',
          type: asset.type || 'image/jpeg'
        });
      }
    } catch (e) {
      console.log('Error picking image', e);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description || !selectedProduct || !unitPrice || !quantity) {
      setCustomAlert({
        visible: true,
        title: 'Validation Error',
        message: 'Please fill in all required fields (Description, Category, Unit Price, Quantity)'
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: description,
      product_id: selectedProduct.id,
      date: formatDate(date),
      payment_mode: paidByEmployee ? 'own_account' : 'company_account',
      total_amount: total,
      quantity: numericQuantity,
      description: description,
      vendor_id: selectedVendor?.id || null,
      tax_ids: selectedTax ? [selectedTax.id] : []
    };

    const action = await dispatch(createExpenseRequest(payload));
    if (createExpenseRequest.rejected.match(action)) {
      setCustomAlert({
        visible: true,
        title: 'Submission Failed',
        message: (action.payload as string) || 'An error occurred while creating the expense.'
      });
      setIsSubmitting(false);
      return;
    }

    const expenseId = action.payload?.data?.id || action.payload?.id;
    
    if (expenseId) {
      // 1. Upload Attachment if present
      if (attachment && attachment.base64) {
        const attachAction = await dispatch(uploadExpenseAttachment({
          id: expenseId,
          payload: {
            attachment: attachment.base64,
            filename: attachment.filename,
            mimetype: attachment.type
          }
        }));
        if (uploadExpenseAttachment.rejected.match(attachAction)) {
          console.log('Attachment upload failed, but expense was created.');
        }
      }

      // We no longer automatically submit the request here.
      // It will remain in 'Draft' state and can be submitted from the expense list.
    }

    dispatch(resetCreateSuccess());
    setIsSubmitting(false);
    navigation.goBack();
  };

  const openSelectionModal = (type: 'product' | 'tax' | 'vendor') => {
    setModalType(type);
    setModalVisible(true);
  };

  const renderSelectionModal = () => {
    let data: any[] = [];
    let title = '';
    let isLoading = false;
    
    if (modalType === 'product') {
      data = productsData?.records || [];
      title = 'Select Category';
      isLoading = productsLoading;
    } else if (modalType === 'tax') {
      data = taxesData?.records || [];
      title = 'Select Tax';
      isLoading = taxesLoading;
    } else if (modalType === 'vendor') {
      data = vendorsData?.records || [];
      title = 'Select Vendor';
      isLoading = vendorsLoading;
    }

    return (
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList 
                data={data}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalItem}
                    onPress={() => {
                      if (modalType === 'product') {
                        setSelectedProduct(item);
                        const price = item.standard_price || item.list_price || item.price || item.unit_price;
                        if (price !== undefined && price !== null) {
                          setUnitPrice(price.toString());
                        }
                      }
                      if (modalType === 'tax') setSelectedTax(item);
                      if (modalType === 'vendor') setSelectedVendor(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.name || item.display_name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => <Text style={{textAlign: 'center', marginTop: 20}}>No items found.</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderCustomAlert = () => (
    <Modal visible={customAlert.visible} transparent animationType="fade">
      <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.modalContent, { width: '85%', borderRadius: 16, padding: 24, maxHeight: undefined }]}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' }}>{customAlert.title}</Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>{customAlert.message}</Text>
          <TouchableOpacity 
            style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
            onPress={() => {
              setCustomAlert(prev => ({ ...prev, visible: false }));
              if (customAlert.onConfirm) customAlert.onConfirm();
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const isSaving = isSubmitting;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={isSaving}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 80) }]}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
      >
        <View style={styles.formCard}>
          <InputField
            label="Description *"
            placeholder="e.g. Travel by car"
            value={description}
            onChangeText={setDescription}
          />
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <InputField
                label="Category *"
                placeholder="Select Category"
                value={selectedProduct?.name || ''}
                onChangeText={() => {}}
                rightIcon="chevron-down"
                onPress={() => openSelectionModal('product')}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <InputField
                label="Expense Date"
                placeholder="YYYY-MM-DD"
                value={formatDate(date)}
                onChangeText={() => {}}
                rightIcon="calendar"
                onPress={() => setShowDatePicker(true)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <InputField
                label="Unit Price ($) *"
                placeholder="0.00"
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="numeric"
                editable={true}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <InputField
                label="Quantity *"
                placeholder="1"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Total</Text>
            <Text style={styles.readOnlyValue}>${total.toFixed(2)}</Text>
          </View>

          <InputField
            label="Vendor (Optional)"
            placeholder="Select Vendor"
            value={selectedVendor?.name || ''}
            onChangeText={() => {}}
            rightIcon="chevron-down"
            onPress={() => openSelectionModal('vendor')}
          />



          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Paid By</Text>
              <Text style={styles.switchSubLabel}>{paidByEmployee ? 'Employee (to reimburse)' : 'Company'}</Text>
            </View>
            <Switch
              value={paidByEmployee}
              onValueChange={setPaidByEmployee}
              trackColor={{ false: '#e0e0e0', true: colors.primary + '80' }}
              thumbColor={paidByEmployee ? colors.primary : '#f4f3f4'}
            />
          </View>

        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={handlePickAttachment}>
            <Icon name={attachment ? "check-circle" : "paperclip"} size={20} color={colors.primary} />
            <Text style={styles.attachBtnText}>{attachment ? attachment.filename : "Attach Receipt"}</Text>
          </TouchableOpacity>
          <PrimaryButton 
            label={isSaving ? "Submitting..." : "Submit Expense"}
            onPress={handleSubmit}
            disabled={isSaving}
          />
        </View>

      </KeyboardAwareScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {renderSelectionModal()}
      {renderCustomAlert()}

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border + '50',
    marginVertical: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  readOnlyField: {
    marginBottom: 16,
    paddingTop: 4,
  },
  readOnlyLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border + '50',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  switchSubLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionContainer: {
    gap: 12,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  attachBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  }
});

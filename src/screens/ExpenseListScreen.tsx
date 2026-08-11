import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Modal } from 'react-native';
import { AppText as Text } from '../components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { StatusBadge } from '../components/StatusBadge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchExpenseRequests, submitExpenseRequest } from '../redux/slice/expenseSlice';
import { useFocusEffect } from '@react-navigation/native';

export const ExpenseListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { requestsData, requestsLoading } = useSelector((state: RootState) => state.expense);

  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | number | null>(null);

  // You can fetch specific status or all. For now, fetch all on focus.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchExpenseRequests({ status: 'all', limit: 50 }));
    }, [dispatch])
  );

  const handleExpensePress = (item: any) => {
    const status = item.state || item.status || 'draft';
    if (status === 'draft') {
      setSelectedExpenseId(item.id);
      setSubmitModalVisible(true);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!selectedExpenseId) return;
    setSubmitModalVisible(false);
    const action = await dispatch(submitExpenseRequest(selectedExpenseId));
    if (submitExpenseRequest.fulfilled.match(action)) {
      // Refresh the list after successful submission
      dispatch(fetchExpenseRequests({ status: 'all', limit: 50 }));
    } else {
      Alert.alert("Error", "Failed to submit expense request.");
    }
  };

  const renderSubmitModal = () => (
    <Modal visible={submitModalVisible} transparent animationType="fade">
      <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.modalContent, { width: '85%', borderRadius: 16, padding: 24, maxHeight: undefined }]}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' }}>Submit Expense</Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>Do you want to submit this expense request?</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 }}>
            <TouchableOpacity
              style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' }}
              onPress={() => setSubmitModalVisible(false)}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600', textTransform: 'uppercase' }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' }}
              onPress={handleConfirmSubmit}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' }}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderExpenseItem = (item: any) => {
    // Safely extract data from typical Odoo/ERP API responses 
    // where relational fields are returned as [id, "name"]
    const categoryName = item.category?.name || (Array.isArray(item.product_id) ? item.product_id[1] : item.product_id?.name) || 'Expense';
    const displayCategoryName = categoryName.replace(/^\[.*?\]\s*/, '').trim();
    const descriptionName = (item.name || item.description || 'Expense').replace(/^\[.*?\]\s*/, '').trim();
    const employeeName = Array.isArray(item.employee_id) ? item.employee_id[1] : item.employee_id?.name || 'Employee';
    const amount = item.total_amount || 0;
    const date = item.date || item.create_date?.split(' ')[0] || '';
    const status = item.state || item.status || 'draft';

    const getCategoryIcon = (catName: string) => {
      const lower = catName.toLowerCase();
      if (lower.includes('food')) return 'food-fork-drink';
      if (lower.includes('fuel') || lower.includes('mil')) return 'gas-station';
      if (lower.includes('gift')) return 'gift';
      if (lower.includes('recharge')) return 'cellphone-charging';
      if (lower.includes('travel') || lower.includes('rent') || lower.includes('hotel')) return 'airplane';
      return 'receipt';
    };

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.listCard}
        activeOpacity={0.8}
        onPress={() => handleExpensePress(item)}
      >
        <View style={styles.iconContainer}>
          <Icon
            name={getCategoryIcon(categoryName)}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.listTextContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>{descriptionName}</Text>
          <Text style={styles.itemSub}>{displayCategoryName} · {date}</Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={styles.amountText}>${amount.toFixed(2)}</Text>
          <StatusBadge status={status} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpenseScreen')}
        >
          <Icon name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>


        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
        </View>

        <View style={styles.listContainer}>
          {requestsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : requestsData?.records?.length > 0 ? (
            requestsData.records.map(renderExpenseItem)
          ) : (
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No expenses found.</Text>
          )}
        </View>

        <View style={{ height: 20 + insets.bottom }} />
      </ScrollView>

      {renderSubmitModal()}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FFFFFF',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 16,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    width: 160,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderLeftWidth: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
  }
});

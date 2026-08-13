import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchExpenseApprovals, approveExpenseRequest, refuseExpenseRequest } from '../redux/slice/expenseSlice';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAlertModal } from '../components/CustomAlertModal';

export const ManagerExpenseListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' as any });

  const { approvalsData, approvalsLoading } = useSelector((state: RootState) => state.expense);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchExpenseApprovals({ limit: 50 }));
    }, [dispatch])
  );

  const renderExpenseItem = (item: any) => {
    const categoryName = item.category?.name || (Array.isArray(item.product_id) ? item.product_id[1] : item.product_id?.name) || 'Expense';
    const displayCategoryName = categoryName.replace(/^\[.*?\]\s*/, '').trim();
    const descriptionName = (item.name || item.description || 'Expense').replace(/^\[.*?\]\s*/, '').trim();
    const employeeName = Array.isArray(item.employee) ? item.employee[1] : item.employee?.name || 'Employee';
    const amount = item.total_amount || 0;
    const date = item.date || item.create_date?.split(' ')[0] || '';

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
        onPress={() => navigation.navigate('ManagerExpenseDetailScreen', { expense: item })}
      >
        <View style={styles.cardTop}>
          <View style={styles.iconContainer}>
            <Icon name={getCategoryIcon(categoryName)} size={24} color={colors.primary} />
          </View>
          <View style={styles.listTextContainer}>
            <Text style={styles.itemTitle} numberOfLines={1}>{descriptionName}</Text>
            <Text style={styles.itemSub}>{displayCategoryName} · {date}</Text>
            <View style={styles.employeeRow}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>{employeeName.charAt(0)}</Text>
              </View>
              <Text style={styles.itemEmployee}>{employeeName}</Text>
            </View>
          </View>
          <View style={styles.rightContent}>
            <Text style={styles.amountText}>${amount.toFixed(2)}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Pending</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Expenses</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {approvalsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : approvalsData?.records?.length > 0 ? (
            approvalsData.records.map(renderExpenseItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="check-all" size={48} color={colors.success} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySub}>There are no pending expenses to review.</Text>
            </View>
          )}
        </View>
        <View style={{ height: 20 + insets.bottom }} />
      </ScrollView>

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
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(21, 88, 176, 0.1)',
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
    marginBottom: 6,
  },
  itemEmployee: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarMiniText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  statusBadge: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: colors.warningText,
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refuseBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  refuseBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  approveBtn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchPayslips } from '../redux/slice/payrollSlice';
import { useFocusEffect } from '@react-navigation/native';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const PayslipListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { payslipsData, payslipsLoading } = useSelector((state: RootState) => state.payroll);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPayslips({ payroll_month: month, payroll_year: year }));
    }, [dispatch, month, year])
  );

  const handlePrevMonth = () => {
    if (month > 1) {
      setMonth(m => m - 1);
    } else {
      setMonth(12);
      setYear(y => y - 1);
    }
  };

  const handleNextMonth = () => {
    if (month < 12) {
      setMonth(m => m + 1);
    } else {
      setMonth(1);
      setYear(y => y + 1);
    }
  };

  const handlePayslipPress = (item: any) => {
    navigation.navigate('PayslipDetailScreen', { id: item.id });
  };

  const renderPayslipItem = (item: any, index: number) => {
    const name = item.name || `Payslip #${item.id || index}`;
    const employeeName = Array.isArray(item.employee_id) ? item.employee_id[1] : item.employee_id?.name || 'Employee';
    const amount = item.net_amount || item.net_wage || item.total_amount || 0;
    const date = item.date_to || item.date_from || '';

    return (
      <TouchableOpacity 
        key={item.id || index} 
        style={styles.cardContainer}
        activeOpacity={0.7}
        onPress={() => handlePayslipPress(item)}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.iconWrapper}>
            <Icon name="file-document" size={26} color={colors.primary} />
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{name}</Text>
            <Text style={styles.cardSubtitle}>{employeeName}</Text>
            {date ? <Text style={styles.cardDate}>{date}</Text> : null}
          </View>
        </View>
        
        <View style={styles.cardDivider} />
        
        <View style={styles.cardBottomRow}>
          <Text style={styles.viewPdfText}>View Payslip PDF</Text>
          <View style={styles.arrowIconWrapper}>
            <Icon name="arrow-right" size={16} color="#FFFFFF" />
          </View>
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
        <Text style={styles.headerTitle}>Payslips</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Modern Month/Year Selector */}
        <View style={styles.monthSelectorContainer}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrowBtn}>
            <Icon name="chevron-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.monthTextContainer}>
            <Icon name="calendar-month-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.monthText}>{MONTH_NAMES[month - 1]} {year}</Text>
          </View>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrowBtn}>
            <Icon name="chevron-right" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {payslipsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : payslipsData?.data?.length > 0 ? (
            payslipsData.data.map(renderPayslipItem)
          ) : payslipsData?.records?.length > 0 ? (
            payslipsData.records.map(renderPayslipItem)
          ) : payslipsData?.length > 0 ? (
            payslipsData.map(renderPayslipItem)
          ) : (
            <View style={styles.emptyStateContainer}>
              <Icon name="file-document-remove-outline" size={64} color={colors.textSecondary + '40'} />
              <Text style={styles.emptyStateTitle}>No Payslips Found</Text>
              <Text style={styles.emptyStateSub}>There are no payslips available for {MONTH_NAMES[month - 1]} {year}.</Text>
            </View>
          )}
        </View>
        
        <View style={{ height: 40 + insets.bottom }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // A softer, premium background color
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingTop: 20,
  },
  monthSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  monthArrowBtn: {
    padding: 8,
    backgroundColor: '#F0F4F8',
    borderRadius: 24,
  },
  monthTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  amountWrapper: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  netPayBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  netPayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 20,
    marginBottom: 16,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewPdfText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  arrowIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

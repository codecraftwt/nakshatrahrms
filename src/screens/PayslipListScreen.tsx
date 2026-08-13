import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchPayslips } from '../redux/slice/payrollSlice';
import { useFocusEffect } from '@react-navigation/native';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTHS = [
  { id: 0, name: 'All' },
  { id: 1, name: 'Jan' },
  { id: 2, name: 'Feb' },
  { id: 3, name: 'Mar' },
  { id: 4, name: 'Apr' },
  { id: 5, name: 'May' },
  { id: 6, name: 'Jun' },
  { id: 7, name: 'Jul' },
  { id: 8, name: 'Aug' },
  { id: 9, name: 'Sep' },
  { id: 10, name: 'Oct' },
  { id: 11, name: 'Nov' },
  { id: 12, name: 'Dec' },
];

export const PayslipListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { payslipsData, payslipsLoading } = useSelector((state: RootState) => state.payroll);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const scrollViewRef = React.useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      const params: any = { payroll_year: year };
      if (month !== 0) params.payroll_month = month;
      dispatch(fetchPayslips(params));
    }, [dispatch, month, year])
  );

  const renderMonthFilter = () => (
    <View style={styles.filterContainerRow}>
      <View style={styles.stickyAllContainer}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            month === 0 && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setMonth(0)}
        >
          <Text style={[
            styles.filterText,
            month === 0 && { color: '#FFFFFF', fontWeight: '700' }
          ]}>
            All
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        ref={scrollViewRef}
        onContentSizeChange={() => {
          if (month > 2) {
            scrollViewRef.current?.scrollTo({ x: (month - 2) * 70, animated: true });
          }
        }}
      >
        {MONTHS.filter(m => m.id !== 0).map((mItem) => {
          const isSelected = month === mItem.id;
          return (
            <TouchableOpacity
              key={mItem.id}
              style={[
                styles.filterPill,
                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setMonth(mItem.id)}
            >
              <Text style={[
                styles.filterText,
                isSelected && { color: '#FFFFFF', fontWeight: '700' }
              ]}>
                {mItem.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

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
        <View style={{ width: 40 }} />
      </View>

      {renderMonthFilter()}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

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
              <Text style={styles.emptyStateSub}>There are no payslips available for {month === 0 ? `the year ${year}` : `${MONTH_NAMES[month - 1]} ${year}`}.</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  filterContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stickyAllContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginRight: 8,
  },
  filterScroll: {
    paddingRight: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingTop: 16,
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

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { AppText as Text } from '../components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchPayslips, fetchPayslipDetails } from '../redux/slice/payrollSlice';
import { useFocusEffect } from '@react-navigation/native';

export const PayslipListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { payslipsData, payslipsLoading, payslipDetailsLoading } = useSelector((state: RootState) => state.payroll);

  // Default to July 2026 as per user example, or current date if needed.
  // We'll use 7 and 2026 as default to ensure it matches the user's curl if that's the only data they have.
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(2026);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPayslips({ payroll_month: month, payroll_year: year }));
    }, [dispatch, month, year])
  );

  const handleDownloadPress = async (item: any) => {
    try {
      const action = await dispatch(fetchPayslipDetails(item.id));
      if (fetchPayslipDetails.fulfilled.match(action)) {
        Alert.alert('Success', 'Payslip details fetched successfully!');
        console.log('Payslip detail payload:', action.payload);
      } else {
        Alert.alert('Error', 'Failed to fetch payslip details.');
      }
    } catch (error) {
      console.log('Download error:', error);
    }
  };

  const renderPayslipItem = (item: any, index: number) => {
    const name = item.name || `Payslip ${item.id || index}`;
    const employeeName = Array.isArray(item.employee_id) ? item.employee_id[1] : item.employee_id?.name || 'Employee';
    const amount = item.net_wage || item.total_amount || 0;
    const date = item.date_to || item.date_from || '';

    return (
      <View key={item.id || index} style={styles.listCard}>
        <View style={styles.iconContainer}>
          <Icon name="file-document-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.listTextContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.itemSub}>{employeeName} · {date}</Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={styles.amountText}>${amount}</Text>
          <TouchableOpacity 
            style={styles.downloadBtn}
            onPress={() => handleDownloadPress(item)}
            disabled={payslipDetailsLoading}
          >
            <Icon name="download" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Month: {month}/{year}</Text>
          <View style={styles.monthControls}>
            <TouchableOpacity onPress={() => setMonth(m => m > 1 ? m - 1 : 12)}>
              <Icon name="chevron-left" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMonth(m => m < 12 ? m + 1 : 1)}>
              <Icon name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listContainer}>
          {payslipsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : payslipsData?.records?.length > 0 ? (
            payslipsData.records.map(renderPayslipItem)
          ) : payslipsData?.length > 0 ? (
            payslipsData.map(renderPayslipItem)
          ) : (
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No payslips found.</Text>
          )}
        </View>
        
        <View style={{ height: 20 + insets.bottom }} />
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
  scrollContent: {
    paddingTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monthControls: {
    flexDirection: 'row',
    gap: 16,
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
  downloadBtn: {
    padding: 8,
    backgroundColor: colors.bgSurface,
    borderRadius: 8,
  },
});

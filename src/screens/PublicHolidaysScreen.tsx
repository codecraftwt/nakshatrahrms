import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { AppText as Text } from '../components/AppText';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchPublicHolidays, clearHolidayData } from '../redux/slice/holidaySlice';

export const PublicHolidaysScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();

  const { publicHolidaysData, publicHolidaysLoading, publicHolidaysError } = useSelector((state: RootState) => state.holiday);

  useEffect(() => {
    dispatch(fetchPublicHolidays());
    return () => {
      dispatch(clearHolidayData());
    };
  }, [dispatch]);

  const renderHolidayItem = (item: any, index: number) => {
    const name = item.name || 'Holiday';
    const dateStr = item.date_from || item.date || item.start_date || '';
    
    let displayDayNum = '';
    let displayMonth = '';
    let displayDayOfWeek = '';
    
    if (dateStr) {
      try {
        const safeDateStr = dateStr.replace(' ', 'T');
        const d = new Date(safeDateStr);
        if (!isNaN(d.getTime())) {
          displayDayNum = d.toLocaleDateString('en-US', { day: 'numeric' });
          displayMonth = d.toLocaleDateString('en-US', { month: 'short' });
          displayDayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
        }
      } catch (e) {}
    }

    const contracts = item.contract_type_ids || [];

    return (
      <View key={item.id || index} style={styles.holidayCard}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{displayDayNum || dateStr.split('-')[2]?.split(' ')[0]}</Text>
          <Text style={styles.dateMonth}>{displayMonth || dateStr.split('-')[1]}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.dayText}>{displayDayOfWeek}</Text>
          {contracts.length > 0 && (
            <View style={styles.contractContainer}>
              {contracts.map((c: any) => (
                <View key={c.id} style={styles.contractBadge}>
                  <Text style={styles.contractText}>{c.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Icon name="calendar-star" size={24} color="#9C27B0" style={{ opacity: 0.5 }} />
      </View>
    );
  };

  const renderContent = () => {
    if (publicHolidaysLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (publicHolidaysError) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{publicHolidaysError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(fetchPublicHolidays())}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Adjust according to the API response structure
    const records = publicHolidaysData?.data?.records || publicHolidaysData?.records || (Array.isArray(publicHolidaysData) ? publicHolidaysData : []);

    if (records.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="calendar-blank-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>No public holidays found.</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {records.map((item: any, index: number) => renderHolidayItem(item, index))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Public Holidays</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderContent()}
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateBadge: {
    backgroundColor: '#9C27B010',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    marginRight: 16,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9C27B0',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9C27B0',
    marginTop: 2,
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dayText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  contractContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  contractBadge: {
    backgroundColor: '#9C27B015',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contractText: {
    fontSize: 10,
    color: '#9C27B0',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});

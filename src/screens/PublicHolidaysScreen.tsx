import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 375;
  const styles = createStyles(colors, isSmallDevice);
  const dispatch = useDispatch<AppDispatch>();

  const { publicHolidaysData, publicHolidaysLoading, publicHolidaysError } = useSelector((state: RootState) => state.holiday);

  useEffect(() => {
    dispatch(fetchPublicHolidays());
    return () => {
      dispatch(clearHolidayData());
    };
  }, [dispatch]);

  const MONTH_NAMES = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const renderMonthCalendar = (monthIndex: number, data: any) => {
    const { year, days, holidaysList } = data;
    
    // Calculate calendar grid
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(i);
    }
    while (grid.length % 7 !== 0) {
      grid.push(null);
    }

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < grid.length; i += 7) {
      weeks.push(grid.slice(i, i + 7));
    }
    
    return (
      <View key={monthIndex} style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Text style={styles.monthName}>{MONTH_NAMES[monthIndex]}</Text>
          <View style={styles.monthNumberBadge}>
            <Text style={styles.monthNumberText}>{String(monthIndex + 1).padStart(2, '0')}</Text>
          </View>
        </View>
        
        <View style={styles.calendarBody}>
          <View style={styles.daysOfWeekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <View key={`dow-${i}`} style={styles.dayOfWeekCell}>
                <Text style={styles.dayOfWeekText}>{d}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.daysGrid}>
            {weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekRow}>
                {week.map((dayNum, dayIndex) => {
                  const isHoliday = dayNum ? !!days[dayNum] : false;
                  return (
                    <View key={`day-${dayIndex}`} style={styles.dayCellContainer}>
                      <View style={[styles.dayCell, isHoliday && styles.holidayCell]}>
                        <Text style={[styles.dayText, isHoliday && styles.holidayText]}>{dayNum || ''}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {holidaysList.length > 0 && (
            <View style={styles.holidayListContainer}>
              {holidaysList.map((h: any, idx: number) => {
                const dayNum = new Date(h.dateObj).getDate();
                const name = h.name || 'Holiday';
                return (
                  <View key={idx} style={styles.holidayRow}>
                    <View style={styles.holidayDot} />
                    <Text style={styles.holidayRowDate}>{String(dayNum).padStart(2, '0')} {MONTH_NAMES[monthIndex].substring(0, 3)}</Text>
                    <Text style={styles.holidayRowName} numberOfLines={2}>{name}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
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

    const records = publicHolidaysData?.data?.records || publicHolidaysData?.records || (Array.isArray(publicHolidaysData) ? publicHolidaysData : []);

    if (records.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="calendar-blank-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>No public holidays found.</Text>
        </View>
      );
    }

    // Grouping holidays by month
    const groupedHolidays = records.reduce((acc: any, curr: any) => {
      const dateStr = curr.date_from || curr.date || curr.start_date || '';
      if (!dateStr) return acc;
      
      const safeDateStr = dateStr.replace(' ', 'T');
      const d = new Date(safeDateStr);
      if (isNaN(d.getTime())) return acc;
      
      const month = d.getMonth();
      if (!acc[month]) {
        acc[month] = {
           year: d.getFullYear(),
           monthIndex: month,
           days: {},
           holidaysList: []
        };
      }
      acc[month].days[d.getDate()] = true;
      acc[month].holidaysList.push({ ...curr, dateObj: d });
      return acc;
    }, {});

    const sortedMonths = Object.keys(groupedHolidays).map(Number).sort((a, b) => a - b);

    return (
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {sortedMonths.map(monthIndex => renderMonthCalendar(monthIndex, groupedHolidays[monthIndex]))}
        </View>
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

const createStyles = (colors: ThemeColors, isSmallDevice: boolean) => StyleSheet.create({
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
    padding: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    width: '48.5%', // 2 per row responsively
    borderRadius: 8,
    borderBottomRightRadius: 20, // Matches the screenshot proportionally
    borderWidth: 1,
    borderColor: '#D0E4F2', 
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 6,
  },
  monthName: {
    fontSize: isSmallDevice ? 10 : 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  monthNumberBadge: {
    backgroundColor: '#F26D21', 
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
  },
  monthNumberText: {
    color: '#FFFFFF',
    fontSize: isSmallDevice ? 12 : 13,
    fontWeight: '800',
  },
  calendarBody: {
    padding: 0,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary, 
    paddingVertical: 2,
    width: '100%',
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOfWeekText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  daysGrid: {
    padding: 2,
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    width: '100%',
  },
  dayCellContainer: {
    flex: 1,
    height: isSmallDevice ? 18 : 22, // Fixed height makes it compact and rectangular like the image
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  dayCell: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  holidayCell: {
    backgroundColor: '#F26D21', 
  },
  dayText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  holidayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  holidayListContainer: {
    paddingHorizontal: 6,
    paddingBottom: 8,
    gap: 2,
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  holidayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F26D21',
    marginTop: 5,
    marginRight: 4,
  },
  holidayRowDate: {
    fontSize: 8,
    fontWeight: '700',
    color: '#F26D21',
    width: 28,
    marginTop: 1,
  },
  holidayRowName: {
    fontSize: 8,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 11,
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

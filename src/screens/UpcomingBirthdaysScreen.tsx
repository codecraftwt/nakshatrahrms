import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { AppText as Text } from '../components/AppText';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchUpcomingBirthdays, clearBirthdayData } from '../redux/slice/birthdaySlice';

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

export const UpcomingBirthdaysScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // Default to current month

  const { upcomingBirthdaysData, upcomingBirthdaysLoading, upcomingBirthdaysError } = useSelector((state: RootState) => state.birthday);

  const loadData = useCallback(() => {
    if (selectedMonth === 0) {
      dispatch(fetchUpcomingBirthdays({}));
    } else {
      dispatch(fetchUpcomingBirthdays({ month: selectedMonth }));
    }
  }, [dispatch, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clean up data on unmount
  useEffect(() => {
    return () => {
      dispatch(clearBirthdayData());
    };
  }, [dispatch]);

  const scrollViewRef = useRef<ScrollView>(null);

  const renderMonthFilter = () => (
    <View style={styles.filterContainerRow}>
      <View style={styles.stickyAllContainer}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            selectedMonth === 0 && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setSelectedMonth(0)}
        >
          <Text style={[
            styles.filterText,
            selectedMonth === 0 && { color: '#FFFFFF', fontWeight: '700' }
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
          if (selectedMonth > 2) {
            // Approximate width of each pill + margin is ~70
            scrollViewRef.current?.scrollTo({ x: (selectedMonth - 2) * 70, animated: true });
          }
        }}
      >
        {MONTHS.filter(m => m.id !== 0).map((month) => {
          const isSelected = selectedMonth === month.id;
          return (
            <TouchableOpacity
              key={month.id}
              style={[
                styles.filterPill,
                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setSelectedMonth(month.id)}
            >
              <Text style={[
                styles.filterText,
                isSelected && { color: '#FFFFFF', fontWeight: '700' }
              ]}>
                {month.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderBirthdayItem = (item: any, index: number) => {
    // Assuming typical response might have name, department, date of birth, image_128 or image
    const name = item.name || item.employee_name || 'Employee';
    const dept = item.department?.name || (item.department_id ? (Array.isArray(item.department_id) ? item.department_id[1] : item.department_id.name) : 'Department');
    const dob = item.birthday || item.date_of_birth || '';

    // Format date if needed (e.g., from YYYY-MM-DD to DD MMM)
    let displayDate = dob;
    if (dob) {
      try {
        const d = new Date(dob);
        if (!isNaN(d.getTime())) {
          displayDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }
      } catch (e) { }
    }

    const imageSource = item.image_128 || item.image ? { uri: `data:image/jpeg;base64,${item.image_128 || item.image}` } : null;

    return (
      <View key={item.employee_id || item.id || index} style={styles.birthdayCard}>
        <View style={styles.avatarContainer}>
          {imageSource ? (
            <Image source={imageSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.deptText}>{dept}</Text>
        </View>

        <View style={styles.dateContainer}>
          <Icon name="cake-variant" size={20} color="#F29C38" />
          <Text style={styles.dateText}>{displayDate}</Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (upcomingBirthdaysLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (upcomingBirthdaysError) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{upcomingBirthdaysError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Data might be under data.employees, data.records, or just an array
    const records = upcomingBirthdaysData?.employees || upcomingBirthdaysData?.records || (Array.isArray(upcomingBirthdaysData) ? upcomingBirthdaysData : []);

    if (records.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="cake-variant-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>No upcoming birthdays found.</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {records.map((item: any, index: number) => renderBirthdayItem(item, index))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upcoming Birthdays</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderMonthFilter()}
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  birthdayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
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
  deptText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
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

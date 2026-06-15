import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodayAttendance, fetchAttendanceStatus, fetchAttendanceHistory, fetchAttendanceSummary } from '../redux/slice/attendanceSlice';
import { syncAttendance } from '../redux/slice/payrollSlice';
import { RootState, AppDispatch } from '../redux/store';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { mockAttendance } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';

export const AttendanceScreen = ({ navigation }: any) => {
  const { colors, theme } = useTheme();
  const styles = createStyles(colors);

  const dispatch = useDispatch<AppDispatch>();
  const { todayData, statusData, historyData, summaryData, loading } = useSelector((state: RootState) => state.attendance);
  const { syncLoading, syncSuccess, syncError } = useSelector((state: RootState) => state.payroll);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchTodayAttendance());
      dispatch(fetchAttendanceStatus());
    }, [dispatch])
  );

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());

  React.useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    dispatch(fetchAttendanceHistory(`${year}-${month}`));
    dispatch(fetchAttendanceSummary(`${year}-${month}`));
  }, [selectedDate, dispatch]);

  React.useEffect(() => {
    if (syncSuccess) {
      // Optional: you can show a toast or alert here if needed
    }
  }, [syncSuccess]);

  const handleOpenPicker = () => {
    setPickerYear(selectedDate.getFullYear());
    setShowPicker(true);
  };

  const selectMonth = (monthIndex: number) => {
    setSelectedDate(new Date(pickerYear, monthIndex, 1));
    setShowPicker(false);
  };

  const getMonthYearText = (date: Date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getSafeHours = (hours: number | undefined) => {
    if (!hours) return 0;
    // Backend bug: returning seconds instead of hours
    if (hours > 24) return hours / 3600;
    return hours;
  };

  const renderCalendarGrid = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    let cells = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }
    
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      let isToday = isCurrentMonth && d === today.getDate();
      let status = '';
      
      // Map actual API data if available
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const record = historyData?.records?.find((r: any) => r.date === dateStr);

      if (record) {
        if (record.status === 'absent' || record.status === 'leave') {
            status = 'absent';
        } else if (record.status === 'half_day' || record.status === 'present' || record.attendances?.length > 0) {
            status = 'present';
        }
      } else {
        // Fallback simple logic
        const dayOfWeek = new Date(year, month, d).getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          if (new Date(year, month, d) < today) {
             status = 'absent';
          }
        }
      }

      cells.push(
        <View 
          key={`day-${d}`} 
          style={[
            styles.dayCell, 
            status === 'present' && styles.presentCell,
            status === 'absent' && styles.absentCell,
            isToday && styles.todayCell
          ]}
        >
          {isToday && <View style={styles.todayIndicator} />}
          <Text style={[
            styles.dayText,
            status === 'present' && styles.presentText,
            status === 'absent' && styles.absentText,
            isToday && styles.todayText
          ]}>{d}</Text>
        </View>
      );
    }
    
    // Empty cells for the end of the month to fix spacing
    const totalItems = firstDay + daysInMonth;
    const remainingCells = (7 - (totalItems % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      cells.push(<View key={`empty-end-${i}`} style={styles.emptyDay} />);
    }
    
    return cells;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        
        <TouchableOpacity 
          style={styles.headerSyncBtn}
          onPress={() => dispatch(syncAttendance({}))}
          disabled={syncLoading}
          activeOpacity={0.7}
        >
          {syncLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="sync" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Today's Status Card */}
        <View style={[styles.calendarCard, { marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 }]}>
          <View>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Today's Status</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 4, textTransform: 'capitalize' }}>
              {statusData?.state ? statusData.state.replace('_', ' ') : (todayData?.attendance_state ? todayData.attendance_state.replace('_', ' ') : 'Pending')}
            </Text>
            {statusData?.has_punched_in_today && (
              <Text style={{ fontSize: 12, color: colors.success, marginTop: 2 }}>Punched In</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Hours Worked</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: 4 }}>
              {getSafeHours(todayData?.hours_today).toFixed(2)} hrs
            </Text>
            {statusData?.has_punched_out_today && (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Punched Out</Text>
            )}
          </View>
        </View>

        {/* Month Navigator */}
        <View style={styles.monthNavContainer}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
          >
            <Icon name="chevron-left" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.monthTextContainer} 
            activeOpacity={0.7}
            onPress={handleOpenPicker}
          >
            <Icon name="calendar-month-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.monthText}>{getMonthYearText(selectedDate)}</Text>
            <Icon name="chevron-down" size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
          >
            <Icon name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryTile, { backgroundColor: colors.successBg }]}>
            <Text style={[styles.summaryValue, { color: colors.successText }]}>{summaryData?.summary?.present || 0}</Text>
            <Text style={[styles.summaryLabel, { color: colors.successText }]}>Present</Text>
          </View>
          <View style={[styles.summaryTile, { backgroundColor: colors.warningBg }]}>
            <Text style={[styles.summaryValue, { color: colors.warningText }]}>{summaryData?.summary?.half_day || 0}</Text>
            <Text style={[styles.summaryLabel, { color: colors.warningText }]}>Half Day</Text>
          </View>
          <View style={[styles.summaryTile, { backgroundColor: colors.dangerBg }]}>
            <Text style={[styles.summaryValue, { color: colors.dangerText }]}>{summaryData?.summary?.absent || 0}</Text>
            <Text style={[styles.summaryLabel, { color: colors.dangerText }]}>Absent</Text>
          </View>
          <View style={[styles.summaryTile, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{summaryData?.summary?.leave || 0}</Text>
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>Leave</Text>
          </View>
        </View>

        {/* Premium Calendar Card */}
        <View style={styles.calendarCard}>
          <View style={styles.dayHeaders}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.dayHeaderText}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {renderCalendarGrid()}
          </View>
        </View>

        {/* Custom Month/Year Picker Modal */}
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
            <Pressable style={styles.pickerModalContent}>
              
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setPickerYear(y => y - 1)} style={styles.pickerNavBtn}>
                  <Icon name="chevron-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.pickerYearText}>{pickerYear}</Text>
                <TouchableOpacity onPress={() => setPickerYear(y => y + 1)} style={styles.pickerNavBtn}>
                  <Icon name="chevron-right" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.monthsGrid}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mon, idx) => {
                  const isSelected = selectedDate.getMonth() === idx && selectedDate.getFullYear() === pickerYear;
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={[styles.monthCell, isSelected && styles.monthCellSelected]}
                      onPress={() => selectMonth(idx)}
                    >
                      <Text style={[styles.monthCellText, isSelected && styles.monthCellTextSelected]}>{mon}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

            </Pressable>
          </Pressable>
        </Modal>

        <Text style={styles.sectionTitle}>Recent Logs</Text>

        {/* Premium List Container */}
        <View style={styles.listContainer}>
          {historyData?.records?.filter((r: any) => r.attendances?.length > 0 || r.leave_requests?.length > 0)
            .reverse()
            .slice(0, 5)
            .map((item: any, idx: number) => {
              const attendance = item.attendances?.[0];
              const leave = item.leave_requests?.[0];
              let badgeStatus = item.status === 'half_day' ? 'half-day' : (item.status === 'leave' ? 'leave' : 'present');
              let iconName = item.status === 'leave' ? 'calendar-minus' : 'check-circle-outline';
              let iconColor = item.status === 'leave' ? colors.warning : colors.success;

              return (
              <TouchableOpacity 
                key={idx} 
                style={styles.listCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('RouteDetailScreen', { date: item.date })}
              >
                <View style={styles.listIconBox}>
                  <Icon 
                    name={iconName} 
                    size={24} 
                    color={iconColor} 
                  />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.itemDate}>{item.date}</Text>
                  {attendance?.check_in && <Text style={styles.itemTime}>In: {(() => {
                    let isoStr = attendance.check_in;
                    if (isoStr.includes(' ') && !isoStr.includes('T')) {
                      isoStr = isoStr.replace(' ', 'T') + 'Z';
                    }
                    const d = new Date(isoStr);
                    if (isNaN(d.getTime())) return attendance.check_in.split(' ')[1];
                    let hours = d.getHours();
                    let minutes = d.getMinutes().toString().padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    return `${hours}:${minutes} ${ampm}`;
                  })()}</Text>}
                  {leave && !attendance && <Text style={styles.itemTime}>{leave.leave_type?.name}</Text>}
                </View>
                <StatusBadge status={badgeStatus as any} />
              </TouchableOpacity>
              )
          })}
          {(!historyData?.records || historyData.records.filter((r: any) => r.attendances?.length > 0 || r.leave_requests?.length > 0).length === 0) && (
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No recent logs found.</Text>
          )}
        </View>

        <View style={{ height: 20 }} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.bgPage,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSyncBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(21, 88, 176, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  monthNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.bgPage,
  },
  monthTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  calendarCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 5,
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayHeaderText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    width: '13%',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  dayCell: {
    width: '13%', 
    aspectRatio: 1,
    borderRadius: 20, // Make them fully round instead of slightly rounded
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDay: {
    width: '13%',
    aspectRatio: 1,
  },
  dayText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  presentCell: {
    backgroundColor: colors.successBg,
  },
  presentText: {
    color: colors.successText,
    fontWeight: '600',
  },
  absentCell: {
    backgroundColor: colors.dangerBg,
  },
  absentText: {
    color: colors.dangerText,
    fontWeight: '600',
  },
  todayCell: {
    backgroundColor: colors.bgPage,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  todayText: {
    color: colors.primary,
    fontWeight: '700',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  listContainer: {
    gap: 12, // Spaces out the cards beautifully
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.04)',
  },
  listIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listTextContainer: {
    flex: 1,
  },
  itemDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContent: {
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pickerNavBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.bgPage,
  },
  pickerYearText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  monthCell: {
    width: '30%',
    aspectRatio: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.bgPage,
  },
  monthCellSelected: {
    backgroundColor: colors.primary,
  },
  monthCellText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  monthCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16,
  },
  summaryTile: {
    width: '23%',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

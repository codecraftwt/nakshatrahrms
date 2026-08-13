import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Animated, Easing, Dimensions, ScrollView } from 'react-native';
import { AppText as Text } from './AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';

interface GlassDateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (date: Date) => void;
  initialDate: Date;
  title?: string;
  mode?: 'date' | 'datetime';
}

const { width } = Dimensions.get('window');

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

export const GlassDateTimePickerModal = ({
  visible,
  onClose,
  onSave,
  initialDate,
  title = "Select Date & Time",
  mode = 'datetime'
}: GlassDateTimePickerModalProps) => {
  const { colors } = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState<'TIME' | 'DATE'>('TIME');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(initialDate));
  
  // Time Picker State
  const [timeMode, setTimeMode] = useState<'HOURS' | 'MINUTES'>('HOURS');
  
  // Update local state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedDate(new Date(initialDate));
      setActiveTab(mode === 'date' ? 'DATE' : 'TIME');
      setTimeMode('HOURS');
    }
  }, [visible, initialDate, mode]);

  const handleSave = () => {
    onSave(selectedDate);
    onClose();
  };

  // ---- TIME LOGIC ----
  const currentHour = selectedDate.getHours();
  const currentMinute = selectedDate.getMinutes();
  const isPM = currentHour >= 12;
  const displayHour = currentHour % 12 || 12;

  const handleHourSelect = (h: number) => {
    const newDate = new Date(selectedDate);
    let updatedHour = h;
    if (isPM && h !== 12) updatedHour += 12;
    if (!isPM && h === 12) updatedHour = 0;
    newDate.setHours(updatedHour);
    setSelectedDate(newDate);
    setTimeMode('MINUTES');
  };

  const handleMinuteSelect = (m: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMinutes(m);
    setSelectedDate(newDate);
  };

  const toggleAMPM = (setToPM: boolean) => {
    if (setToPM === isPM) return;
    const newDate = new Date(selectedDate);
    if (setToPM) {
      newDate.setHours(currentHour + 12);
    } else {
      newDate.setHours(currentHour - 12);
    }
    setSelectedDate(newDate);
  };

  const renderClockDial = () => {
    const radius = 95;
    const center = 100; // 200x200 container
    
    const items = timeMode === 'HOURS' 
      ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    return (
      <View style={styles.clockContainer}>
        {items.map((val, index) => {
          // Angle logic (start at top, which is -90 degrees)
          const angle = (index / 12) * 2 * Math.PI - Math.PI / 2;
          const x = center + radius * Math.cos(angle) - 20; // 20 is half of item width
          const y = center + radius * Math.sin(angle) - 20;
          
          let isActive = false;
          if (timeMode === 'HOURS' && val === displayHour) isActive = true;
          if (timeMode === 'MINUTES' && val === currentMinute) isActive = true;

          // For minutes, if it doesn't snap perfectly to 5, we just highlight if it's close or exact
          if (timeMode === 'MINUTES' && currentMinute >= val && currentMinute < val + 5) {
             isActive = true;
          }

          return (
            <TouchableOpacity 
              key={val}
              style={[
                styles.dialItem, 
                { left: x, top: y },
                isActive && styles.dialItemActive
              ]}
              onPress={() => timeMode === 'HOURS' ? handleHourSelect(val) : handleMinuteSelect(val)}
            >
              <Text style={[styles.dialText, isActive && styles.dialTextActive]}>
                {timeMode === 'MINUTES' ? String(val).padStart(2, '0') : val}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* Center Dot */}
        <View style={styles.clockCenterDot} />
      </View>
    );
  };

  // ---- DATE LOGIC ----
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const currentDateNum = selectedDate.getDate();

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(currentMonth + delta);
    setSelectedDate(newDate);
  };

  const selectDate = (dayNum: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(dayNum);
    setSelectedDate(newDate);
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Icon name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.calendarMonthText}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Icon name="chevron-right" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.daysOfWeekRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={i} style={styles.dayOfWeekText}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {grid.map((dayNum, i) => {
            const isActive = dayNum === currentDateNum;
            return (
              <View key={i} style={styles.dayCellContainer}>
                {dayNum ? (
                  <TouchableOpacity 
                    style={[styles.dayCell, isActive && styles.dayCellActive]}
                    onPress={() => selectDate(dayNum)}
                  >
                    <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{dayNum}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    );
  };


  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Glassmorphism Card */}
        <View style={styles.glassCard}>
          <Text style={styles.titleText}>{title}</Text>
          
          {/* Main Time Display */}
          {mode !== 'date' && (
            <View style={styles.timeDisplayContainer}>
              <TouchableOpacity onPress={() => { setActiveTab('TIME'); setTimeMode('HOURS'); }}>
                <Text style={[styles.largeTimeText, activeTab === 'TIME' && timeMode === 'HOURS' && styles.glowText]}>
                  {String(displayHour).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
              <Text style={styles.largeTimeTextColon}>:</Text>
              <TouchableOpacity onPress={() => { setActiveTab('TIME'); setTimeMode('MINUTES'); }}>
                <Text style={[styles.largeTimeText, activeTab === 'TIME' && timeMode === 'MINUTES' && styles.glowText]}>
                  {String(currentMinute).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
              <View style={styles.ampmContainer}>
                <TouchableOpacity onPress={() => toggleAMPM(false)}>
                  <Text style={[styles.ampmText, !isPM && styles.ampmActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleAMPM(true)}>
                  <Text style={[styles.ampmText, isPM && styles.ampmActive]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Date Sub-display */}
          <TouchableOpacity onPress={() => mode !== 'date' && setActiveTab('DATE')} disabled={mode === 'date'}>
            <Text style={[
              styles.dateSubText, 
              mode === 'date' && { fontSize: 24, fontWeight: '700', color: '#E0E6ED', marginBottom: 24, marginTop: 12 },
              activeTab === 'DATE' && mode !== 'date' && styles.glowText
            ]}>
              {MONTH_NAMES[currentMonth].substring(0, 3)} {currentDateNum}, {currentYear}
            </Text>
          </TouchableOpacity>

          {/* Tabs */}
          {mode !== 'date' && (
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'TIME' && styles.tabBtnActive]}
                onPress={() => setActiveTab('TIME')}
              >
                <Icon name="clock-outline" size={16} color={activeTab === 'TIME' ? '#4DABF7' : '#A0AAB5'} style={{marginRight: 6}} />
                <Text style={[styles.tabText, activeTab === 'TIME' && styles.tabTextActive]}>TIME</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'DATE' && styles.tabBtnActive]}
                onPress={() => setActiveTab('DATE')}
              >
                <Icon name="calendar-blank" size={16} color={activeTab === 'DATE' ? '#4DABF7' : '#A0AAB5'} style={{marginRight: 6}} />
                <Text style={[styles.tabText, activeTab === 'DATE' && styles.tabTextActive]}>DATE</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Active Content Body */}
          <View style={styles.contentBody}>
             {activeTab === 'TIME' ? renderClockDial() : renderCalendar()}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave}>
              <Text style={styles.saveText}>SAVE</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    width: width * 0.9,
    backgroundColor: 'rgba(30, 35, 45, 0.96)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  titleText: {
    color: '#A0AAB5',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timeDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  largeTimeText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#E0E6ED',
  },
  largeTimeTextColon: {
    fontSize: 56,
    fontWeight: '300',
    color: '#E0E6ED',
    marginHorizontal: 4,
    opacity: 0.5,
  },
  glowText: {
    color: '#4DABF7',
    textShadowColor: 'rgba(77, 171, 247, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  ampmContainer: {
    marginLeft: 12,
  },
  ampmText: {
    color: '#A0AAB5',
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 2,
  },
  ampmActive: {
    color: '#4DABF7',
  },
  dateSubText: {
    color: '#A0AAB5',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabText: {
    color: '#A0AAB5',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#4DABF7',
  },
  contentBody: {
    width: '100%',
    height: 240, // Fixed height so UI doesn't jump
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ---- Clock Dial ----
  clockContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dialItem: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialItemActive: {
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    borderWidth: 1,
    borderColor: '#4DABF7',
    shadowColor: '#4DABF7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  dialText: {
    color: '#E0E6ED',
    fontSize: 16,
    fontWeight: '500',
  },
  dialTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  clockCenterDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4DABF7',
    left: 96,
    top: 96,
  },
  // ---- Calendar ----
  calendarContainer: {
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  calendarMonthText: {
    color: '#E0E6ED',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayOfWeekText: {
    width: `${100/7}%`,
    textAlign: 'center',
    color: '#A0AAB5',
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellContainer: {
    width: `${100/7}%`,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellActive: {
    backgroundColor: '#4DABF7',
    shadowColor: '#4DABF7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  dayText: {
    color: '#E0E6ED',
    fontSize: 14,
    fontWeight: '500',
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // ---- Actions ----
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 12,
    borderRadius: 8,
  },
  cancelText: {
    color: '#A0AAB5',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  saveBtn: {
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.5)',
  },
  saveText: {
    color: '#4DABF7',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

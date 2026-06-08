import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppText as Text } from '../components/AppText';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Typography } from '../theme/typography';

export const ApplyLeaveScreen = ({ navigation }: any) => {
  const [type, setType] = useState('Sick Leave');
  const [startDate, setStartDate] = useState(new Date(2025, 5, 15));
  const [endDate, setEndDate] = useState(new Date(2025, 5, 16));
  const [reason, setReason] = useState('');

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');

  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const styles = createStyles(colors);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (pickerMode === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const openPicker = (mode: 'start' | 'end') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Premium Header Background Elements */}
      <View style={styles.headerBackground} />
      <View style={styles.shape1} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Leaves</Text>
      </View>

      <View style={[styles.infoBox, { marginHorizontal: 20 }]}>
        <View style={styles.infoIconBox}>
          <Icon name="information-variant" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Sick Leave Balance</Text>
          <Text style={styles.infoText}>You have 5 days remaining this year.</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={60}
        enableAutomaticScroll={true}
      >


          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Leave Details</Text>

            <Text style={styles.label}>Select Type</Text>
            <View style={styles.typeSelector}>
              {['Sick Leave', 'Casual Leave', 'Earned Leave'].map((item) => {
                const isActive = type === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.typeOption, isActive && styles.typeOptionActive]}
                    onPress={() => setType(item)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={item === 'Sick Leave' ? 'medical-bag' : item === 'Casual Leave' ? 'beach' : 'briefcase'}
                      size={16}
                      color={isActive ? '#FFFFFF' : colors.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.typeOptionText, isActive && styles.typeOptionTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dateRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputField
                  label="Start Date"
                  placeholder="YYYY-MM-DD"
                  value={formatDate(startDate)}
                  onChangeText={() => { }}
                  leftIcon="calendar-start"
                  onPress={() => openPicker('start')}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputField
                  label="End Date"
                  placeholder="YYYY-MM-DD"
                  value={formatDate(endDate)}
                  onChangeText={() => { }}
                  leftIcon="calendar-end"
                  onPress={() => openPicker('end')}
                />
              </View>
            </View>

            <InputField
              label="Reason for leave"
              placeholder="Please briefly explain your reason..."
              value={reason}
              onChangeText={setReason}
              multiline
              height={120}
            />

            <PrimaryButton
              label="Submit Application"
              onPress={() => navigation.goBack()}
              style={styles.submitBtn}
            />

            {showPicker && (
              <DateTimePicker
                value={pickerMode === 'start' ? startDate : endDate}
                mode="date"
                display="default"
                themeVariant={theme}
                onChange={handleDateChange}
              />
            )}
          </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 180,
    backgroundColor: colors.primary,
  },
  shape1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    padding: 16,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.05)',
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.infoBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 32,
    padding: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  sectionHeading: {
    ...Typography.h2,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(21, 88, 176, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.0)',
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  typeOptionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitBtn: {
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
});

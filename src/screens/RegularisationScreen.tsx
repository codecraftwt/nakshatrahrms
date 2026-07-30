import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { createRegularization } from '../redux/slice/regularisationSlice';

export const RegularisationScreen = ({ navigation }: any) => {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showFromTimePicker, setShowFromTimePicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showToTimePicker, setShowToTimePicker] = useState(false);

  const [customAlert, setCustomAlert] = useState<{ visible: boolean, title: string, message: string }>({
    visible: false, title: '', message: ''
  });

  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const dispatch = useDispatch<AppDispatch>();
  const { createRegularizationLoading } = useSelector((state: RootState) => state.regularisation);
  const { user } = useSelector((state: RootState) => state.auth);

  const formatDateForDisplay = (dateObj: Date) => {
    const datePart = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} - ${timePart}`;
  };

  const formatDateForApi = (dateObj: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:00`;
  };

  const handleSubmit = async () => {
    if (toDate < fromDate) {
      setCustomAlert({
        visible: true,
        title: 'Invalid Dates',
        message: 'End Date cannot be earlier than Start Date.',
      });
      return;
    }

    const payload = {
      from: formatDateForApi(fromDate),
      to: formatDateForApi(toDate),
    };

    const action = await dispatch(createRegularization(payload));
    
    if (createRegularization.rejected.match(action)) {
      setCustomAlert({
        visible: true,
        title: 'Submission Failed',
        message: (action.payload as string) || 'Failed to submit regularization request.',
      });
    } else {
      setCustomAlert({
        visible: true,
        title: 'Success',
        message: 'Attendance regularization requested successfully.',
      });
      setTimeout(() => {
        setCustomAlert(prev => ({ ...prev, visible: false }));
        navigation.goBack();
      }, 1500);
    }
  };

  const renderCustomAlert = () => (
    <Modal visible={customAlert.visible} transparent animationType="fade">
      <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.modalContent, { width: '85%', borderRadius: 16, padding: 24 }]}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' }}>{customAlert.title}</Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>{customAlert.message}</Text>
          <TouchableOpacity 
            style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
            onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} disabled={createRegularizationLoading}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regularize Attendance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.helperText}>
          Request an attendance regularization.
        </Text>
        
        {user?.name && (
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Employee</Text>
            <Text style={styles.readOnlyValue}>{user.name}</Text>
          </View>
        )}

        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Permission Type</Text>
          <Text style={styles.readOnlyValue}>Regularization</Text>
        </View>

        <InputField
          label="Start Date & Time"
          placeholder="Select Start Date & Time"
          value={formatDateForDisplay(fromDate)}
          onChangeText={() => {}}
          rightIcon="calendar-clock"
          onPress={() => setShowFromPicker(true)}
        />

        <InputField
          label="End Date & Time"
          placeholder="Select End Date & Time"
          value={formatDateForDisplay(toDate)}
          onChangeText={() => {}}
          rightIcon="calendar-clock"
          onPress={() => setShowToPicker(true)}
        />

        <PrimaryButton 
          label={createRegularizationLoading ? "Submitting..." : "Submit"}
          onPress={handleSubmit}
          style={styles.submitBtn}
          disabled={createRegularizationLoading}
        />
      </ScrollView>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) {
              const newDate = new Date(fromDate);
              newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
              setFromDate(newDate);
              setTimeout(() => setShowFromTimePicker(true), 500); // Open time picker after date
            }
          }}
        />
      )}

      {showFromTimePicker && (
        <DateTimePicker
          value={fromDate}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFromTimePicker(false);
            if (selectedDate) {
              const newDate = new Date(fromDate);
              newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0);
              setFromDate(newDate);
            }
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          minimumDate={fromDate}
          onChange={(event, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) {
              const newDate = new Date(toDate);
              newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
              setToDate(newDate);
              setTimeout(() => setShowToTimePicker(true), 500);
            }
          }}
        />
      )}

      {showToTimePicker && (
        <DateTimePicker
          value={toDate}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowToTimePicker(false);
            if (selectedDate) {
              const newDate = new Date(toDate);
              newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0);
              setToDate(newDate);
            }
          }}
        />
      )}

      {renderCustomAlert()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    ...Typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  body: {
    padding: 16,
    flexGrow: 1,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  submitBtn: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
  },
  readOnlyField: {
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  readOnlyValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

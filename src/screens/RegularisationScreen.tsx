import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

export const RegularisationScreen = ({ navigation }: any) => {
  const [date, setDate] = useState('Mon, 1 Jun 2025');
  const [type, setType] = useState('Missed punch out');
  const [time, setTime] = useState('06:00 PM');
  const [reason, setReason] = useState('');
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regularisation request</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.helperText}>
          Request correction for a missed or wrong punch
        </Text>

        <InputField
          label="Select date"
          placeholder="Date"
          value={date}
          onChangeText={setDate}
          rightIcon="calendar"
        />

        <InputField
          label="Request type"
          placeholder="Type"
          value={type}
          onChangeText={setType}
          rightIcon="chevron-down"
        />

        <InputField
          label="Correction time"
          placeholder="Time"
          value={time}
          onChangeText={setTime}
          rightIcon="clock-outline"
        />

        <InputField
          label="Reason"
          placeholder="Enter reason..."
          value={reason}
          onChangeText={setReason}
          multiline
          height={80}
        />

        <PrimaryButton 
          label="Submit request"
          onPress={() => navigation.goBack()}
          style={styles.submitBtn}
        />
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
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
});

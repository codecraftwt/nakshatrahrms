import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';

export const SettingsScreen = ({ navigation }: any) => {
  const { colors, theme, toggleTheme } = useTheme();
  const styles = createStyles(colors);
  
  const isDarkMode = theme === 'dark';

  const renderSettingItem = (
    icon: string, 
    label: string, 
    onPress?: () => void, 
    rightElement?: React.ReactNode,
    danger?: boolean
  ) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size={22} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.settingLabel, danger && { color: colors.danger }]}>{label}</Text>
      {rightElement || (onPress ? <Icon name="chevron-right" size={24} color={colors.border} /> : null)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          {renderSettingItem('bell-outline', 'Push Notifications', () => {})}
          <View style={styles.divider} />
          {renderSettingItem(
            isDarkMode ? 'weather-night' : 'weather-sunny', 
            'Dark Mode', 
            undefined,
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleTheme} 
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#FFFFFF'}
            />
          )}
          <View style={styles.divider} />
          {renderSettingItem('translate', 'Language', () => {}, <Text style={styles.valueText}>English</Text>)}
        </View>

        <Text style={styles.sectionTitle}>Security & Privacy</Text>
        <View style={styles.card}>
          {renderSettingItem('lock-outline', 'Change Password', () => {})}
          <View style={styles.divider} />
          {renderSettingItem('fingerprint', 'Biometric Login', undefined, 
            <Switch 
              value={true} 
              onValueChange={() => {}} 
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#FFFFFF'}
            />
          )}
          <View style={styles.divider} />
          {renderSettingItem('shield-account-outline', 'Privacy Policy', () => {})}
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          {renderSettingItem('help-circle-outline', 'Help Center', () => {})}
          <View style={styles.divider} />
          {renderSettingItem('message-text-outline', 'Contact Us', () => {})}
          <View style={styles.divider} />
          {renderSettingItem('information-outline', 'About App', () => {}, <Text style={styles.valueText}>v1.0.0</Text>)}
        </View>


        <View style={{ height: 40 }} />
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
    backgroundColor: colors.bgPage,
  },
  backBtn: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    ...Typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.04)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.3,
  },
  valueText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
});

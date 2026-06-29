import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';

export const PrivacyPolicyScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const policies = [
    { 
      title: "1. Introduction", 
      text: "Welcome to our Privacy Policy. Your privacy is critically important to us, and we are committed to protecting it." 
    },
    { 
      title: "2. Data Collection", 
      text: "We collect information to provide better services to all our users. We may collect personal information such as your name, employee code, email address, selfie, and location data when you use the app." 
    },
    { 
      title: "3. Data Usage", 
      text: "The information we collect is used to verify attendance range, track travel distance (Km) during active shift hours, improve our services, and ensure the security of our platform." 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>App Privacy Guidelines</Text>
        {policies.map((policy, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.policyTitle}>{policy.title}</Text>
            <Text style={styles.policyText}>{policy.text}</Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.bgPage },
  backBtn: { marginRight: 16, padding: 4 },
  headerTitle: { ...Typography.h2, color: colors.textPrimary, flex: 1 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  card: { backgroundColor: colors.bgSurface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(21, 88, 176, 0.04)', shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  policyTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  policyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});

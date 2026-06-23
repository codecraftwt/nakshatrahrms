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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>1. Introduction</Text>
        <Text style={styles.paragraph}>Welcome to our Privacy Policy. Your privacy is critically important to us.</Text>
        
        <Text style={styles.title}>2. Data Collection</Text>
        <Text style={styles.paragraph}>We collect information to provide better services to all our users. We may collect personal information such as your name, email address, and location data when you use the app.</Text>

        <Text style={styles.title}>3. Data Usage</Text>
        <Text style={styles.paragraph}>The information we collect is used to improve our services, communicate with you, and ensure the security of our platform.</Text>
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
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  paragraph: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});

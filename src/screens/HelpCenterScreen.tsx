import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';

export const HelpCenterScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const faqs = [
    { q: "How do I punch in?", a: "Go to the Home tab and tap the 'Punch In' button. You may be required to take a selfie and be within office range." },
    { q: "How can I apply for leave?", a: "Navigate to the Leave tab, tap the '+' button, select the dates and leave type, and submit your request." },
    { q: "What should I do if I forgot to punch out?", a: "You can apply for regularisation from the Home screen by selecting 'Regularise' and providing the details of your missed punch." },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.question}>{faq.q}</Text>
            <Text style={styles.answer}>{faq.a}</Text>
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
  question: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  answer: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});

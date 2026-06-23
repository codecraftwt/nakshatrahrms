import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';

export const ContactUsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Icon name="email-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>support@example.com</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Icon name="phone-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>+1 (800) 123-4567</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Icon name="map-marker-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>123 Business Avenue, Suite 100, Tech City, TX 75001</Text>
          </View>
        </View>
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(21, 88, 176, 0.04)' },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(21, 88, 176, 0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  info: { flex: 1 },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
});

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';

export const ContactUsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const email = 'chandrakant@nakshatrainfo.com';
  const phone = '+91 9766668855';
  const website = 'www.nakshatrainfo.com';
  const address = 'Near, 15/54 ,Hajare Building, Shatkon Chowk, Tin Batti Chowk, Ichalkaranji, Maharashtra -  416115';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Email Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Linking.openURL(`mailto:${email}`);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
            <Icon name="email-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{email}</Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        {/* Phone Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
            <Icon name="phone-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{phone}</Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        {/* Website Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Linking.openURL('https://' + website).catch(err => {
              console.error('Failed to open website:', err);
            });
          }}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
            <Icon name="web" size={24} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Website</Text>
            <Text style={styles.value}>{website}</Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        {/* Address Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            const mapUrl = 'https://www.google.com/maps/place/Nakshatra+Solutions/@16.6883094,74.4689313,17z/data=!3m1!4b1!4m6!3m5!1s0x3bc0e2801a8a3de9:0xd7c192a40876cfff!8m2!3d16.6883094!4d74.4689313!16s%2Fg%2F1pp2vfnh9?hl=en&entry=ttu&g_ep=EgoyMDI2MDYyMi4wIKXMDSoASAFQAw%3D%3D';
            Linking.openURL(mapUrl).catch(err => {
              console.error('Failed to open maps:', err);
            });
          }}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
            <Icon name="map-marker-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{address}</Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bgPage 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: colors.bgPage 
  },
  backBtn: { 
    marginRight: 16, 
    padding: 4 
  },
  headerTitle: { 
    ...Typography.h2, 
    color: colors.textPrimary, 
    flex: 1 
  },
  content: { 
    padding: 20 
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.bgSurface, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: colors.border,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: 'rgba(21, 88, 176, 0.08)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  info: { 
    flex: 1 
  },
  label: { 
    fontSize: 12, 
    color: colors.textSecondary, 
    fontWeight: '500',
    marginBottom: 4 
  },
  value: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: colors.textPrimary 
  },
  chevron: {
    marginLeft: 8,
  },
});

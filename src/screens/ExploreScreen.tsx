import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { AppText as Text } from '../components/AppText';

const { width } = Dimensions.get('window');

export const ExploreScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const CARDS = [
    {
      title: 'Add Expense',
      subtitle: 'Manage your expenses easily',
      icon: 'cash-plus',
      color: colors.warning,
      bg: colors.warningBg,
      route: 'ExpenseListScreen',
    },
    {
      title: 'Pay Slip',
      subtitle: 'Download your pay slip',
      icon: 'file-document-outline',
      color: colors.success,
      bg: colors.successBg,
      route: 'PayslipListScreen',
    },
    {
      title: 'Birthdays',
      subtitle: 'Upcoming birthdays',
      icon: 'cake-variant-outline',
      color: colors.danger,
      bg: colors.dangerBg,
      route: 'UpcomingBirthdaysScreen',
    },
    {
      title: 'Holidays',
      subtitle: 'List of public holidays',
      icon: 'calendar-star',
      color: colors.info,
      bg: colors.infoBg,
      route: 'PublicHolidaysScreen',
    },
    {
      title: 'Regularization',
      subtitle: 'Regularize attendance',
      icon: 'clock-check-outline',
      color: colors.primary,
      bg: isDark ? colors.bgPunchCard : '#E6F0FF',
      route: 'MyRegularisationListScreen',
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerGreeting}>DISCOVER</Text>
        <Text style={styles.headerTitle}>
          What are you{'\n'}looking for?
        </Text>
        <View style={styles.headerLine} />
        <Text style={styles.headerSubtitle}>
          Explore and manage everything{'\n'}you need in one place.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {CARDS.map((card, index) => {
            const isOdd = CARDS.length % 2 !== 0;
            const isFullWidth = isOdd && index === CARDS.length - 1;

            return (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.gridCard, 
                  isFullWidth && styles.fullWidthCard
                ]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate(card.route)}
              >
                {/* Decorative Bottom-Right Blob */}
                <View style={[styles.cardDecoration, { backgroundColor: card.bg }]} />

                {isFullWidth ? (
                  <View style={styles.fullWidthContent}>
                    <View style={styles.fullWidthLeft}>
                      <View style={styles.fullWidthHeaderRow}>
                        <View style={[styles.iconContainer, { backgroundColor: card.bg, shadowColor: card.color }]}>
                          <Icon name={card.icon} size={22} color={card.color} />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          <Text style={styles.cardTitle}>{card.title}</Text>
                        </View>
                      </View>
                      <Text style={[styles.cardSubtitle, { marginTop: 4 }]} numberOfLines={2}>{card.subtitle}</Text>
                      <View style={[styles.arrowButton, { backgroundColor: card.bg, marginTop: 12 }]}>
                        <Icon name="arrow-right" size={14} color={card.color} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={[styles.iconContainer, { backgroundColor: card.bg, shadowColor: card.color }]}>
                      <Icon name={card.icon} size={22} color={card.color} />
                    </View>
                    <View style={styles.cardTextContent}>
                      <Text style={styles.cardTitle}>{card.title}</Text>
                      <Text style={styles.cardSubtitle} numberOfLines={2}>{card.subtitle}</Text>
                    </View>
                    <View style={[styles.arrowButton, { backgroundColor: card.bg }]}>
                      <Icon name="arrow-right" size={14} color={card.color} />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerGreeting: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 12,
    color: colors.textPrimary,
  },
  headerLine: {
    width: 32,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 52) / 2, // slightly smaller width to allow for gaps
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: isDark ? '#000' : colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.04,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: isDark ? colors.border : 'rgba(0,0,0,0.02)',
    overflow: 'hidden',
    backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
  },
  fullWidthCard: {
    width: '100%',
  },
  cardDecoration: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.8,
  },
  fullWidthContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fullWidthLeft: {
    flex: 1,
    paddingRight: 40,
  },
  fullWidthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTextContent: {
    minHeight: 44, // Reduced from 56
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});

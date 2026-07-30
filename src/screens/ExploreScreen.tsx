import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { AppText as Text } from '../components/AppText';

export const ExploreScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          
          {/* Add Expense Card */}
          <TouchableOpacity 
            style={[styles.gridCard, { borderLeftColor: '#F29C38' }]}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('ExpenseListScreen');
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#F29C3820' }]}>
                <Icon name="cash-plus" size={24} color="#F29C38" />
              </View>
            </View>
            <Text style={styles.cardTitle}>Add Expense</Text>
            <Text style={styles.cardSubtitle}>Manage expenses</Text>
          </TouchableOpacity>

          {/* Pay Slip Card */}
          <TouchableOpacity 
            style={[styles.gridCard, { borderLeftColor: '#4CAF50' }]}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('PayslipListScreen');
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#4CAF5020' }]}>
                <Icon name="file-document-outline" size={24} color="#4CAF50" />
              </View>
            </View>
            <Text style={styles.cardTitle}>Pay Slip</Text>
            <Text style={styles.cardSubtitle}>Download salary slip</Text>
          </TouchableOpacity>

          {/* Upcoming Birthdays Card */}
          <TouchableOpacity 
            style={[styles.gridCard, { borderLeftColor: '#E91E63' }]}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('UpcomingBirthdaysScreen');
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#E91E6320' }]}>
                <Icon name="cake-variant" size={24} color="#E91E63" />
              </View>
            </View>
            <Text style={styles.cardTitle}>Birthdays</Text>
            <Text style={styles.cardSubtitle}>Upcoming birthdays</Text>
          </TouchableOpacity>

          {/* Public Holidays Card */}
          <TouchableOpacity 
            style={[styles.gridCard, { borderLeftColor: '#9C27B0' }]}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('PublicHolidaysScreen');
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#9C27B020' }]}>
                <Icon name="calendar-star" size={24} color="#9C27B0" />
              </View>
            </View>
            <Text style={styles.cardTitle}>Public Holidays</Text>
            <Text style={styles.cardSubtitle}>List of public holidays</Text>
          </TouchableOpacity>

          {/* Attendance Regularization Card */}
          <TouchableOpacity 
            style={[styles.gridCard, { borderLeftColor: '#00BCD4' }]}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('RegularisationScreen');
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#00BCD420' }]}>
                <Icon name="clock-check-outline" size={24} color="#00BCD4" />
              </View>
            </View>
            <Text style={styles.cardTitle}>Regularization</Text>
            <Text style={styles.cardSubtitle}>Regularize attendance</Text>
          </TouchableOpacity>

        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    width: '47%',
    borderRadius: 16,
    padding: 16,
    paddingTop: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderLeftWidth: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

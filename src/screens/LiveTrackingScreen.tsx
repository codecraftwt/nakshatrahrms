import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { MetricTile } from '../components/MetricTile';
import { PrimaryButton } from '../components/PrimaryButton';

export const LiveTrackingScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live tracking</Text>
        <View style={styles.recordingBadge}>
          <Text style={styles.recordingText}>● Recording</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.mapBox}>
          <Icon name="map" size={28} color={colors.textSecondary} />
          <Text style={styles.mapText}>Live map · route drawing</Text>
          <View style={styles.gpsActive}>
            <View style={styles.greenDot} />
            <Text style={styles.gpsText}>GPS active</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <MetricTile label="Distance today" value="3.4" unit="km" />
          <MetricTile label="Time elapsed" value="2h 14m" subtext="since punch in" />
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.blueDot]} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeTitle}>HQ Office</Text>
              <Text style={styles.routeSub}>Punch in · 9:03 AM</Text>
            </View>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.routeRow}>
            <View style={styles.hollowCircle} />
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeTitle}>Current location</Text>
            </View>
          </View>
        </View>

        <PrimaryButton 
          label="⏹ Punch out"
          onPress={() => navigation.navigate('MainTabs')} // Go back to tabs after punch out
          color={colors.danger}
          style={styles.punchOutBtn}
        />
      </View>
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
  recordingBadge: {
    backgroundColor: colors.dangerBg,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  recordingText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '500',
  },
  body: {
    padding: 16,
    flex: 1,
  },
  mapBox: {
    height: 180,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 8,
  },
  gpsActive: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  gpsText: {
    color: colors.success,
    fontSize: 11,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    padding: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  blueDot: {
    backgroundColor: colors.primary,
  },
  hollowCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: 4,
  },
  verticalLine: {
    width: 2,
    height: 28,
    backgroundColor: colors.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  routeTextContainer: {
    marginLeft: 12,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  routeSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  punchOutBtn: {
    marginTop: 'auto',
  },
});

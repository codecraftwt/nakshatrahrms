import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { MetricTile } from '../components/MetricTile';

export const RouteDetailScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route · 2 Jun</Text>
        <Text style={styles.headerDistance}>12.4 km</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.mapBox}>
          <Icon name="map-marker-path" size={28} color={colors.textSecondary} />
          <Text style={styles.mapText}>Travel route polyline</Text>
          <Text style={styles.mapSubtext}>Google Maps SDK here</Text>
        </View>

        <View style={styles.metricRow}>
          <MetricTile label="Total distance" value="12.4" unit="km" />
          <MetricTile label="Duration" value="9h 9m" subtext="on field" />
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Punch in</Text>
            <Text style={styles.detailValue}>9:02 AM</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Punch out</Text>
            <Text style={styles.detailValue}>6:11 PM</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Selfie</Text>
            <View style={styles.selfiePlaceholder} />
          </View>
        </View>
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
  headerDistance: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  body: {
    padding: 16,
    flex: 1,
  },
  mapBox: {
    height: 220,
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
  },
  mapSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.border,
  },
  selfiePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
});

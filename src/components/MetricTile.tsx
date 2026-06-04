import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface MetricTileProps {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({ label, value, unit, subtext }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}> {unit}</Text>}
      </View>
      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    flex: 1,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.05)', // Keeping alpha for subtle border
  },
  label: {
    ...Typography.tiny,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  unit: {
    ...Typography.tiny,
    color: colors.textPrimary,
  },
  subtext: {
    ...Typography.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

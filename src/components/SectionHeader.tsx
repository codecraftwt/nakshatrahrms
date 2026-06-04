import React from 'react';
import { StyleSheet } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface SectionHeaderProps {
  title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <Text style={styles.title}>{title}</Text>;
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
});

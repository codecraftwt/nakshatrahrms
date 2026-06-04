import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { useTheme } from '../theme/ThemeContext';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
}

export const OutlineButton: React.FC<OutlineButtonProps> = ({ label, onPress, color, style }) => {
  const { colors } = useTheme();
  const outlineColor = color || colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { borderColor: outlineColor },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: outlineColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: 8,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});

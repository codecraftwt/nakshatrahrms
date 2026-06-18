import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { useTheme } from '../theme/ThemeContext';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  style?: any;
  disabled?: boolean;
}

export const OutlineButton: React.FC<OutlineButtonProps> = ({ label, onPress, color, style, disabled }) => {
  const { colors } = useTheme();
  const outlineColor = color || colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { borderColor: disabled ? colors.border : outlineColor },
        disabled && { opacity: 0.5 },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={[styles.label, { color: disabled ? colors.textSecondary : outlineColor }]}>{label}</Text>
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

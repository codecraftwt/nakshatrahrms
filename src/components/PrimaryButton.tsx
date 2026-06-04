import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  leftIcon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
  textColor?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  label, onPress, disabled, leftIcon, style, textStyle, color, textColor 
}) => {
  const { colors } = useTheme();
  const bgColor = color || colors.primary;
  // PrimaryButton always uses a solid colored background (e.g. primary or danger),
  // so the text color should default to white for contrast in both themes.
  const txtColor = textColor || '#FFFFFF';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor },
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {leftIcon && <Icon name={leftIcon} size={18} color={txtColor} style={styles.icon} />}
      <Text style={[styles.label, { color: txtColor }, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  icon: {
    marginRight: 8,
  },
});

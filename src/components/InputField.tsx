import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../theme/typography';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeColors } from '../theme/colors';

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  multiline?: boolean;
  height?: number;
  onPress?: () => void;
}

export const InputField: React.FC<InputFieldProps> = ({
  label, placeholder, value, onChangeText, secureTextEntry, leftIcon, rightIcon, multiline, height, onPress
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const inputRef = React.useRef<TextInput>(null);

  const togglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleContainerPress = () => {
    if (onPress) {
      onPress();
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable 
        onPress={handleContainerPress}
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          height ? { height } : {},
          multiline ? { alignItems: 'flex-start', paddingTop: 12 } : {}
        ]}
      >
        {leftIcon && <Icon name={leftIcon} size={20} color={colors.textSecondary} style={styles.leftIcon} />}
        
        <View style={{ flex: 1 }} pointerEvents={onPress ? 'none' : 'auto'}>
          <TextInput
            ref={inputRef}
            style={[styles.input, multiline ? { textAlignVertical: 'top' } : {}]}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline={multiline}
            editable={!onPress}
          />
        </View>

        {secureTextEntry ? (
          <TouchableOpacity onPress={togglePassword} style={styles.rightIcon}>
            <Icon 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        ) : (
          rightIcon && <Icon name={rightIcon} size={20} color={colors.textSecondary} style={styles.rightIcon} />
        )}
      </Pressable>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    ...Typography.tiny,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: 'rgba(21, 88, 176, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.1)',
    paddingHorizontal: 16,
  },
  inputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontFamily: 'Poppins-Regular',
    color: colors.textPrimary,
    paddingVertical: 0, 
  },
});

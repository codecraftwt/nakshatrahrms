import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { useTheme } from '../theme/ThemeContext';
import { Typography } from '../theme/typography';

type StatusType = 'present' | 'absent' | 'pending' | 'approved' | 'rejected' | 'active' | 'half_day' | 'leave';

interface StatusBadgeProps {
  status: StatusType;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { colors } = useTheme();
  
  let bgColor = colors.bgSurface;
  let textColor = colors.textPrimary;
  let label = status.charAt(0).toUpperCase() + status.slice(1);

  switch (status) {
    case 'present':
    case 'approved':
      bgColor = colors.successBg;
      textColor = colors.successText;
      break;
    case 'absent':
    case 'rejected':
      bgColor = colors.dangerBg;
      textColor = colors.dangerText;
      break;
    case 'pending':
      bgColor = colors.warningBg;
      textColor = colors.warningText;
      break;
    case 'active':
      bgColor = colors.successBg;
      textColor = colors.successText;
      break;
    case 'half_day':
      bgColor = '#EBE5FC';
      textColor = '#653BB5';
      label = 'Half Day';
      break;
    case 'leave':
      bgColor = colors.warningBg;
      textColor = colors.warningText;
      label = 'Leave';
      break;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[Typography.tiny, { color: textColor, fontWeight: '500' }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
});

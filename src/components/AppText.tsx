import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

export const AppText: React.FC<TextProps> = (props) => {
  const { style, ...rest } = props;
  
  const flattenedStyle = StyleSheet.flatten(style) || {};
  let fontFamily = 'Poppins-Regular'; // Default fallback

  const size = flattenedStyle.fontSize || 14;
  const weight = flattenedStyle.fontWeight || '400';

  // Headings (16px and above) -> Montserrat
  if (size >= 16) {
    if (weight === 'bold' || weight >= '700') {
      fontFamily = 'Montserrat-Bold';
    } else if (weight >= '500' || weight === 'bold') {
      fontFamily = 'Montserrat-SemiBold';
    } else {
      fontFamily = 'Montserrat-Regular';
    }
  } 
  // Body text (12px to 15px) -> Poppins
  else if (size >= 12 && size < 16) {
    if (weight === 'bold' || weight >= '700') {
      fontFamily = 'Poppins-Bold';
    } else if (weight >= '500' || weight === 'bold') {
      fontFamily = 'Poppins-SemiBold';
    } else {
      fontFamily = 'Poppins-Regular';
    }
  } 
  // Small text (below 12px) -> Rubik
  else {
    if (weight === 'bold' || weight >= '700') {
      fontFamily = 'Rubik-Bold';
    } else if (weight >= '500' || weight === 'bold') {
      fontFamily = 'Rubik-SemiBold';
    } else {
      fontFamily = 'Rubik-Regular';
    }
  }

  // Remove fontWeight to prevent Android from falling back to default system fonts
  const { fontWeight, ...cleanStyle } = flattenedStyle as any;

  return <RNText style={[cleanStyle, { fontFamily }]} {...rest} />;
};

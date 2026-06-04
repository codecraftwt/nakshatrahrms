import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

export const SplashScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('LoginScreen');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Geometric Background Elements */}
      <View style={styles.shape1} />
      <View style={styles.shape2} />
      <View style={styles.shape3} />

      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <View style={{ transform: [{ rotate: '-45deg' }] }}>
            <Icon name="map-marker-radius" size={48} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.brandName}>Nakshatra</Text>
        <Text style={styles.brandSub}>Solutions HRMS</Text>
        
        <View style={styles.loaderContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.statusText}>Initializing...</Text>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
    position: 'relative',
  },
  shape1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  shape2: {
    position: 'absolute',
    top: 150,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    opacity: 0.05,
  },
  shape3: {
    position: 'absolute',
    bottom: -50,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    transform: [{ rotate: '45deg' }],
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  loaderContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 12,
  },
});

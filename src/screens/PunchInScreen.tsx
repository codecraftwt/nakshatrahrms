import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { PrimaryButton } from '../components/PrimaryButton';

export const PunchInScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Punch in</Text>
        <View style={styles.inRangeBadge}>
          <Text style={styles.inRangeText}>In range</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.cameraContainer}>
          <View style={styles.cameraBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            <View style={styles.iconCircleLarge}>
              <Icon name="face-recognition" size={40} color={colors.primary} />
            </View>
            <Text style={styles.cameraInstruction}>Position face in frame</Text>
            <Text style={styles.cameraPreviewText}>Camera preview will appear here</Text>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={styles.iconCircle}>
              <Icon name="map-marker-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>HQ Office</Text>
              <Text style={styles.locationSub}>19.0760° N, 72.8777° E</Text>
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>Within 200m</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.locationRow}>
            <View style={styles.iconCircle}>
              <Icon name="clock-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Current Time</Text>
              <Text style={styles.locationSub}>09:03 AM</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <PrimaryButton 
            label="✓ Confirm punch in"
            onPress={() => navigation.replace('LiveTrackingScreen')}
            style={styles.confirmBtn}
          />
          <Text style={styles.helperText}>GPS + selfie will be captured</Text>
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
    paddingVertical: 16,
    backgroundColor: colors.bgPage,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    ...Typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  inRangeBadge: {
    backgroundColor: colors.successBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  inRangeText: {
    color: colors.successText,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cameraContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  cameraBox: {
    width: '100%',
    aspectRatio: 1.1,
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  iconCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(21, 88, 176, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraInstruction: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  cameraPreviewText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  locationCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    padding: 16,
    marginTop: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.04)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(21, 88, 176, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: 'rgba(21, 88, 176, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.3,
    marginVertical: 12,
    marginLeft: 52,
  },
  bottomSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  confirmBtn: {
    height: 54,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
  },
});

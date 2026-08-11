import React from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { AppText as Text } from './AppText';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PrimaryButton } from './PrimaryButton';
import { ThemeColors } from '../theme/colors';

interface DeviceSettingsModalProps {
  visible: boolean;
  brand: 'vivo' | 'oppo' | 'oneplus' | string;
  onClose: () => void;
}

export const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({ visible, brand, onClose }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const getTitle = () => {
    switch (brand.toLowerCase()) {
      case 'vivo':
        return 'Vivo Settings';
      case 'oneplus':
        return 'OnePlus Settings';
      case 'oppo':
        return 'Oppo Settings';
      default:
        return 'Device Settings';
    }
  };

  const renderContent = () => {
    const b = brand.toLowerCase();
    if (b === 'vivo') {
      return (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Allow Background Activity</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Battery</Text>
            <Text style={styles.bullet}>• Tap Background power consumption management / High background power consumption</Text>
            <Text style={styles.bullet}>• Find Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Select "Don't restrict background power usage"</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Enable Auto-Start</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Apps / Applications and Permissions</Text>
            <Text style={styles.bullet}>• Select Permission Management</Text>
            <Text style={styles.bullet}>• Find Auto-start</Text>
            <Text style={styles.bullet}>• Enable Nakshatra HRMS</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Lock the App in Recent Apps</Text>
            <Text style={styles.bullet}>• Open Recent Apps</Text>
            <Text style={styles.bullet}>• Find Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Tap the Lock 🔒 icon or use the available Lock option</Text>
            <Text style={styles.bullet}>• Keep the app locked</Text>
            <Text style={styles.note}>This helps prevent Vivo's system from removing the app when background apps are cleared.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Allow Background Location</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Location</Text>
            <Text style={styles.bullet}>• Select App permissions</Text>
            <Text style={styles.bullet}>• Choose Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Select "Allow all the time"</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Allow Notifications</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Notifications</Text>
            <Text style={styles.bullet}>• Select Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Enable Allow notifications</Text>
          </View>
        </>
      );
    } else if (b === 'oneplus') {
      return (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Disable Battery Optimization</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Battery</Text>
            <Text style={styles.bullet}>• Tap More settings / Additional settings</Text>
            <Text style={styles.bullet}>• Select Optimize battery use / App battery management</Text>
            <Text style={styles.bullet}>• Find Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Select "Don't optimize" or "Unrestricted"</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Allow Auto-Launch</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Apps</Text>
            <Text style={styles.bullet}>• Select Auto-launch / App startup management</Text>
            <Text style={styles.bullet}>• Find Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Enable Allow auto-launch</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Allow Background Activity</Text>
            <Text style={styles.bullet}>• Go to Settings → Apps → Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Tap Battery usage</Text>
            <Text style={styles.bullet}>• Enable Allow background activity</Text>
            <Text style={styles.bullet}>• If available, select "Unrestricted"</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Lock the App</Text>
            <Text style={styles.bullet}>• Open Recent Apps</Text>
            <Text style={styles.bullet}>• Find Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Tap the three dots on the app card</Text>
            <Text style={styles.bullet}>• Select Lock</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Allow Background Location & Notifications</Text>
            <Text style={styles.bullet}>• Go to Settings → Location → App permissions → Select "Allow all the time"</Text>
            <Text style={styles.bullet}>• Go to Settings → Apps → Nakshatra HRMS → Notifications → Enable</Text>
          </View>
        </>
      );
    } else if (b === 'oppo') {
      return (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Allow Background Activity</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Battery</Text>
            <Text style={styles.bullet}>• Tap More settings / Additional settings</Text>
            <Text style={styles.bullet}>• Select App battery management</Text>
            <Text style={styles.bullet}>• Find Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Enable Allow background activity or select "Unrestricted"</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Enable Auto-Start</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Apps (or Settings → Apps → App management → Nakshatra HRMS)</Text>
            <Text style={styles.bullet}>• Select Auto-launch</Text>
            <Text style={styles.bullet}>• Turn Auto-launch ON for Nakshatra HRMS</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Prevent the App From Being Cleared</Text>
            <Text style={styles.bullet}>• Open Recent Apps</Text>
            <Text style={styles.bullet}>• Find Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Tap the three-dot menu</Text>
            <Text style={styles.bullet}>• Select Lock</Text>
            <Text style={styles.note}>This prevents the system from easily clearing the application from memory.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Allow Background Location</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Location</Text>
            <Text style={styles.bullet}>• Select App permissions</Text>
            <Text style={styles.bullet}>• Find Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Select "Allow all the time"</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Enable Notifications</Text>
            <Text style={styles.bullet}>• Open Settings</Text>
            <Text style={styles.bullet}>• Go to Notifications & Status Bar</Text>
            <Text style={styles.bullet}>• Select Nakshatra HRMS</Text>
            <Text style={styles.bullet}>• Enable Allow notifications</Text>
          </View>
        </>
      );
    }
    return null;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Icon name="cellphone-cog" size={24} color={colors.primary} />
              </View>
              <Text style={styles.title}>{getTitle()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>
            To ensure live tracking works correctly without interruptions, please configure these settings.
          </Text>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {renderContent()}
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton 
              label="I have configured these settings" 
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.bgPage,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(21, 88, 176, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  scrollArea: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  section: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
    paddingLeft: 4,
    lineHeight: 20,
  },
  note: {
    fontSize: 13,
    color: colors.warning,
    marginTop: 8,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

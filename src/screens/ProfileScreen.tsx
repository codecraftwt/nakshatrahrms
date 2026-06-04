import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Alert, Modal, Pressable } from 'react-native';
import { launchCamera, launchImageLibrary, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';
import { AppText as Text } from '../components/AppText';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { mockUser } from '../data/mockData';

export const ProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, theme, toggleTheme } = useTheme();
  const styles = createStyles(colors);

  const isDarkMode = theme === 'dark';
  
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [isImagePickerVisible, setIsImagePickerVisible] = React.useState(false);

  const handleCamera = async () => {
    setIsImagePickerVisible(false);
    const options: CameraOptions = {
      mediaType: 'photo',
      saveToPhotos: true,
      cameraType: 'front',
      quality: 0.8,
    };
    
    try {
      const result = await launchCamera(options);
      if (result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri || null);
      }
    } catch (error) {
      console.log('Error launching camera:', error);
    }
  };

  const handleGallery = async () => {
    setIsImagePickerVisible(false);
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
    };
    
    try {
      const result = await launchImageLibrary(options);
      if (result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri || null);
      }
    } catch (error) {
      console.log('Error launching gallery:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.headerBackground, { height: 160 + insets.top }]} />
      <View style={[styles.shape1, { top: -50 + insets.top }]} />
      <View style={[styles.shape2, { top: 50 + insets.top }]} />
      <View style={[styles.shape3, { top: 120 + insets.top }]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerTop, { paddingTop: 16, paddingBottom: 24 }]}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('SettingsScreen')}>
            <Icon name="cog-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Info Card overlapping header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{mockUser.initials}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => setIsImagePickerVisible(true)}>
              <Icon name="camera-outline" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>{mockUser.name}</Text>
          <Text style={styles.designation}>{mockUser.designation}</Text>
          
          <View style={styles.idBadge}>
            <Icon name="identifier" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.empId}>{mockUser.employeeId}</Text>
          </View>
        </View>

        {/* Current Shift Card */}
        <Text style={styles.sectionTitle}>Work Details</Text>
        <View style={styles.settingsCard}>
          <View style={styles.shiftCardInner}>
            <View style={styles.shiftIconBox}>
              <Icon name="briefcase-clock-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftLabel}>Current Shift</Text>
              <Text style={styles.shiftValue}>
                {mockUser.shift.name.split(' ')[0]} · {mockUser.shift.time}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingsRow}>
            <View style={styles.rowIconBox}>
              <Icon name="domain" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.rowLabel}>Department</Text>
            <Text style={styles.rowValue}>{mockUser.department}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingsRow}>
            <View style={styles.rowIconBox}>
              <Icon name="map-marker-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.rowLabel}>Base Office</Text>
            <Text style={styles.rowValue}>{mockUser.baseOffice}</Text>
          </View>
        </View>



        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={() => navigation.replace('LoginScreen')}
        >
          <Icon name="logout" size={20} color={colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutLabel}>Sign Out</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={isImagePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImagePickerVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsImagePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Profile Picture</Text>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.modalOptionBtn} onPress={handleCamera}>
                <View style={[styles.modalIconBox, { backgroundColor: colors.primaryBg }]}>
                  <Icon name="camera" size={28} color={colors.primary} />
                </View>
                <Text style={styles.modalOptionText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalOptionBtn} onPress={handleGallery}>
                <View style={[styles.modalIconBox, { backgroundColor: colors.successBg }]}>
                  <Icon name="image-multiple" size={28} color={colors.success} />
                </View>
                <Text style={styles.modalOptionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.modalCancelBtn} 
              onPress={() => setIsImagePickerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  headerBackground: {
    backgroundColor: colors.primary,
    height: 160,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  shape1: {
    position: 'absolute',
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    opacity: 0.1,
  },
  shape2: {
    position: 'absolute',
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    opacity: 0.05,
  },
  shape3: {
    position: 'absolute',
    right: 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.bgPage,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '600',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bgSurface,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  designation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPage,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  empId: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  settingsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 32,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.04)',
  },
  shiftCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  shiftIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  shiftValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.bgPage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.3,
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgPage,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  modalOptionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  modalCancelBtn: {
    backgroundColor: colors.bgSurface,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

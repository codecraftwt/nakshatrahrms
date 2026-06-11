import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useDispatch, useSelector } from 'react-redux';
import { loginCandidate } from '../redux/slice/authSlice';
import { RootState, AppDispatch } from '../redux/store';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('mobile_api');
  const [password, setPassword] = useState('123');
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async () => {
    if (!email || !password) return;
    const resultAction = await dispatch(loginCandidate({ email, password }));
    if (loginCandidate.fulfilled.match(resultAction)) {
      navigation.replace('MainTabs');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Modern Geometric Background Elements */}
      <View style={styles.shape1} />
      <View style={styles.shape2} />
      <View style={styles.shape3} />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.headerArea}>
            <View style={styles.logoCircle}>
              <View style={{ transform: [{ rotate: '-45deg' }] }}>
                <Icon name="map-marker-radius" size={40} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.brandName}>Nakshatra</Text>
            <Text style={styles.brandSub}>Solutions HRMS</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Sign in to continue</Text>

            <InputField
              label="Employee ID / Email"
              placeholder="emp@company.com"
              value={email}
              onChangeText={setEmail}
              leftIcon="email-outline"
            />

            <InputField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-outline"
            />

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <Text style={{ color: colors.error || 'red', marginBottom: 16, textAlign: 'center', fontSize: 14 }}>
                {error}
              </Text>
            ) : null}

            <PrimaryButton 
              label={loading ? "Signing in..." : "Sign in"} 
              onPress={handleLogin}
              disabled={loading || !email || !password}
              style={styles.signInButton}
            />

            <View style={[styles.registerContainer, { marginTop: 32 }]}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
                <Text style={styles.registerLink}>Register now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 120, // Increased to allow scrolling above keyboard
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    transform: [{ rotate: '45deg' }],
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 32,
    padding: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(21, 88, 176, 0.05)',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  signInButton: {
    height: 54,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 32,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.bgPage,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
});

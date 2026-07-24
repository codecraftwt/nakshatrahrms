import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { setBaseUrl } from '../api/axiosInstance';
import axios from 'axios';

export const ServerUrlScreen = ({ navigation }: any) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handleSubmit = async () => {
    if (!url) {
      setError('Please enter a server URL');
      return;
    }

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    // Ensure URL ends with a slash for consistent appending later, or doesn't depending on how backend handles it
    // Usually it's better to remove trailing slash if we append like `/web/database/list`
    if (finalUrl.endsWith('/')) {
      finalUrl = finalUrl.slice(0, -1);
    }

    setLoading(true);
    setError('');

    try {
      // Format the POST body exactly as requested
      const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: 1
      };

      const testEndpoint = `${finalUrl}/web/database/list`;
      
      const response = await axios.post(testEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10s timeout
      });

      if (response.data && response.data.result && Array.isArray(response.data.result)) {
        // We received a valid response with database list
        // Even if we don't need the DB for this frontend, it confirms the Odoo server is valid
        // We append trailing slash as axiosInstance base URL usually needs one or works fine with it
        await setBaseUrl(finalUrl + '/');
        
        // Go to login screen
        navigation.replace('LoginScreen');
      } else {
        setError('Invalid response from server. Please check the URL.');
      }
    } catch (err: any) {
      console.log('Server validation error:', err.message);
      setError('Could not connect to the server. Please verify the URL is correct and the server is reachable.');
    } finally {
      setLoading(false);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                <Icon name="server-network" size={40} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.brandName}>Workspace</Text>
            <Text style={styles.brandSub}>Connect to your server</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Server URL</Text>
            <Text style={styles.subheading}>Enter your organization's server URL to connect</Text>

            <InputField
              label="URL"
              placeholder="e.g. https://laxmidatta.nakshatrainfo.co.in"
              value={url}
              onChangeText={setUrl}
              leftIcon="link-variant"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {error ? (
              <Text style={{ color: colors.error || 'red', marginBottom: 16, textAlign: 'center', fontSize: 14 }}>
                {error}
              </Text>
            ) : null}

            <PrimaryButton
              label={loading ? "Connecting..." : "Connect"}
              onPress={handleSubmit}
              disabled={loading || !url}
              style={styles.signInButton}
            />
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
    paddingBottom: 120,
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
  signInButton: {
    height: 54,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 16,
  },
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, PermissionsAndroid, Dimensions, Modal } from 'react-native';
import { AppText as Text } from '../components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchPayslipDetails } from '../redux/slice/payrollSlice';
import RNFS from 'react-native-fs';
import Pdf from 'react-native-pdf';

export const PayslipDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();

  const { payslipDetailsData, payslipDetailsLoading } = useSelector((state: RootState) => state.payroll);
  const [isDownloading, setIsDownloading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'error' }>({
    visible: false,
    title: '',
    message: '',
    type: 'success'
  });

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    dispatch(fetchPayslipDetails(id));
  }, [dispatch, id]);

  const payslip = payslipDetailsData?.data?.payslip || payslipDetailsData?.payslip || payslipDetailsData?.data || payslipDetailsData;

  const handleDownloadPdf = async () => {
    if (!payslip?.attachment) {
      showCustomAlert('Error', 'No PDF attachment found.', 'error');
      return;
    }

    try {
      setIsDownloading(true);

      if (Platform.OS === 'android' && Platform.Version < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showCustomAlert('Permission Denied', 'Storage permission is required to download the payslip.', 'error');
          setIsDownloading(false);
          return;
        }
      }

      const filename = `Payslip_${payslip.name ? payslip.name.replace(/[^a-z0-9]/gi, '_') : id}_${Date.now()}.pdf`;
      const dirPath = Platform.OS === 'android' ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath;
      const path = `${dirPath}/${filename}`;

      await RNFS.writeFile(path, payslip.attachment, 'base64');
      
      if (Platform.OS === 'android') {
        try {
          await RNFS.scanFile(path);
        } catch (scanError) {
          console.log('Error scanning file:', scanError);
        }
      }

      showCustomAlert('Downloaded', `Payslip saved to your Downloads folder successfully!`, 'success');
      
    } catch (error) {
      console.log('Error downloading PDF:', error);
      showCustomAlert('Error', 'Could not save the PDF. Please try again.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{payslip?.name || 'Payslip PDF'}</Text>
        
        {payslip?.attachment && (
          <TouchableOpacity onPress={handleDownloadPdf} disabled={isDownloading} style={styles.downloadIconBtn}>
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Icon name="download" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {payslipDetailsLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !payslip ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Payslip details not found.</Text>
        </View>
      ) : payslip.attachment ? (
        <View style={styles.pdfContainer}>
          <Pdf
            source={{ uri: `data:application/pdf;base64,${payslip.attachment}` }}
            onLoadComplete={(numberOfPages) => {
              console.log(`PDF Loaded: ${numberOfPages} pages`);
            }}
            onError={(error) => {
              console.log('PDF Render Error:', error);
              showCustomAlert('Error', 'Failed to render the PDF.', 'error');
            }}
            style={styles.pdfViewer}
            trustAllCerts={false}
          />
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No PDF data available.</Text>
        </View>
      )}

      <Modal
        visible={alertConfig.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={[styles.alertIconWrapper, { backgroundColor: alertConfig.type === 'success' ? '#E8F5E9' : '#FFEBEE' }]}>
              <Icon 
                name={alertConfig.type === 'success' ? 'check-circle' : 'alert-circle'} 
                size={40} 
                color={alertConfig.type === 'success' ? '#4CAF50' : '#F44336'} 
              />
            </View>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity 
              style={[styles.alertButton, { backgroundColor: colors.primary }]}
              onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            >
              <Text style={styles.alertButtonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  downloadIconBtn: {
    padding: 8,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  pdfViewer: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#F5F5F5',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  alertIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

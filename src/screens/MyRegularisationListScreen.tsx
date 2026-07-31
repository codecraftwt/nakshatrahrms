import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchMyRegularisations } from '../redux/slice/regularisationSlice';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const MyRegularisationListScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  
  const { myData, myLoading } = useSelector((state: RootState) => state.regularisation);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMyRegularisations({ limit: 50 }));
    }, [dispatch])
  );

  const getStatusLabel = (state: string) => {
    if (!state) return 'Pending';
    if (state === 'to_approve' || state === 'pending') return 'Pending';
    if (state === 'approved') return 'Approved';
    if (state === 'refused' || state === 'rejected') return 'Rejected';
    return state.charAt(0).toUpperCase() + state.slice(1);
  };

  const renderRegularisationItem = (item: any) => {
    const typeName = item.permission_type ? (item.permission_type.charAt(0).toUpperCase() + item.permission_type.slice(1)) : 'Regularization';
    const date = item.start_date || item.create_date?.split(' ')[0] || '';
    const statusLabel = getStatusLabel(item.state);
    
    // Determine badge color based on state
    let badgeBg = colors.warningBg;
    let badgeText = colors.warningText;
    
    if (item.state === 'approved') {
      badgeBg = 'rgba(76, 175, 80, 0.1)';
      badgeText = '#4CAF50';
    } else if (item.state === 'refused' || item.state === 'rejected') {
      badgeBg = 'rgba(244, 67, 54, 0.1)';
      badgeText = '#F44336';
    }

    return (
      <View 
        key={item.id} 
        style={styles.listCard}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 188, 212, 0.1)' }]}>
            <Icon name="clock-check-outline" size={24} color="#00BCD4" />
          </View>
          <View style={styles.listTextContainer}>
            <Text style={styles.itemTitle} numberOfLines={1}>{typeName}</Text>
            <Text style={styles.itemSub}>{date}</Text>
            {item.note ? (
              <Text style={styles.itemNote} numberOfLines={1}>{item.note}</Text>
            ) : null}
          </View>
          <View style={styles.rightContent}>
            <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.statusBadgeText, { color: badgeText }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Regularizations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          {myLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : myData?.records?.length > 0 ? (
            myData.records.map(renderRegularisationItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="clock-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
              <Text style={styles.emptyTitle}>No regularizations</Text>
              <Text style={styles.emptySub}>You haven't requested any regularizations yet.</Text>
            </View>
          )}
        </View>
        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={() => navigation.navigate('RegularisationScreen')}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={28} color="#FFF" />
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.bgPage,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingTop: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

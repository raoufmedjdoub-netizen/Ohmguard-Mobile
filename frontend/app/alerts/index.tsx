import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore } from '../../src/store/alertStore';
import { useAuthStore } from '../../src/store/authStore';
import { AlertCard } from '../../src/components/AlertCard';
import { Alert, EventStatus } from '../../src/types';

const STATUS_FILTERS: Array<{ value: EventStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'NEW', label: 'Nouvelles' },
  { value: 'ACK', label: 'Acquittées' },
];

export default function AlertsScreen() {
  const router = useRouter();
  const {
    alerts,
    isLoading,
    isRefreshing,
    error,
    statusFilter,
    fetchAlerts,
    refreshAlerts,
    setStatusFilter,
  } = useAlertStore();
  const { logout, user } = useAuthStore();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAlertPress = useCallback((alert: Alert) => {
    router.push(`/alerts/${alert.id}`);
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const newAlertsCount = alerts.filter((a) => a.status === 'NEW').length;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.welcomeText}>Bonjour,</Text>
          <Text style={styles.userName}>{user?.full_name || 'Utilisateur'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {newAlertsCount > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={24} color="#FFFFFF" />
          <Text style={styles.alertBannerText}>
            {newAlertsCount} alerte{newAlertsCount > 1 ? 's' : ''} en attente
          </Text>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterTab,
              statusFilter === filter.value && styles.filterTabActive,
            ]}
            onPress={() => setStatusFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === filter.value && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle" size={64} color="#10B981" />
      <Text style={styles.emptyTitle}>Aucune alerte</Text>
      <Text style={styles.emptySubtitle}>
        {statusFilter === 'NEW'
          ? 'Aucune nouvelle alerte en attente'
          : 'Aucune alerte à afficher'}
      </Text>
    </View>
  );

  if (isLoading && alerts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Chargement des alertes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertCard alert={item} onPress={() => handleAlertPress(item)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={alerts.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAlerts}
            colors={['#DC2626']}
            tintColor="#DC2626"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alertBannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#DC2626',
  },
  filterTabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingBottom: 24,
  },
  emptyList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

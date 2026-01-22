import React, { useEffect } from 'react';
import { Slot, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useAlertStore } from '../src/store/alertStore';
import socketService from '../src/services/socket';

function AuthGuard() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { addNewAlert, updateAlertInList } = useAlertStore();
  const segments = useSegments();

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (isAuthenticated) {
      socketService.setOnNewAlert((alert) => {
        addNewAlert(alert);
      });
      socketService.setOnEventUpdated((data) => {
        updateAlertInList(data.event_id, data.update);
      });
    }
    return () => {
      socketService.setOnNewAlert(null);
      socketService.setOnEventUpdated(null);
    };
  }, [isAuthenticated]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Check current route
  const inAuthGroup = segments[0] === 'login';
  const inAlertsGroup = segments[0] === 'alerts';

  // Redirect based on auth state using Redirect component (not router.replace)
  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/alerts" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthGuard />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
});

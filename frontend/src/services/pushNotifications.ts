/**
 * Push Notifications Service
 * Handles Expo Push Notifications registration and handling
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export interface PushNotificationData {
  type: 'new_event' | 'event_updated' | 'test';
  eventId?: string;
  eventType?: string;
  location?: string;
  severity?: string;
}

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;
  private isInitialized = false;

  /**
   * Initialize push notifications
   * Returns the Expo Push Token if successful
   */
  async initialize(): Promise<string | null> {
    if (this.isInitialized && this.expoPushToken) {
      return this.expoPushToken;
    }

    // Skip on web
    if (Platform.OS === 'web') {
      console.log('[Push] Not supported on web');
      return null;
    }

    try {
      // Check if physical device
      if (!Device.isDevice) {
        console.log('[Push] Must use physical device for Push Notifications');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Permission not granted');
        return null;
      }

      // Get Expo Push Token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? 
                        (Constants as any).easConfig?.projectId;

      let tokenData;
      if (projectId) {
        tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      } else {
        // Try without projectId for development builds
        tokenData = await Notifications.getExpoPushTokenAsync();
      }

      this.expoPushToken = tokenData.data;
      console.log('[Push] Token:', this.expoPushToken);

      // Setup Android notification channel with custom sound
      if (Platform.OS === 'android') {
        // Channel pour les alertes de chute avec son personnalisé
        await Notifications.setNotificationChannelAsync('fall-alerts', {
          name: 'Alertes de Chute',
          description: 'Notifications pour les alertes de chute détectées',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 200, 500, 200, 500],
          lightColor: '#FF0000',
          sound: 'notification_alert.wav',
          enableLights: true,
          enableVibrate: true,
          bypassDnd: true, // Bypass Do Not Disturb mode
        });
        
        // Canal par défaut
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }

      // Setup listeners
      this.setupListeners();
      this.isInitialized = true;

      return this.expoPushToken;
    } catch (error: any) {
      console.log('[Push] Error:', error.message);
      return null;
    }
  }

  /**
   * Setup notification event listeners
   */
  private setupListeners(): void {
    // Foreground notification listener
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Notification received:', notification.request.content.title);
    });

    // Notification tap listener
    this.responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('[Push] Notification tapped');
      const data = response.notification.request.content.data as PushNotificationData;

      // Navigate to alert detail if eventId exists
      setTimeout(async () => {
        try {
          const { router } = await import('expo-router');
          if (data?.eventId) {
            router.push(`/alerts/${data.eventId}`);
          } else {
            router.push('/alerts');
          }
        } catch (e) {
          console.log('[Push] Navigation error:', e);
        }
      }, 300);
    });
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
    this.isInitialized = false;
  }

  /**
   * Check if available
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.expoPushToken;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

/**
 * Push Notifications Service
 * Handles Expo Push Notifications registration and handling
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Configure how notifications should be displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export interface PushNotificationData {
  type: 'new_event' | 'event_updated';
  eventId?: string;
  eventType?: string;
  location?: string;
  severity?: string;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  /**
   * Initialize push notifications
   * Returns the Expo Push Token if successful
   */
  async initialize(): Promise<string | null> {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.log('[Push] Must use physical device for Push Notifications');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Failed to get push notification permissions');
        return null;
      }

      // Get the Expo Push Token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.log('[Push] Project ID not found. Make sure you have configured EAS.');
        // For development, try without project ID
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          this.expoPushToken = tokenData.data;
        } catch (e) {
          console.log('[Push] Could not get token without projectId:', e);
          return null;
        }
      } else {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        this.expoPushToken = tokenData.data;
      }

      console.log('[Push] Expo Push Token:', this.expoPushToken);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('alerts', {
          name: 'Alertes de Chute',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }

      // Set up notification listeners
      this.setupListeners();

      return this.expoPushToken;
    } catch (error) {
      console.error('[Push] Error initializing push notifications:', error);
      return null;
    }
  }

  /**
   * Set up notification event listeners
   */
  private setupListeners(): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Notification received in foreground:', notification);
      // The notification will be shown automatically due to setNotificationHandler
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Push] Notification tapped:', response);
      const data = response.notification.request.content.data as PushNotificationData;
      
      // Navigate to the alert detail if we have an eventId
      if (data?.eventId) {
        router.push(`/alerts/${data.eventId}`);
      } else {
        // Navigate to alerts list
        router.push('/alerts');
      }
    });
  }

  /**
   * Get the current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Clean up listeners
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
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: PushNotificationData
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    await this.setBadgeCount(0);
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

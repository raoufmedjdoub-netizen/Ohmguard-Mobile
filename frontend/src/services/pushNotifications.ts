/**
 * Push Notifications Service
 * Handles Expo Push Notifications registration and handling
 * Safe loading - handles cases where native modules are not available
 */
import { Platform } from 'react-native';

export interface PushNotificationData {
  type: 'new_event' | 'event_updated';
  eventId?: string;
  eventType?: string;
  location?: string;
  severity?: string;
}

// Check if notifications module is available
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
let Constants: typeof import('expo-constants').default | null = null;
let isNotificationsAvailable = false;

// Try to load notifications modules dynamically
const loadNotificationsModule = async () => {
  try {
    Notifications = await import('expo-notifications');
    Device = await import('expo-device');
    const ConstantsModule = await import('expo-constants');
    Constants = ConstantsModule.default;
    
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications!.AndroidNotificationPriority.MAX,
      }),
    });
    
    isNotificationsAvailable = true;
    console.log('[Push] Notifications module loaded successfully');
  } catch (error) {
    console.log('[Push] Notifications module not available:', error);
    isNotificationsAvailable = false;
  }
};

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private isInitialized = false;

  /**
   * Initialize push notifications
   * Returns the Expo Push Token if successful
   */
  async initialize(): Promise<string | null> {
    // Don't initialize twice
    if (this.isInitialized) {
      return this.expoPushToken;
    }

    try {
      // First, try to load the module
      if (!isNotificationsAvailable) {
        await loadNotificationsModule();
      }

      if (!isNotificationsAvailable || !Notifications || !Device) {
        console.log('[Push] Push notifications not available on this platform');
        return null;
      }

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
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                        (Constants as any)?.easConfig?.projectId;
      
      try {
        let tokenData;
        if (projectId) {
          tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        } else {
          console.log('[Push] No projectId found, trying without it...');
          tokenData = await Notifications.getExpoPushTokenAsync();
        }
        this.expoPushToken = tokenData.data;
        console.log('[Push] Expo Push Token:', this.expoPushToken);
      } catch (e: any) {
        console.log('[Push] Could not get token:', e.message);
        return null;
      }

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
      this.isInitialized = true;

      return this.expoPushToken;
    } catch (error: any) {
      console.log('[Push] Error initializing push notifications:', error.message);
      return null;
    }
  }

  /**
   * Set up notification event listeners
   */
  private setupListeners(): void {
    if (!Notifications) return;

    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Notification received in foreground:', notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('[Push] Notification tapped:', response);
      const data = response.notification.request.content.data as PushNotificationData;
      
      // Navigate after a short delay to ensure navigation is ready
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
      }, 500);
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
    if (Notifications) {
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
        this.notificationListener = null;
      }
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
        this.responseListener = null;
      }
    }
    this.isInitialized = false;
  }

  /**
   * Check if notifications are available
   */
  isAvailable(): boolean {
    return isNotificationsAvailable;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

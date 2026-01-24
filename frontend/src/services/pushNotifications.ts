/**
 * Push Notifications Service - Stub Version
 * This is a placeholder until a new Development Build is created
 * with expo-notifications native module included
 */

export interface PushNotificationData {
  type: 'new_event' | 'event_updated';
  eventId?: string;
  eventType?: string;
  location?: string;
  severity?: string;
}

class PushNotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize push notifications
   * Currently disabled - requires new Development Build
   */
  async initialize(): Promise<string | null> {
    console.log('[Push] Push notifications require a new Development Build');
    console.log('[Push] Run: eas build --profile development --platform android');
    return null;
  }

  getToken(): string | null {
    return this.expoPushToken;
  }

  cleanup(): void {
    this.expoPushToken = null;
  }

  isAvailable(): boolean {
    return false;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

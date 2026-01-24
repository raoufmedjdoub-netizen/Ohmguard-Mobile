import { create } from 'zustand';
import { User } from '../types';
import { authApi, tokenManager, pushApi } from '../services/api';
import socketService from '../services/socket';
import pushNotificationService from '../services/pushNotifications';
import { Platform } from 'react-native';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;  // For initial auth check
  isSubmitting: boolean;    // For login/logout actions
  error: string | null;
  pushToken: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  initializePushNotifications: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  isSubmitting: false,
  error: null,
  pushToken: null,

  initializePushNotifications: async () => {
    try {
      const token = await pushNotificationService.initialize();
      if (token) {
        set({ pushToken: token });
        // Register the token with the backend
        try {
          await pushApi.registerToken(token, Platform.OS);
          console.log('[Auth] Push token registered with backend');
        } catch (error) {
          console.error('[Auth] Failed to register push token:', error);
        }
      }
    } catch (error) {
      console.error('[Auth] Failed to initialize push notifications:', error);
    }
  },

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isSubmitting: true, error: null });
    try {
      await authApi.login({ email, password });
      const user = await authApi.getCurrentUser();
      
      // Connect to WebSocket
      const token = await tokenManager.getAccessToken();
      if (user.tenant_id && token) {
        socketService.connect(user.tenant_id, token);
      }
      
      set({ user, isAuthenticated: true, isSubmitting: false });
      
      // Initialize push notifications after successful login
      get().initializePushNotifications();
      
      return true;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erreur de connexion';
      set({ error: message, isSubmitting: false });
      return false;
    }
  },

  logout: async (): Promise<void> => {
    // Unregister push token before logout
    const { pushToken } = get();
    if (pushToken) {
      try {
        await pushApi.deleteToken(pushToken);
      } catch (error) {
        console.error('[Auth] Failed to delete push token:', error);
      }
    }
    
    socketService.disconnect();
    pushNotificationService.cleanup();
    await authApi.logout();
    set({ user: null, isAuthenticated: false, error: null, pushToken: null });
  },

  checkAuth: async (): Promise<boolean> => {
    set({ isInitializing: true });
    try {
      const token = await tokenManager.getAccessToken();
      if (!token) {
        set({ isInitializing: false, isAuthenticated: false });
        return false;
      }

      const user = await authApi.getCurrentUser();
      
      // Connect to WebSocket
      if (user.tenant_id) {
        socketService.connect(user.tenant_id, token);
      }
      
      set({ user, isAuthenticated: true, isInitializing: false });
      
      // Initialize push notifications
      get().initializePushNotifications();
      
      return true;
    } catch (error) {
      await tokenManager.clearTokens();
      set({ user: null, isAuthenticated: false, isInitializing: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

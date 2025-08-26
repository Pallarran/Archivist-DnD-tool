import type { StateCreator } from 'zustand';
import type { UIState } from '../types';

export interface UIStore {
  // State
  ui: UIState;
  
  // Navigation
  setCurrentModule: (module: UIState['currentModule']) => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Notifications
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // UI state helpers
  isLoading: () => boolean;
  hasError: () => boolean;
  getError: () => string | null;
  getNotifications: () => UIState['notifications'];
}

export const createUISlice: StateCreator<
  UIStore,
  [['zustand/immer', never], ['zustand/persist', unknown], ['zustand/subscribeWithSelector', never]],
  [],
  UIStore
> = (set, get) => ({
  // Initial state
  ui: {
    currentModule: 'dpr',
    loading: false,
    error: undefined,
    notifications: [],
  },
  
  // Navigation
  setCurrentModule: (module) => {
    set((state) => {
      state.ui.currentModule = module;
      state.ui.error = undefined; // Clear error when navigating
    });
  },
  
  // Loading states
  setLoading: (loading) => {
    set((state) => {
      state.ui.loading = loading;
    });
  },
  
  setError: (error) => {
    set((state) => {
      state.ui.error = error;
      state.ui.loading = false; // Stop loading when error occurs
    });
  },
  
  // Notifications
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    
    set((state) => {
      state.ui.notifications.push({
        ...notification,
        id,
        timestamp,
      });
    });
    
    // Auto-remove notifications after 5 seconds (configurable via settings)
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },
  
  removeNotification: (id) => {
    set((state) => {
      state.ui.notifications = state.ui.notifications.filter((n: any) => n.id !== id);
    });
  },
  
  clearNotifications: () => {
    set((state) => {
      state.ui.notifications = [];
    });
  },
  
  // UI state helpers
  isLoading: () => get().ui.loading,
  hasError: () => get().ui.error !== null,
  getError: () => get().ui.error || null,
  getNotifications: () => get().ui.notifications,
});

// Selector hook will be exported from the main store file
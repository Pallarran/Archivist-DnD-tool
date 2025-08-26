import type { StateCreator } from 'zustand';
import type { AppSettings } from '../types';
import { validateSettings } from '../types/schemas';

export interface SettingsStore {
  // State
  settings: AppSettings;
  
  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  importSettings: (settingsData: any) => void;
  exportSettings: () => AppSettings;
  
  // Theme management
  setTheme: (theme: AppSettings['theme']) => void;
  toggleAdvancedMode: () => void;
  
  // Book/source management
  addDefaultBook: (book: string) => void;
  removeDefaultBook: (book: string) => void;
  setHomebrew: (enabled: boolean) => void;
  
  // Notification settings
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationDuration: (duration: number) => void;
  
  // Utility
  getSystemTheme: () => 'light' | 'dark';
  getEffectiveTheme: () => 'light' | 'dark';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  advancedMode: false,
  defaultBooks: ['PHB', 'DMG', 'MM'], // Player's Handbook, Dungeon Master's Guide, Monster Manual
  homebrew: false,
  autoSave: true,
  units: {
    distance: 'feet',
    weight: 'pounds',
  },
  notifications: {
    enabled: true,
    duration: 5000,
  },
};

export const createSettingsSlice: StateCreator<
  SettingsStore,
  [['zustand/immer', never], ['zustand/persist', unknown], ['zustand/subscribeWithSelector', never]],
  [],
  SettingsStore
> = (set, get) => ({
  // Initial state
  settings: DEFAULT_SETTINGS,
  
  // Settings management
  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      
      try {
        validateSettings(newSettings);
        state.settings = newSettings;
      } catch (error) {
        console.error('Invalid settings update:', error);
        throw new Error('Invalid settings data');
      }
    });
  },
  
  resetSettings: () => {
    set((state) => {
      state.settings = { ...DEFAULT_SETTINGS };
    });
  },
  
  importSettings: (settingsData) => {
    try {
      const validSettings = validateSettings(settingsData);
      set((state) => {
        state.settings = validSettings;
      });
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw new Error('Invalid settings data');
    }
  },
  
  exportSettings: () => {
    return get().settings;
  },
  
  // Theme management
  setTheme: (theme) => {
    set((state) => {
      state.settings.theme = theme;
    });
    
    // Apply theme to document
    const effectiveTheme = get().getEffectiveTheme();
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
  },
  
  toggleAdvancedMode: () => {
    set((state) => {
      state.settings.advancedMode = !state.settings.advancedMode;
    });
  },
  
  // Book/source management
  addDefaultBook: (book) => {
    set((state) => {
      if (!state.settings.defaultBooks.includes(book)) {
        state.settings.defaultBooks.push(book);
      }
    });
  },
  
  removeDefaultBook: (book) => {
    set((state) => {
      state.settings.defaultBooks = state.settings.defaultBooks.filter((b: string) => b !== book);
    });
  },
  
  setHomebrew: (enabled) => {
    set((state) => {
      state.settings.homebrew = enabled;
    });
  },
  
  // Notification settings
  setNotificationsEnabled: (enabled) => {
    set((state) => {
      state.settings.notifications.enabled = enabled;
    });
  },
  
  setNotificationDuration: (duration) => {
    if (duration < 1000 || duration > 30000) {
      throw new Error('Notification duration must be between 1 and 30 seconds');
    }
    
    set((state) => {
      state.settings.notifications.duration = duration;
    });
  },
  
  // Utility functions
  getSystemTheme: () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  },
  
  getEffectiveTheme: () => {
    const { theme } = get().settings;
    if (theme === 'auto') {
      return get().getSystemTheme();
    }
    return theme;
  },
});

// Selector hook will be exported from the main store file
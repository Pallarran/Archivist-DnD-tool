// Re-export all types from their respective modules
export * from './build';
export * from './effects';
export * from './simulation';

// UI-specific types
export interface UIState {
  currentModule: 'dpr' | 'leveling' | 'compare' | 'buildLab' | 'library';
  loading: boolean;
  error?: string | null;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
}

// Application settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  advancedMode: boolean;
  defaultBooks: string[];
  homebrew: boolean;
  autoSave: boolean;
  units: {
    distance: 'feet' | 'meters';
    weight: 'pounds' | 'kilograms';
  };
  notifications: {
    enabled: boolean;
    duration: number;
  };
}

// Persistent data structure for localStorage
export interface SaveData {
  version: string;
  builds: any[];
  settings: any;
  customEffects: any[];
  lastModified: string;
}

// Route parameters for different modules
export interface RouteParams {
  buildId?: string;
  compareIds?: string; // comma-separated build IDs
  level?: string;
  ac?: string;
  module?: string;
}

// Export/Import formats
export interface ExportData {
  format: 'json' | 'csv' | 'pdf';
  data: any;
  metadata: {
    appVersion: string;
    exportDate: string;
    builds: string[];
    settings: Partial<AppSettings>;
  };
}
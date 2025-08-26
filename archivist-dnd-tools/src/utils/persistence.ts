import type { Build, SaveData, ExportData, AppSettings } from '../types';
import { validateBuild, validateSaveData, validateSettings } from '../types/schemas';
import { storage } from './helpers';

const STORAGE_KEYS = {
  SAVE_DATA: 'archivist-dnd-tools-save-data',
  BACKUP: 'archivist-dnd-tools-backup',
  LAST_EXPORT: 'archivist-dnd-tools-last-export',
} as const;

const CURRENT_VERSION = '1.0.0';

// Create a save data object from current state
export const createSaveData = (
  builds: Build[], 
  settings: AppSettings, 
  customEffects: any[] = []
): SaveData => {
  return {
    version: CURRENT_VERSION,
    builds,
    settings,
    customEffects,
    lastModified: new Date().toISOString(),
  };
};

// Save data to localStorage
export const saveToStorage = (saveData: SaveData): boolean => {
  try {
    // Validate the save data before storing
    validateSaveData(saveData);
    
    // Create a backup of current data before overwriting
    const currentData = storage.get<SaveData>(STORAGE_KEYS.SAVE_DATA);
    if (currentData) {
      storage.set(STORAGE_KEYS.BACKUP, currentData);
    }
    
    // Save the new data
    const success = storage.set(STORAGE_KEYS.SAVE_DATA, saveData);
    
    if (success) {
      console.log(`Saved ${saveData.builds.length} builds to localStorage`);
    }
    
    return success;
  } catch (error) {
    console.error('Failed to save data to storage:', error);
    return false;
  }
};

// Load data from localStorage
export const loadFromStorage = (): SaveData | null => {
  try {
    const data = storage.get<SaveData>(STORAGE_KEYS.SAVE_DATA);
    
    if (!data) {
      console.log('No saved data found in localStorage');
      return null;
    }
    
    // Validate the loaded data
    validateSaveData(data);
    
    // Check if migration is needed
    const migratedData = migrateIfNeeded(data);
    
    console.log(`Loaded ${migratedData.builds.length} builds from localStorage`);
    return migratedData;
  } catch (error) {
    console.error('Failed to load data from storage:', error);
    
    // Try to load backup if main data is corrupted
    return loadBackup();
  }
};

// Load backup data
export const loadBackup = (): SaveData | null => {
  try {
    const backupData = storage.get<SaveData>(STORAGE_KEYS.BACKUP);
    
    if (!backupData) {
      console.log('No backup data found');
      return null;
    }
    
    validateSaveData(backupData);
    console.log('Loaded backup data successfully');
    return backupData;
  } catch (error) {
    console.error('Failed to load backup data:', error);
    return null;
  }
};

// Clear all data from storage
export const clearStorage = (): boolean => {
  try {
    storage.remove(STORAGE_KEYS.SAVE_DATA);
    storage.remove(STORAGE_KEYS.BACKUP);
    storage.remove(STORAGE_KEYS.LAST_EXPORT);
    console.log('Cleared all data from localStorage');
    return true;
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
};

// Data migration for version compatibility
const migrateIfNeeded = (data: SaveData): SaveData => {
  // If data is current version, no migration needed
  if (data.version === CURRENT_VERSION) {
    return data;
  }
  
  console.log(`Migrating data from version ${data.version} to ${CURRENT_VERSION}`);
  
  // Perform migrations based on version
  let migratedData = { ...data };
  
  // Add migration logic here as needed
  // Example:
  // if (compareVersions(data.version, '0.9.0') < 0) {
  //   migratedData = migrateFrom090(migratedData);
  // }
  
  // Update version
  migratedData.version = CURRENT_VERSION;
  migratedData.lastModified = new Date().toISOString();
  
  // Save migrated data
  saveToStorage(migratedData);
  
  return migratedData;
};

// Export data as JSON
export const exportToJSON = (
  data: SaveData,
  options: {
    includeSettings?: boolean;
    includeCustomEffects?: boolean;
    buildsOnly?: boolean;
  } = {}
): ExportData => {
  const {
    includeSettings = true,
    includeCustomEffects = true,
    buildsOnly = false,
  } = options;
  
  let exportData: any;
  
  if (buildsOnly) {
    exportData = data.builds;
  } else {
    exportData = {
      builds: data.builds,
      ...(includeSettings && { settings: data.settings }),
      ...(includeCustomEffects && { customEffects: data.customEffects }),
      version: data.version,
      lastModified: data.lastModified,
    };
  }
  
  const result: ExportData = {
    format: 'json',
    data: exportData,
    metadata: {
      appVersion: CURRENT_VERSION,
      exportDate: new Date().toISOString(),
      builds: data.builds.map(b => b.name),
      settings: includeSettings ? data.settings : {},
    },
  };
  
  // Store last export info
  storage.set(STORAGE_KEYS.LAST_EXPORT, {
    timestamp: result.metadata.exportDate,
    buildCount: data.builds.length,
    format: 'json',
  });
  
  return result;
};

// Import data from JSON
export const importFromJSON = (jsonData: any): {
  builds: Build[];
  settings?: AppSettings;
  customEffects?: any[];
  errors: string[];
} => {
  const errors: string[] = [];
  const builds: Build[] = [];
  let settings: AppSettings | undefined;
  let customEffects: any[] | undefined;
  
  try {
    // Handle different import formats
    let dataToImport: any;
    
    if (Array.isArray(jsonData)) {
      // Array of builds only
      dataToImport = { builds: jsonData };
    } else if (jsonData.data && jsonData.format === 'json') {
      // Export data format
      dataToImport = jsonData.data;
    } else {
      // Assume it's a full save data object
      dataToImport = jsonData;
    }
    
    // Import builds
    if (dataToImport.builds && Array.isArray(dataToImport.builds)) {
      for (const [index, buildData] of dataToImport.builds.entries()) {
        try {
          const validatedBuild = validateBuild(buildData);
          builds.push(validatedBuild);
        } catch (error) {
          errors.push(`Build ${index + 1} (${buildData.name || 'Unnamed'}): ${error}`);
        }
      }
    }
    
    // Import settings
    if (dataToImport.settings) {
      try {
        settings = validateSettings(dataToImport.settings);
      } catch (error) {
        errors.push(`Settings: ${error}`);
      }
    }
    
    // Import custom effects
    if (dataToImport.customEffects) {
      customEffects = dataToImport.customEffects; // TODO: Add validation
    }
    
  } catch (error) {
    errors.push(`Failed to parse import data: ${error}`);
  }
  
  return { builds, settings, customEffects, errors };
};

// File download helper
export const downloadFile = (data: any, filename: string, mimeType: string = 'application/json') => {
  try {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to download file:', error);
    return false;
  }
};

// File upload helper
export const uploadFile = (accept: string = '.json'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    
    input.onchange = (event: any) => {
      const file = event.target?.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          resolve(content);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    
    input.oncancel = () => reject(new Error('File selection cancelled'));
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
};

// Auto-save functionality
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export const scheduleAutoSave = (
  saveData: SaveData,
  delayMs: number = 5000
): void => {
  // Clear existing timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
  
  // Schedule new save
  autoSaveTimeout = setTimeout(() => {
    const success = saveToStorage(saveData);
    if (success) {
      console.log('Auto-save completed');
    }
  }, delayMs);
};

export const cancelAutoSave = (): void => {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
};

// Storage usage information
export const getStorageInfo = () => {
  try {
    const saveDataSize = JSON.stringify(storage.get(STORAGE_KEYS.SAVE_DATA) || {}).length;
    const backupSize = JSON.stringify(storage.get(STORAGE_KEYS.BACKUP) || {}).length;
    
    // Estimate total localStorage usage (rough approximation)
    let totalUsage = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalUsage += localStorage[key].length + key.length;
      }
    }
    
    return {
      saveDataSize: (saveDataSize / 1024).toFixed(2) + ' KB',
      backupSize: (backupSize / 1024).toFixed(2) + ' KB',
      totalUsage: (totalUsage / 1024).toFixed(2) + ' KB',
      quota: '5-10 MB (browser dependent)',
    };
  } catch (error) {
    return {
      saveDataSize: 'Unknown',
      backupSize: 'Unknown',
      totalUsage: 'Unknown',
      quota: 'Unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Version comparison utility
export const compareVersions = (version1: string, version2: string): number => {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  const maxLength = Math.max(v1parts.length, v2parts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  
  return 0;
};
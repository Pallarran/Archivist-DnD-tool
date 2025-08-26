/**
 * Simplified Zustand store for gradual feature rollout
 * Starting with minimal functionality to avoid runtime errors
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Basic Build interface - simplified version
export interface SimpleBuild {
  id: string;
  name: string;
  level: number;
  attackBonus: number;
  damage: string;
  notes?: string;
  createdAt: string;
}

// Notification interface
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

// Store interface
interface SimpleStore {
  // Build management
  builds: SimpleBuild[];
  selectedBuildId: string | null;
  
  // UI state
  notifications: Notification[];
  isLoading: boolean;
  
  // Build actions
  addBuild: (build: Omit<SimpleBuild, 'id' | 'createdAt'>) => void;
  updateBuild: (id: string, updates: Partial<SimpleBuild>) => void;
  deleteBuild: (id: string) => void;
  selectBuild: (id: string | null) => void;
  
  // UI actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
  
  // Utilities
  getBuild: (id: string) => SimpleBuild | undefined;
  getSelectedBuild: () => SimpleBuild | undefined;
}

// Generate simple ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Create the store
export const useSimpleStore = create<SimpleStore>()(
  persist(
    (set, get) => ({
      // Initial state
      builds: [],
      selectedBuildId: null,
      notifications: [],
      isLoading: false,
      
      // Build actions
      addBuild: (buildData) => {
        const newBuild: SimpleBuild = {
          ...buildData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          builds: [...state.builds, newBuild],
        }));
        
        // Auto-select the new build
        get().selectBuild(newBuild.id);
        
        get().addNotification({
          type: 'success',
          message: `Build "${newBuild.name}" created successfully!`,
        });
      },
      
      updateBuild: (id, updates) => {
        set((state) => ({
          builds: state.builds.map((build) =>
            build.id === id ? { ...build, ...updates } : build
          ),
        }));
        
        get().addNotification({
          type: 'info',
          message: 'Build updated successfully!',
        });
      },
      
      deleteBuild: (id) => {
        const build = get().getBuild(id);
        const buildName = build?.name || 'Unknown build';
        
        set((state) => ({
          builds: state.builds.filter((build) => build.id !== id),
          selectedBuildId: state.selectedBuildId === id ? null : state.selectedBuildId,
        }));
        
        get().addNotification({
          type: 'warning',
          message: `Build "${buildName}" deleted.`,
        });
      },
      
      selectBuild: (id) => {
        set({ selectedBuildId: id });
      },
      
      // UI actions
      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: generateId(),
          timestamp: Date.now(),
        };
        
        set((state) => ({
          notifications: [...state.notifications, notification],
        }));
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(notification.id);
        }, 5000);
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      // Utilities
      getBuild: (id) => {
        return get().builds.find((build) => build.id === id);
      },
      
      getSelectedBuild: () => {
        const { selectedBuildId, builds } = get();
        return selectedBuildId ? builds.find((build) => build.id === selectedBuildId) : undefined;
      },
    }),
    {
      name: 'archivist-simple-storage', // localStorage key
      partialize: (state) => ({
        // Only persist builds and selected build
        builds: state.builds,
        selectedBuildId: state.selectedBuildId,
      }),
    }
  )
);

// Export individual selectors for easier use
export const useBuilds = () => useSimpleStore((state) => state.builds);
export const useSelectedBuild = () => useSimpleStore((state) => state.getSelectedBuild());
export const useNotifications = () => useSimpleStore((state) => state.notifications);
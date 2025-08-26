import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { BuildStore } from './buildStore';
import type { UIStore } from './uiStore';
import type { SettingsStore } from './settingsStore';
import type { SimulationStore } from './simulationStore';
import { createBuildSlice } from './buildStore';
import { createUISlice } from './uiStore';
import { createSettingsSlice } from './settingsStore';
import { createSimulationSlice } from './simulationStore';

// Combined store type
export interface AppStore extends BuildStore, UIStore, SettingsStore, SimulationStore {}

// Create the main application store
export const useAppStore = create<AppStore>()(
  persist(
    subscribeWithSelector(
      immer((set, get, store) => ({
        ...createBuildSlice(set as any, get as any, store as any),
        ...createUISlice(set as any, get as any, store as any),
        ...createSettingsSlice(set as any, get as any, store as any),
        ...createSimulationSlice(set as any, get as any, store as any),
      }))
    ),
    {
      name: 'archivist-dnd-tools',
      partialize: (state) => ({
        // Only persist certain parts of the state
        builds: state.builds,
        settings: state.settings,
        customEffects: state.customEffects,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migrations between versions
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            settings: {
              ...persistedState.settings,
              notifications: {
                enabled: true,
                duration: 5000,
              },
            },
          };
        }
        return persistedState;
      },
    }
  )
);

// Export individual store selector hooks
export const useBuildStore = () => {
  return useAppStore((state) => ({
    builds: state.builds,
    selectedBuilds: state.selectedBuilds,
    currentBuild: state.currentBuild,
    customEffects: state.customEffects,
    createBuild: state.createBuild,
    updateBuild: state.updateBuild,
    deleteBuild: state.deleteBuild,
    duplicateBuild: state.duplicateBuild,
    importBuild: state.importBuild,
    exportBuild: state.exportBuild,
    selectBuild: state.selectBuild,
    deselectBuild: state.deselectBuild,
    clearSelection: state.clearSelection,
    selectForComparison: state.selectForComparison,
    addCustomEffect: state.addCustomEffect,
    updateCustomEffect: state.updateCustomEffect,
    removeCustomEffect: state.removeCustomEffect,
    importBuilds: state.importBuilds,
    exportAllBuilds: state.exportAllBuilds,
    clearAllBuilds: state.clearAllBuilds,
    getBuild: state.getBuild,
    getSelectedBuilds: state.getSelectedBuilds,
    validateAndFixBuild: state.validateAndFixBuild,
  }));
};

export const useUIStore = () => {
  return useAppStore((state) => ({
    ui: state.ui,
    setCurrentModule: state.setCurrentModule,
    setLoading: state.setLoading,
    setError: state.setError,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications,
    isLoading: state.isLoading,
    hasError: state.hasError,
    getError: state.getError,
    getNotifications: state.getNotifications,
  }));
};

export const useSettingsStore = () => {
  return useAppStore((state) => ({
    settings: state.settings,
    updateSettings: state.updateSettings,
    resetSettings: state.resetSettings,
    importSettings: state.importSettings,
    exportSettings: state.exportSettings,
    setTheme: state.setTheme,
    toggleAdvancedMode: state.toggleAdvancedMode,
    addDefaultBook: state.addDefaultBook,
    removeDefaultBook: state.removeDefaultBook,
    setHomebrew: state.setHomebrew,
    setNotificationsEnabled: state.setNotificationsEnabled,
    setNotificationDuration: state.setNotificationDuration,
    getSystemTheme: state.getSystemTheme,
    getEffectiveTheme: state.getEffectiveTheme,
  }));
};

export const useSimulationStore = () => {
  return useAppStore((state) => ({
    currentTarget: state.currentTarget,
    simulationResults: state.simulationResults,
    advantageAnalysis: state.advantageAnalysis,
    acSensitivity: state.acSensitivity,
    levelingResults: state.levelingResults,
    comparisonResults: state.comparisonResults,
    simulationInProgress: state.simulationInProgress,
    simulationProgress: state.simulationProgress,
    setTarget: state.setTarget,
    updateTarget: state.updateTarget,
    clearTarget: state.clearTarget,
    runSimulation: state.runSimulation,
    runAdvantageAnalysis: state.runAdvantageAnalysis,
    runACSensitivity: state.runACSensitivity,
    runLevelingAnalysis: state.runLevelingAnalysis,
    runComparison: state.runComparison,
    runBatchSimulation: state.runBatchSimulation,
    clearAllResults: state.clearAllResults,
    clearResultsForBuild: state.clearResultsForBuild,
    getSimulationResult: state.getSimulationResult,
    getAdvantageAnalysis: state.getAdvantageAnalysis,
    getACSensitivity: state.getACSensitivity,
    getLevelingResult: state.getLevelingResult,
    getComparisonResult: state.getComparisonResult,
    isSimulationComplete: state.isSimulationComplete,
    hasAnyResults: state.hasAnyResults,
    getResultsForBuilds: state.getResultsForBuilds,
  }));
};
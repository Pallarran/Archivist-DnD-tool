import type { StateCreator } from 'zustand';
import type { Build, Effect } from '../types';
import { validateBuild } from '../types/schemas';
import { generateId } from '../utils/helpers';

export interface BuildStore {
  // State
  builds: Build[];
  selectedBuilds: string[]; // up to 3 build IDs for comparison
  currentBuild: string | null;
  customEffects: Effect[];
  
  // Actions
  createBuild: (build: Omit<Build, 'id'>) => string;
  updateBuild: (id: string, updates: Partial<Build>) => void;
  deleteBuild: (id: string) => void;
  duplicateBuild: (id: string, newName?: string) => string;
  importBuild: (buildData: any) => string;
  exportBuild: (id: string) => Build | null;
  
  // Selection management
  selectBuild: (id: string) => void;
  deselectBuild: (id: string) => void;
  clearSelection: () => void;
  selectForComparison: (ids: string[]) => void;
  
  // Custom effects
  addCustomEffect: (effect: Effect) => void;
  updateCustomEffect: (id: string, updates: Partial<Effect>) => void;
  removeCustomEffect: (id: string) => void;
  
  // Bulk operations
  importBuilds: (buildsData: any[]) => string[];
  exportAllBuilds: () => Build[];
  clearAllBuilds: () => void;
  
  // Utilities
  getBuild: (id: string) => Build | undefined;
  getSelectedBuilds: () => Build[];
  validateAndFixBuild: (build: any) => Build;
}

export const createBuildSlice: StateCreator<
  BuildStore,
  [['zustand/immer', never], ['zustand/persist', unknown], ['zustand/subscribeWithSelector', never]],
  [],
  BuildStore
> = (set, get) => ({
  // Initial state
  builds: [],
  selectedBuilds: [],
  currentBuild: null,
  customEffects: [],
  
  // Build CRUD operations
  createBuild: (buildData) => {
    const id = generateId();
    const build: Build = {
      ...buildData,
      id,
    };
    
    try {
      validateBuild(build);
      set((state) => {
        state.builds.push(build);
        state.currentBuild = id;
      });
      return id;
    } catch (error) {
      console.error('Invalid build data:', error);
      throw new Error('Failed to create build: Invalid data');
    }
  },
  
  updateBuild: (id, updates) => {
    set((state) => {
      const buildIndex = state.builds.findIndex((b: any) => b.id === id);
      if (buildIndex === -1) return;
      
      const updatedBuild = { ...state.builds[buildIndex], ...updates };
      
      try {
        validateBuild(updatedBuild);
        state.builds[buildIndex] = updatedBuild;
      } catch (error) {
        console.error('Invalid build update:', error);
        throw new Error('Failed to update build: Invalid data');
      }
    });
  },
  
  deleteBuild: (id) => {
    set((state) => {
      state.builds = state.builds.filter((b: any) => b.id !== id);
      state.selectedBuilds = state.selectedBuilds.filter((bid: string) => bid !== id);
      if (state.currentBuild === id) {
        state.currentBuild = null;
      }
    });
  },
  
  duplicateBuild: (id, newName) => {
    const originalBuild = get().getBuild(id);
    if (!originalBuild) {
      throw new Error('Build not found');
    }
    
    const newId = generateId();
    const duplicatedBuild: Build = {
      ...originalBuild,
      id: newId,
      name: newName || `${originalBuild.name} (Copy)`,
    };
    
    set((state) => {
      state.builds.push(duplicatedBuild);
    });
    
    return newId;
  },
  
  importBuild: (buildData) => {
    try {
      const build = get().validateAndFixBuild(buildData);
      const newId = generateId();
      build.id = newId;
      
      set((state) => {
        state.builds.push(build);
      });
      
      return newId;
    } catch (error) {
      console.error('Failed to import build:', error);
      throw new Error('Invalid build data');
    }
  },
  
  exportBuild: (id) => {
    return get().getBuild(id) || null;
  },
  
  // Selection management
  selectBuild: (id) => {
    set((state) => {
      state.currentBuild = id;
    });
  },
  
  deselectBuild: (id) => {
    set((state) => {
      state.selectedBuilds = state.selectedBuilds.filter((bid: string) => bid !== id);
    });
  },
  
  clearSelection: () => {
    set((state) => {
      state.selectedBuilds = [];
    });
  },
  
  selectForComparison: (ids) => {
    if (ids.length > 3) {
      throw new Error('Cannot select more than 3 builds for comparison');
    }
    
    set((state) => {
      state.selectedBuilds = ids.filter((id: string) => 
        state.builds.some((build: Build) => build.id === id)
      );
    });
  },
  
  // Custom effects management
  addCustomEffect: (effect) => {
    set((state) => {
      state.customEffects.push(effect);
    });
  },
  
  updateCustomEffect: (id, updates) => {
    set((state) => {
      const effectIndex = state.customEffects.findIndex((e: any) => e.id === id);
      if (effectIndex !== -1) {
        state.customEffects[effectIndex] = { ...state.customEffects[effectIndex], ...updates };
      }
    });
  },
  
  removeCustomEffect: (id) => {
    set((state) => {
      state.customEffects = state.customEffects.filter((e: any) => e.id !== id);
    });
  },
  
  // Bulk operations
  importBuilds: (buildsData) => {
    const importedIds: string[] = [];
    
    set((state) => {
      buildsData.forEach((buildData: any) => {
        try {
          const build = get().validateAndFixBuild(buildData);
          const newId = generateId();
          build.id = newId;
          state.builds.push(build);
          importedIds.push(newId);
        } catch (error) {
          console.warn('Skipping invalid build during import:', error);
        }
      });
    });
    
    return importedIds;
  },
  
  exportAllBuilds: () => {
    return get().builds;
  },
  
  clearAllBuilds: () => {
    set((state) => {
      state.builds = [];
      state.selectedBuilds = [];
      state.currentBuild = null;
    });
  },
  
  // Utility functions
  getBuild: (id) => {
    return get().builds.find((b: Build) => b.id === id);
  },
  
  getSelectedBuilds: () => {
    const { builds, selectedBuilds } = get();
    return selectedBuilds
      .map(id => builds.find(b => b.id === id))
      .filter((build): build is Build => build !== undefined);
  },
  
  validateAndFixBuild: (buildData) => {
    // First try direct validation
    try {
      return validateBuild(buildData);
    } catch (error) {
      // If validation fails, try to fix common issues
      const fixedBuild = {
        ...buildData,
        id: buildData.id || generateId(),
        name: buildData.name || 'Unnamed Build',
        levels: buildData.levels || [{ class: 'Fighter', subclass: 'Champion', level: 1, hitDie: 10 }],
        abilities: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          ...buildData.abilities,
        },
        proficiencyBonus: buildData.proficiencyBonus || 2,
        proficiencies: {
          weapons: [],
          saves: [],
          ...buildData.proficiencies,
        },
        features: buildData.features || [],
        fightingStyles: buildData.fightingStyles || [],
        equipment: {
          ...buildData.equipment,
        },
        spells: buildData.spells || buildData.spellsKnown || [],
        conditions: buildData.conditions || [],
        spellSlots: buildData.spellSlots || {},
        policies: {
          smitePolicy: 'onCrit',
          oncePerTurnPriority: 'optimal',
          precast: [],
          buffAssumptions: 'moderate',
          powerAttackThresholdEV: 0.5,
          ...buildData.policies,
        },
        version: buildData.version || '1.0.0',
        createdAt: buildData.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      
      // Try validation again with fixed data
      return validateBuild(fixedBuild);
    }
  },
});

// Selector hook will be exported from the main store file
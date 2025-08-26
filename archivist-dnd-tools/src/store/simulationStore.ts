import type { StateCreator } from 'zustand';
import type { Target, SimulationResult, AdvantageAnalysis, ACSensitivity, LevelingResult, ComparisonResult } from '../types';

export interface SimulationStore {
  // State
  currentTarget: Target | null;
  simulationResults: Record<string, SimulationResult>; // keyed by build ID
  advantageAnalysis: Record<string, AdvantageAnalysis>; // keyed by build ID
  acSensitivity: Record<string, ACSensitivity>; // keyed by build ID
  levelingResults: Record<string, LevelingResult>; // keyed by build ID
  comparisonResults: ComparisonResult | null;
  
  // Simulation status
  simulationInProgress: boolean;
  simulationProgress: number; // 0-100
  
  // Actions
  setTarget: (target: Target) => void;
  updateTarget: (updates: Partial<Target>) => void;
  clearTarget: () => void;
  
  // Simulation execution
  runSimulation: (buildId: string, target: Target) => Promise<void>;
  runAdvantageAnalysis: (buildId: string, target: Target) => Promise<void>;
  runACSensitivity: (buildId: string, target: Target, acRange: [number, number]) => Promise<void>;
  runLevelingAnalysis: (buildId: string, target: Target) => Promise<void>;
  runComparison: (buildIds: string[], target: Target, weights?: Record<string, number>) => Promise<void>;
  
  // Batch operations
  runBatchSimulation: (buildIds: string[], target: Target) => Promise<void>;
  clearAllResults: () => void;
  clearResultsForBuild: (buildId: string) => void;
  
  // Result getters
  getSimulationResult: (buildId: string) => SimulationResult | null;
  getAdvantageAnalysis: (buildId: string) => AdvantageAnalysis | null;
  getACSensitivity: (buildId: string) => ACSensitivity | null;
  getLevelingResult: (buildId: string) => LevelingResult | null;
  getComparisonResult: () => ComparisonResult | null;
  
  // Utilities
  isSimulationComplete: (buildId: string) => boolean;
  hasAnyResults: () => boolean;
  getResultsForBuilds: (buildIds: string[]) => SimulationResult[];
}

const DEFAULT_TARGET: Target = {
  name: 'Training Dummy',
  armorClass: 15,
  hitPoints: 100,
  resistances: [],
  immunities: [],
  vulnerabilities: [],
  conditions: [],
  traits: {},
  targetCount: 1,
};

export const createSimulationSlice: StateCreator<
  SimulationStore,
  [['zustand/immer', never], ['zustand/persist', unknown], ['zustand/subscribeWithSelector', never]],
  [],
  SimulationStore
> = (set, get) => ({
  // Initial state
  currentTarget: DEFAULT_TARGET,
  simulationResults: {},
  advantageAnalysis: {},
  acSensitivity: {},
  levelingResults: {},
  comparisonResults: null,
  simulationInProgress: false,
  simulationProgress: 0,
  
  // Target management
  setTarget: (target) => {
    set((state) => {
      state.currentTarget = target;
    });
  },
  
  updateTarget: (updates) => {
    set((state) => {
      if (state.currentTarget) {
        state.currentTarget = { ...state.currentTarget, ...updates };
      }
    });
  },
  
  clearTarget: () => {
    set((state) => {
      state.currentTarget = null;
    });
  },
  
  // Simulation execution (these will be implemented with the math engine)
  runSimulation: async (buildId, target) => {
    set((state) => {
      state.simulationInProgress = true;
      state.simulationProgress = 0;
    });
    
    try {
      // TODO: Implement actual simulation logic
      // For now, create a placeholder result
      const placeholderResult: SimulationResult = {
        build: {} as any, // TODO: get build from context
        target,
        rounds: [],
        totals: {
          dpr: { round1: 0, round2: 0, round3: 0, average: 0, sustained: 0 },
          hitRate: 0,
          critRate: 0,
          resourceEfficiency: {},
        },
        breakdowns: {
          damageBySource: {},
          damageByType: {},
          actionEconomy: { mainActions: 0, bonusActions: 0, reactions: 0 },
        },
        recommendations: {
          powerAttack: { recommended: false, breakEvenAC: 15, threshold: 0.5 },
          resources: [],
        },
        metadata: {
          simulationType: 'deterministic',
          timestamp: new Date().toISOString(),
        },
      };
      
      set((state) => {
        state.simulationResults[buildId] = placeholderResult;
        state.simulationProgress = 100;
        state.simulationInProgress = false;
      });
    } catch (error) {
      console.error('Simulation failed:', error);
      set((state) => {
        state.simulationInProgress = false;
        state.simulationProgress = 0;
      });
      throw error;
    }
  },
  
  runAdvantageAnalysis: async (buildId, _target) => {
    // TODO: Implement advantage analysis
    console.log('Running advantage analysis for build:', buildId);
  },
  
  runACSensitivity: async (buildId, _target, acRange) => {
    // TODO: Implement AC sensitivity analysis
    console.log('Running AC sensitivity analysis for build:', buildId, 'AC range:', acRange);
  },
  
  runLevelingAnalysis: async (buildId, _target) => {
    // TODO: Implement leveling analysis
    console.log('Running leveling analysis for build:', buildId);
  },
  
  runComparison: async (buildIds, _target, weights) => {
    // TODO: Implement build comparison
    console.log('Running comparison for builds:', buildIds, 'with weights:', weights);
  },
  
  // Batch operations
  runBatchSimulation: async (buildIds, target) => {
    for (const buildId of buildIds) {
      await get().runSimulation(buildId, target);
    }
  },
  
  clearAllResults: () => {
    set((state) => {
      state.simulationResults = {};
      state.advantageAnalysis = {};
      state.acSensitivity = {};
      state.levelingResults = {};
      state.comparisonResults = null;
    });
  },
  
  clearResultsForBuild: (buildId) => {
    set((state) => {
      delete state.simulationResults[buildId];
      delete state.advantageAnalysis[buildId];
      delete state.acSensitivity[buildId];
      delete state.levelingResults[buildId];
    });
  },
  
  // Result getters
  getSimulationResult: (buildId) => {
    return get().simulationResults[buildId] || null;
  },
  
  getAdvantageAnalysis: (buildId) => {
    return get().advantageAnalysis[buildId] || null;
  },
  
  getACSensitivity: (buildId) => {
    return get().acSensitivity[buildId] || null;
  },
  
  getLevelingResult: (buildId) => {
    return get().levelingResults[buildId] || null;
  },
  
  getComparisonResult: () => {
    return get().comparisonResults;
  },
  
  // Utilities
  isSimulationComplete: (buildId) => {
    return get().simulationResults[buildId] !== undefined;
  },
  
  hasAnyResults: () => {
    const state = get();
    return (
      Object.keys(state.simulationResults).length > 0 ||
      Object.keys(state.advantageAnalysis).length > 0 ||
      Object.keys(state.acSensitivity).length > 0 ||
      Object.keys(state.levelingResults).length > 0 ||
      state.comparisonResults !== null
    );
  },
  
  getResultsForBuilds: (buildIds) => {
    const state = get();
    return buildIds
      .map(id => state.simulationResults[id])
      .filter((result): result is SimulationResult => result !== undefined);
  },
});

// Selector hook will be exported from the main store file
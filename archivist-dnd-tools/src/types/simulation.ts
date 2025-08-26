import type { Build, Target } from './build';

export type { Target };

// Attack calculation results
export interface AttackResult {
  toHit: number;
  hitChance: number;
  critChance: number;
  damage: {
    normal: DamageBreakdown;
    crit: DamageBreakdown;
    expected: number;
  };
  effects: string[]; // applied effects on hit
}

// Damage breakdown for transparency
export interface DamageBreakdown {
  base: Array<{
    dice: string;
    bonus: number;
    type: string;
    source: string;
    expected: number;
  }>;
  modifiers: Array<{
    name: string;
    bonus?: number;
    dice?: string;
    multiplier?: number;
    type: string;
    source: string;
  }>;
  total: {
    dice: string;
    bonus: number;
    expected: number;
    byType: Record<string, number>;
  };
  afterResistances: {
    expected: number;
    byType: Record<string, number>;
  };
}

// Full round simulation result
export interface RoundResult {
  round: number;
  actions: {
    mainAction: AttackResult[];
    bonusAction?: AttackResult[];
    reaction?: AttackResult[];
    freeActions?: Array<{ name: string; effect: string }>;
  };
  totalDamage: {
    expected: number;
    min: number;
    max: number;
    breakdown: DamageBreakdown;
  };
  resourcesUsed: Record<string, number>;
  effectsApplied: string[];
  notes: string[];
}

// Complete simulation result
export interface SimulationResult {
  build: Build;
  target: Target;
  rounds: RoundResult[];
  totals: {
    dpr: {
      round1: number;
      round2: number;
      round3: number;
      average: number;
      sustained: number;
    };
    hitRate: number;
    critRate: number;
    resourceEfficiency: Record<string, number>;
  };
  breakdowns: {
    damageBySource: Record<string, number>;
    damageByType: Record<string, number>;
    actionEconomy: {
      mainActions: number;
      bonusActions: number;
      reactions: number;
    };
  };
  recommendations: {
    powerAttack: {
      recommended: boolean;
      breakEvenAC: number;
      threshold: number;
    };
    resources: Array<{
      resource: string;
      usage: string;
      efficiency: number;
    }>;
  };
  metadata: {
    simulationType: 'deterministic' | 'monteCarlo';
    iterations?: number;
    confidenceInterval?: [number, number];
    timestamp: string;
  };
}

// Advantage sweep results
export interface AdvantageAnalysis {
  build: Build;
  target: Target;
  normal: SimulationResult;
  advantage: SimulationResult;
  disadvantage: SimulationResult;
  deltas: {
    advantageVsNormal: {
      dpr: number;
      hitRate: number;
      percentage: number;
    };
    disadvantageVsNormal: {
      dpr: number;
      hitRate: number;
      percentage: number;
    };
  };
  powerAttackAnalysis: {
    normal: { breakEvenAC: number; recommended: boolean };
    advantage: { breakEvenAC: number; recommended: boolean };
    disadvantage: { breakEvenAC: number; recommended: boolean };
  };
}

// AC sensitivity analysis
export interface ACSensitivity {
  build: Build;
  acRange: [number, number];
  data: Array<{
    ac: number;
    dpr: number;
    hitRate: number;
    powerAttackRecommended: boolean;
  }>;
  crossoverPoints: Array<{
    ac: number;
    event: string;
    description: string;
  }>;
}

// Leveling progression result
export interface LevelingResult {
  build: Build;
  target: Target;
  levels: Array<{
    level: number;
    dpr: number;
    features: string[];
    spells: string[];
    breakpoints: string[];
    changes: {
      attacks: number;
      spellSlots: Record<string, number>;
      abilities: Partial<Record<keyof Build['abilities'], number>>;
      hitPoints: number;
    };
  }>;
  majorBreakpoints: Array<{
    level: number;
    type: 'extraAttack' | 'asi' | 'feat' | 'subclass' | 'spells';
    description: string;
    dprIncrease: number;
  }>;
}

// Build comparison result
export interface ComparisonResult {
  builds: Build[];
  target: Target;
  categories: {
    damage: {
      weight: number;
      scores: number[];
      winner: number;
    };
    defense: {
      weight: number;
      scores: number[];
      winner: number;
    };
    utility: {
      weight: number;
      scores: number[];
      winner: number;
    };
    control: {
      weight: number;
      scores: number[];
      winner: number;
    };
    mobility: {
      weight: number;
      scores: number[];
      winner: number;
    };
    resources: {
      weight: number;
      scores: number[];
      winner: number;
    };
  };
  overall: {
    scores: number[];
    winner: number;
    margin: number;
  };
  featureDiffs: Array<{
    category: string;
    buildA: string[];
    buildB: string[];
    buildC?: string[];
    unique: string[];
    common: string[];
  }>;
}

// Trace for step-by-step calculation explanation
export interface CalculationTrace {
  step: number;
  action: string;
  calculation: string;
  inputs: Record<string, any>;
  result: number;
  explanation: string;
  subSteps?: CalculationTrace[];
}

// Monte Carlo specific results
export interface MonteCarloResult extends SimulationResult {
  iterations: number;
  confidenceLevel: number;
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    percentiles: {
      p25: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
  distribution: Array<{
    damage: number;
    probability: number;
    count: number;
  }>;
}
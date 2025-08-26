import type { Build, Target, CombatContext } from './build';

// Modifier types for different aspects of combat
export interface AttackModifier {
  toHitBonus?: number;
  advantageState?: 'advantage' | 'disadvantage' | 'elven-accuracy';
  critRange?: number;
  bonusDice?: Array<{ dice: string; type: string }>;
}

export interface DamageModifier {
  bonus?: number;
  dice?: string;
  damageType?: string;
  multiplier?: number;
  reroll?: {
    condition: 'min' | 'max' | number[];
    once?: boolean;
  };
}

export interface SaveModifier {
  dcBonus?: number;
  advantageState?: 'advantage' | 'disadvantage';
  rerollFailed?: boolean;
}

// Context interfaces for effect hooks
export interface AttackContext {
  build: Build;
  target: Target;
  combat: CombatContext;
  weapon?: string;
  spell?: string;
  attackNumber: number;
  isMainAction: boolean;
}

export interface HitContext extends AttackContext {
  attackRoll: number;
  isCrit: boolean;
}

export interface CritContext extends HitContext {
  // Additional crit-specific context
}

export interface DamageContext extends HitContext {
  baseDamage: { dice: string; bonus: number; type: string }[];
  finalDamage?: number;
}

export interface SaveContext {
  build: Build;
  target: Target;
  combat: CombatContext;
  spell: string;
  savingThrow: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  dc: number;
}

// Hook function types
export type AttackRollHook = (context: AttackContext) => AttackModifier;
export type HitHook = (context: HitContext) => DamageModifier;
export type CritHook = (context: CritContext) => DamageModifier;
export type DamageRollHook = (context: DamageContext) => DamageModifier;
export type SaveHook = (context: SaveContext) => SaveModifier;

// Duration and resource cost interfaces
export interface Duration {
  rounds?: number;
  minutes?: number;
  hours?: number;
  concentration?: boolean;
  untilRest?: 'short' | 'long';
  permanent?: boolean;
}

export interface ResourceCost {
  type: 'spellSlot' | 'superiorityDie' | 'ki' | 'rage' | 'bardic' | 'sorcery' | 'warlock' | 'other';
  amount: number;
  level?: number; // for spell slots
  restType?: 'short' | 'long' | 'turn' | 'round';
}

// Main Effect interface
export interface Effect {
  id: string;
  name: string;
  description: string;
  source: {
    book: string;
    page?: number;
    section?: string;
  };
  type: 'feat' | 'feature' | 'spell' | 'item' | 'condition' | 'buff' | 'debuff';
  level?: number; // for spells and class features
  prerequisites?: string[];
  
  // Effect hooks - these modify game mechanics
  hooks: {
    onAttackRoll?: AttackRollHook;
    onHit?: HitHook;
    onCrit?: CritHook;
    onDamageRoll?: DamageRollHook;
    onSave?: SaveHook;
    onFailSave?: SaveHook;
    onKill?: (context: HitContext) => void;
    onTurnStart?: (context: CombatContext) => void;
    onTurnEnd?: (context: CombatContext) => void;
    onRoundStart?: (context: CombatContext) => void;
    onRoundEnd?: (context: CombatContext) => void;
  };
  
  // Static modifiers
  modifiers: {
    toHit?: number;
    damage?: DamageModifier;
    ac?: number;
    savingThrows?: Partial<Record<'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA', number>>;
    speed?: number;
    hitPoints?: number;
    critRange?: number;
    advantageOn?: string[]; // conditions for advantage
    disadvantageOn?: string[]; // conditions for disadvantage
  };
  
  // Stacking and interaction rules
  stacking: {
    replaces?: string[]; // effects this replaces
    stacksWith?: string[]; // effects this can stack with
    mutuallyExclusive?: string[]; // effects this conflicts with
    category?: string; // for categorizing similar effects
  };
  
  // Duration and cost
  duration?: Duration;
  resourceCost?: ResourceCost;
  
  // Usage limitations
  usage?: {
    perTurn?: number;
    perRound?: number;
    perEncounter?: number;
    perShortRest?: number;
    perLongRest?: number;
    perDay?: number;
    charges?: number;
  };
  
  // Conditions for when this effect applies
  conditions?: {
    weaponTypes?: string[];
    spellTypes?: string[];
    damageTypes?: string[];
    targetTypes?: string[];
    combatPhase?: 'action' | 'bonus' | 'reaction' | 'free' | 'movement';
    requirements?: string[]; // arbitrary requirements
  };
  
  // Metadata
  tags?: string[];
  homebrew?: boolean;
}

// Collection of effects for easy management
export interface EffectLibrary {
  feats: Record<string, Effect>;
  features: Record<string, Effect>;
  spells: Record<string, Effect>;
  items: Record<string, Effect>;
  conditions: Record<string, Effect>;
}

// Applied effect with runtime state
export interface AppliedEffect extends Effect {
  appliedFrom: 'build' | 'temporary' | 'environment';
  remainingUses?: number;
  remainingDuration?: number;
  appliedBy?: string; // what applied this effect
  context?: Record<string, any>; // runtime context
}
export interface Abilities {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface ClassLevel {
  class: string;
  subclass?: string;
  level: number;
  hitDie: number;
}

export interface Proficiencies {
  weapons: string[];
  saves: string[];
  skills?: string[];
  tools?: string[];
  languages?: string[];
}

export interface Weapon {
  name: string;
  type: 'melee' | 'ranged';
  damage: string;
  damageType: string;
  properties: string[];
  category: 'simple' | 'martial';
  cost: string;
  weight: number;
  range?: string;
  magic?: number;
  toHitBonus?: number;
  damageBonus?: number;
}

export interface Armor {
  name: string;
  type: 'light' | 'medium' | 'heavy';
  ac: number;
  stealthDisadvantage: boolean;
  strengthRequirement?: number;
  cost: string;
  weight: number;
  magic?: number;
}

export interface Equipment {
  mainHand?: Weapon | null;
  offHand?: Weapon | null;
  armor?: Armor | null;
  accessories?: Array<{ name: string; properties?: string[] }>;
}

export interface Policies {
  smitePolicy: 'never' | 'onCrit' | 'optimal' | 'always';
  oncePerTurnPriority: 'optimal' | 'always';
  precast: string[];
  buffAssumptions: 'none' | 'conservative' | 'moderate' | 'optimal';
  powerAttackThresholdEV: number;
}

export interface Build {
  id: string;
  name: string;
  description?: string;
  levels: ClassLevel[];
  abilities: Abilities;
  proficiencyBonus: number;
  equipment: Equipment;
  features: string[];
  fightingStyles?: string[];
  spells: string[];
  conditions: string[];
  policies: Policies;
  spellSlots: Record<string, number>;
  version: string;
  createdAt: string;
  lastModified: string;
}

// Target/Enemy interface for combat simulation
export interface Target {
  name: string;
  armorClass: number;
  hitPoints: number;
  maxHP?: number;
  currentHP?: number;
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  type?: string;
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  conditions?: string[];
}

// Combat context for calculations
export interface CombatContext {
  advantage: 'normal' | 'advantage' | 'disadvantage';
  cover: 'none' | 'half' | 'three-quarters' | 'full';
  range: 'normal' | 'long' | 'point-blank';
  lighting: 'bright' | 'dim' | 'darkness';
  flanking: boolean;
  hidden: boolean;
  recklessAttack: boolean;
  allyWithin5ft: boolean;
  targetActions: string[];
  targetConditions: string[];
}

// Class progression data structures
export interface ClassFeature {
  name: string;
  description: string;
  level: number;
  class: string;
  subclass?: string;
  category: 'core' | 'subclass' | 'asi' | 'spell';
}

export interface SpellSlotProgression {
  level: number;
  1?: number;
  2?: number;
  3?: number;
  4?: number;
  5?: number;
  6?: number;
  7?: number;
  8?: number;
  9?: number;
}

export interface ClassProgression {
  class: string;
  hitDie: number;
  primaryAbility: string[];
  savingThrowProficiencies: string[];
  skillChoices: number;
  availableSkills: string[];
  weaponProficiencies: string[];
  armorProficiencies: string[];
  features: ClassFeature[];
  spellSlots?: SpellSlotProgression[];
  attacksPerAction: { level: number; attacks: number }[];
  proficiencyBonus: { level: number; bonus: number }[];
}

export interface LevelAnalysis {
  level: number;
  proficiencyBonus: number;
  hitPointsAverage: number;
  hitPointsMax: number;
  attacksPerAction: number;
  spellSlots: Record<string, number>;
  dpr: {
    normal: number;
    advantage: number;
    disadvantage: number;
  };
  features: ClassFeature[];
  breakpoints: {
    majorFeature?: string;
    spellLevel?: number;
    asi?: boolean;
  };
}
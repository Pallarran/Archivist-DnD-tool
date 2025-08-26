import { z } from 'zod';

// Abilities schema
export const AbilitiesSchema = z.object({
  STR: z.number().int().min(1).max(30),
  DEX: z.number().int().min(1).max(30),
  CON: z.number().int().min(1).max(30),
  INT: z.number().int().min(1).max(30),
  WIS: z.number().int().min(1).max(30),
  CHA: z.number().int().min(1).max(30),
});

// Class level schema
export const ClassLevelSchema = z.object({
  class: z.string().min(1),
  subclass: z.string().min(1),
  level: z.number().int().min(1).max(20),
});

// Proficiencies schema
export const ProficienciesSchema = z.object({
  weapons: z.array(z.string()),
  saves: z.array(z.string()),
  skills: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

// Weapon schema
export const WeaponSchema = z.object({
  type: z.string().min(1),
  die: z.string().regex(/^\d*d\d+(\+\d+)?$/),
  magic: z.number().int().min(0).max(5),
  properties: z.array(z.string()),
  damageType: z.string().optional(),
  toHitBonus: z.number().optional(),
  damageBonus: z.number().optional(),
});

// Armor schema
export const ArmorSchema = z.object({
  type: z.string().min(1),
  ac: z.number().int().min(10).max(25),
  magic: z.number().int().min(0).max(5),
  stealthDisadvantage: z.boolean().optional(),
  properties: z.array(z.string()).optional(),
});

// Equipment schema
export const EquipmentSchema = z.object({
  mainHand: WeaponSchema.optional(),
  offHand: z.union([
    WeaponSchema,
    z.object({
      type: z.literal('shield'),
      acBonus: z.number().int().min(1).max(5),
    })
  ]).optional(),
  armor: ArmorSchema.optional(),
  items: z.array(z.object({
    name: z.string(),
    properties: z.array(z.string()).optional(),
  })).optional(),
});

// Policies schema
export const PoliciesSchema = z.object({
  smitePolicy: z.enum(['never', 'onCrit', 'optimal', 'always']),
  oncePerTurnPriority: z.enum(['optimal', 'always']),
  precast: z.array(z.string()),
  buffAssumptions: z.enum(['none', 'conservative', 'moderate', 'optimal']),
  powerAttackThresholdEV: z.number(),
});

// Main build schema
export const BuildSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  levels: z.array(ClassLevelSchema).min(1).max(20),
  abilities: AbilitiesSchema,
  proficiencyBonus: z.number().int().min(2).max(6),
  equipment: EquipmentSchema,
  features: z.array(z.string()),
  fightingStyles: z.array(z.string()).optional(),
  spells: z.array(z.string()),
  conditions: z.array(z.string()),
  policies: PoliciesSchema,
  spellSlots: z.record(z.string(), z.number().int().min(0)),
  version: z.string(),
  createdAt: z.string(),
  lastModified: z.string(),
});

// Target schema
export const TargetSchema = z.object({
  name: z.string().min(1),
  armorClass: z.number().int().min(5).max(30),
  hitPoints: z.number().int().min(1),
  maxHP: z.number().int().min(1).optional(),
  currentHP: z.number().int().min(0).optional(),
  size: z.enum(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']).optional(),
  type: z.string().optional(),
  resistances: z.array(z.string()),
  immunities: z.array(z.string()),
  vulnerabilities: z.array(z.string()),
  conditions: z.array(z.string()).optional(),
});

// Combat context schema
export const CombatContextSchema = z.object({
  target: TargetSchema,
  round: z.number().int().min(1).max(10),
  advantage: z.enum(['normal', 'advantage', 'disadvantage']),
  buffs: z.array(z.string()),
  debuffs: z.array(z.string()),
  conditions: z.array(z.string()),
});

// Duration schema
export const DurationSchema = z.object({
  rounds: z.number().int().min(0).optional(),
  minutes: z.number().int().min(0).optional(),
  hours: z.number().int().min(0).optional(),
  concentration: z.boolean().optional(),
  untilRest: z.enum(['short', 'long']).optional(),
  permanent: z.boolean().optional(),
});

// Resource cost schema
export const ResourceCostSchema = z.object({
  type: z.enum(['spellSlot', 'superiorityDie', 'ki', 'rage', 'bardic', 'sorcery', 'warlock', 'other']),
  amount: z.number().int().min(1),
  level: z.number().int().min(1).max(9).optional(),
  restType: z.enum(['short', 'long', 'turn', 'round']).optional(),
});

// Effect schema
export const EffectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  source: z.object({
    book: z.string(),
    page: z.number().int().optional(),
    section: z.string().optional(),
  }),
  type: z.enum(['feat', 'feature', 'spell', 'item', 'condition', 'buff', 'debuff']),
  level: z.number().int().min(0).max(20).optional(),
  prerequisites: z.array(z.string()).optional(),
  modifiers: z.object({
    toHit: z.number().optional(),
    damage: z.object({
      bonus: z.number().optional(),
      dice: z.string().optional(),
      damageType: z.string().optional(),
      multiplier: z.number().optional(),
    }).optional(),
    ac: z.number().optional(),
    savingThrows: z.record(z.string(), z.number()).optional(),
    speed: z.number().optional(),
    hitPoints: z.number().optional(),
    critRange: z.number().int().min(1).max(20).optional(),
    advantageOn: z.array(z.string()).optional(),
    disadvantageOn: z.array(z.string()).optional(),
  }),
  stacking: z.object({
    replaces: z.array(z.string()).optional(),
    stacksWith: z.array(z.string()).optional(),
    mutuallyExclusive: z.array(z.string()).optional(),
    category: z.string().optional(),
  }),
  duration: DurationSchema.optional(),
  resourceCost: ResourceCostSchema.optional(),
  usage: z.object({
    perTurn: z.number().int().min(1).optional(),
    perRound: z.number().int().min(1).optional(),
    perEncounter: z.number().int().min(1).optional(),
    perShortRest: z.number().int().min(1).optional(),
    perLongRest: z.number().int().min(1).optional(),
    perDay: z.number().int().min(1).optional(),
    charges: z.number().int().min(1).optional(),
  }).optional(),
  conditions: z.object({
    weaponTypes: z.array(z.string()).optional(),
    spellTypes: z.array(z.string()).optional(),
    damageTypes: z.array(z.string()).optional(),
    targetTypes: z.array(z.string()).optional(),
    combatPhase: z.enum(['action', 'bonus', 'reaction', 'free', 'movement']).optional(),
    requirements: z.array(z.string()).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  homebrew: z.boolean().optional(),
});

// App settings schema
export const AppSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  advancedMode: z.boolean(),
  defaultBooks: z.array(z.string()),
  homebrew: z.boolean(),
  autoSave: z.boolean(),
  units: z.object({
    distance: z.enum(['feet', 'meters']),
    weight: z.enum(['pounds', 'kilograms']),
  }),
  notifications: z.object({
    enabled: z.boolean(),
    duration: z.number().int().min(1000).max(30000),
  }),
});

// Save data schema
export const SaveDataSchema = z.object({
  version: z.string(),
  builds: z.array(BuildSchema),
  settings: AppSettingsSchema,
  customEffects: z.array(EffectSchema),
  lastModified: z.string(),
});

// Export data schema
export const ExportDataSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf']),
  data: z.any(),
  metadata: z.object({
    appVersion: z.string(),
    exportDate: z.string(),
    builds: z.array(z.string()),
    settings: AppSettingsSchema.partial(),
  }),
});

// Validation helper functions
export const validateBuild = (data: unknown) => BuildSchema.parse(data);
export const validateTarget = (data: unknown) => TargetSchema.parse(data);
export const validateEffect = (data: unknown) => EffectSchema.parse(data);
export const validateSettings = (data: unknown) => AppSettingsSchema.parse(data);
export const validateSaveData = (data: unknown) => SaveDataSchema.parse(data);
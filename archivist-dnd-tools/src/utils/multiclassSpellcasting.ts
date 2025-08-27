/**
 * Multiclass Spellcasting and Resource Management System
 * Handles spell slot stacking, resource tracking, and optimization for D&D 5e
 */

import type { SimpleBuild, ClassLevel } from '../store/simpleStore';

// Spellcasting progression types
export type SpellcasterType = 'full' | 'half' | 'third' | 'warlock' | 'none';

// Resource types for different classes
export interface ClassResources {
  // Spell resources
  spellSlots: Record<number, number>; // level -> slots
  warlockSlots: { level: number; slots: number } | null;
  sorceryPoints: number;
  
  // Class-specific resources
  kiPoints: number;
  rageUses: number;
  superiorityDice: number;
  actionSurges: number;
  secondWindUses: number;
  channelDivinityUses: number;
  wildShapeUses: number;
  bardInspiration: number;
  
  // Subclass-specific resources
  arcaneRecovery: number;
  fontOfMagic: boolean;
  metamagicOptions: string[];
}

// Full spellcaster progression table (Wizard, Sorcerer, Bard, Cleric, Druid)
const FULL_CASTER_SLOTS = [
  { level: 1, slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
  { level: 2, slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
  { level: 3, slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
  { level: 4, slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
  { level: 5, slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
  { level: 6, slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
  { level: 7, slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
  { level: 8, slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
  { level: 9, slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
  { level: 10, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
  { level: 11, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  { level: 12, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
  { level: 13, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  { level: 14, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
  { level: 15, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  { level: 16, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
  { level: 17, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
  { level: 18, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
  { level: 19, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
  { level: 20, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
];

// Half-caster progression (Paladin, Ranger)
const HALF_CASTER_SLOTS = [
  { level: 1, slots: [0, 0, 0, 0, 0] },
  { level: 2, slots: [2, 0, 0, 0, 0] },
  { level: 3, slots: [3, 0, 0, 0, 0] },
  { level: 4, slots: [3, 0, 0, 0, 0] },
  { level: 5, slots: [4, 2, 0, 0, 0] },
  { level: 6, slots: [4, 2, 0, 0, 0] },
  { level: 7, slots: [4, 3, 0, 0, 0] },
  { level: 8, slots: [4, 3, 0, 0, 0] },
  { level: 9, slots: [4, 3, 2, 0, 0] },
  { level: 10, slots: [4, 3, 2, 0, 0] },
  { level: 11, slots: [4, 3, 3, 0, 0] },
  { level: 12, slots: [4, 3, 3, 0, 0] },
  { level: 13, slots: [4, 3, 3, 1, 0] },
  { level: 14, slots: [4, 3, 3, 1, 0] },
  { level: 15, slots: [4, 3, 3, 2, 0] },
  { level: 16, slots: [4, 3, 3, 2, 0] },
  { level: 17, slots: [4, 3, 3, 3, 1] },
  { level: 18, slots: [4, 3, 3, 3, 1] },
  { level: 19, slots: [4, 3, 3, 3, 2] },
  { level: 20, slots: [4, 3, 3, 3, 2] },
];

// Third-caster progression (Eldritch Knight, Arcane Trickster)
const THIRD_CASTER_SLOTS = [
  { level: 1, slots: [0, 0, 0, 0] },
  { level: 2, slots: [0, 0, 0, 0] },
  { level: 3, slots: [2, 0, 0, 0] },
  { level: 4, slots: [3, 0, 0, 0] },
  { level: 5, slots: [3, 0, 0, 0] },
  { level: 6, slots: [3, 0, 0, 0] },
  { level: 7, slots: [4, 2, 0, 0] },
  { level: 8, slots: [4, 2, 0, 0] },
  { level: 9, slots: [4, 2, 0, 0] },
  { level: 10, slots: [4, 3, 0, 0] },
  { level: 11, slots: [4, 3, 0, 0] },
  { level: 12, slots: [4, 3, 0, 0] },
  { level: 13, slots: [4, 3, 2, 0] },
  { level: 14, slots: [4, 3, 2, 0] },
  { level: 15, slots: [4, 3, 2, 0] },
  { level: 16, slots: [4, 3, 3, 0] },
  { level: 17, slots: [4, 3, 3, 0] },
  { level: 18, slots: [4, 3, 3, 0] },
  { level: 19, slots: [4, 3, 3, 1] },
  { level: 20, slots: [4, 3, 3, 1] },
];

// Warlock progression (separate pact magic system)
const WARLOCK_SLOTS = [
  { level: 1, slots: 1, slotLevel: 1 },
  { level: 2, slots: 2, slotLevel: 1 },
  { level: 3, slots: 2, slotLevel: 2 },
  { level: 4, slots: 2, slotLevel: 2 },
  { level: 5, slots: 2, slotLevel: 3 },
  { level: 6, slots: 2, slotLevel: 3 },
  { level: 7, slots: 2, slotLevel: 4 },
  { level: 8, slots: 2, slotLevel: 4 },
  { level: 9, slots: 2, slotLevel: 5 },
  { level: 10, slots: 2, slotLevel: 5 },
  { level: 11, slots: 3, slotLevel: 5 },
  { level: 12, slots: 3, slotLevel: 5 },
  { level: 13, slots: 3, slotLevel: 5 },
  { level: 14, slots: 3, slotLevel: 5 },
  { level: 15, slots: 3, slotLevel: 5 },
  { level: 16, slots: 3, slotLevel: 5 },
  { level: 17, slots: 4, slotLevel: 5 },
  { level: 18, slots: 4, slotLevel: 5 },
  { level: 19, slots: 4, slotLevel: 5 },
  { level: 20, slots: 4, slotLevel: 5 },
];

/**
 * Determine spellcaster type for a class
 */
export function getSpellcasterType(className: string, subclass?: string): SpellcasterType {
  const lowerClass = className.toLowerCase();
  const lowerSubclass = subclass?.toLowerCase();
  
  // Full casters
  if (['wizard', 'sorcerer', 'bard', 'cleric', 'druid'].includes(lowerClass)) {
    return 'full';
  }
  
  // Warlock (pact magic)
  if (lowerClass === 'warlock') {
    return 'warlock';
  }
  
  // Half casters
  if (['paladin', 'ranger'].includes(lowerClass)) {
    return 'half';
  }
  
  // Third casters (subclass dependent)
  if (lowerClass === 'fighter' && lowerSubclass === 'eldritch knight') {
    return 'third';
  }
  if (lowerClass === 'rogue' && lowerSubclass === 'arcane trickster') {
    return 'third';
  }
  
  return 'none';
}

/**
 * Calculate multiclass spellcaster level for spell slot determination
 */
export function calculateMulticlassSpellcasterLevel(classLevels: ClassLevel[]): number {
  let spellcasterLevel = 0;
  
  for (const classLevel of classLevels) {
    const spellcasterType = getSpellcasterType(classLevel.class);
    
    switch (spellcasterType) {
      case 'full':
        spellcasterLevel += classLevel.level;
        break;
      case 'half':
        spellcasterLevel += Math.floor(classLevel.level / 2);
        break;
      case 'third':
        spellcasterLevel += Math.floor(classLevel.level / 3);
        break;
      case 'warlock':
        // Warlock doesn't contribute to multiclass spell slots
        break;
    }
  }
  
  return Math.min(spellcasterLevel, 20);
}

/**
 * Get spell slots for a multiclass character
 */
export function getMulticlassSpellSlots(classLevels: ClassLevel[]): Record<number, number> {
  const spellcasterLevel = calculateMulticlassSpellcasterLevel(classLevels);
  
  if (spellcasterLevel === 0) {
    return {};
  }
  
  const slotData = FULL_CASTER_SLOTS.find(entry => entry.level === spellcasterLevel);
  if (!slotData) {
    return {};
  }
  
  const slots: Record<number, number> = {};
  slotData.slots.forEach((count, index) => {
    if (count > 0) {
      slots[index + 1] = count;
    }
  });
  
  return slots;
}

/**
 * Get Warlock pact magic slots separately
 */
export function getWarlockSlots(warlockLevel: number): { level: number; slots: number } | null {
  if (warlockLevel === 0) {
    return null;
  }
  
  const warlockData = WARLOCK_SLOTS.find(entry => entry.level === warlockLevel);
  return warlockData ? { level: warlockData.slotLevel, slots: warlockData.slots } : null;
}

/**
 * Calculate all class resources for a build
 */
export function calculateClassResources(build: SimpleBuild, characterLevel: number): ClassResources {
  const classLevels = build.classLevels || [];
  
  // Calculate spell slots
  const multiclassSpellSlots = getMulticlassSpellSlots(classLevels);
  const warlockLevel = classLevels.find(cl => cl.class.toLowerCase() === 'warlock')?.level || 0;
  const warlockSlots = getWarlockSlots(warlockLevel);
  
  // Calculate class-specific resources
  const resources: ClassResources = {
    spellSlots: multiclassSpellSlots,
    warlockSlots,
    sorceryPoints: 0,
    kiPoints: 0,
    rageUses: 0,
    superiorityDice: 0,
    actionSurges: 0,
    secondWindUses: 0,
    channelDivinityUses: 0,
    wildShapeUses: 0,
    bardInspiration: 0,
    arcaneRecovery: 0,
    fontOfMagic: false,
    metamagicOptions: []
  };
  
  // Calculate resources for each class
  for (const classLevel of classLevels) {
    const className = classLevel.class.toLowerCase();
    const level = classLevel.level;
    
    switch (className) {
      case 'sorcerer':
        resources.sorceryPoints = level;
        resources.fontOfMagic = level >= 2;
        if (level >= 3) {
          const metamagicCount = level >= 17 ? 4 : level >= 10 ? 3 : 2;
          resources.metamagicOptions = Array(metamagicCount).fill('metamagic');
        }
        break;
        
      case 'monk':
        resources.kiPoints = level;
        break;
        
      case 'barbarian':
        if (level >= 20) resources.rageUses = 999; // Unlimited at level 20
        else if (level >= 17) resources.rageUses = 6;
        else if (level >= 12) resources.rageUses = 5;
        else if (level >= 6) resources.rageUses = 4;
        else if (level >= 3) resources.rageUses = 3;
        else resources.rageUses = 2;
        break;
        
      case 'fighter':
        resources.actionSurges = level >= 17 ? 2 : 1;
        resources.secondWindUses = 1;
        
        // Battle Master maneuvers
        if (level >= 3) {
          resources.superiorityDice = level >= 15 ? 6 : level >= 7 ? 5 : 4;
        }
        break;
        
      case 'cleric':
        resources.channelDivinityUses = level >= 18 ? 3 : level >= 6 ? 2 : 1;
        break;
        
      case 'druid':
        if (level >= 20) resources.wildShapeUses = 999; // Unlimited at level 20
        else resources.wildShapeUses = 2;
        break;
        
      case 'bard':
        const inspirationDie = level >= 15 ? 'd12' : level >= 10 ? 'd10' : level >= 5 ? 'd8' : 'd6';
        resources.bardInspiration = Math.max(1, Math.floor((build.abilityScores?.charisma || 10 - 10) / 2));
        break;
        
      case 'wizard':
        resources.arcaneRecovery = Math.ceil(level / 2);
        break;
    }
  }
  
  return resources;
}

/**
 * Calculate optimal spell slot usage for DPR
 */
export interface SpellSlotOptimization {
  optimalSlots: Record<number, number>; // spell level -> slots to use
  expectedDPR: number;
  resourceEfficiency: number; // DPR per spell slot
  recommendations: string[];
}

export function optimizeSpellSlotUsage(
  resources: ClassResources,
  targetAC: number,
  spellAttackBonus: number,
  spellSaveDC: number,
  encountersPerDay: number = 6
): SpellSlotOptimization {
  const recommendations: string[] = [];
  let totalDPR = 0;
  const optimalSlots: Record<number, number> = {};
  
  // Prioritize higher-level spell slots for damage
  const availableSlots = { ...resources.spellSlots };
  
  // Calculate DPR efficiency for each spell level
  const spellEfficiency: Record<number, number> = {};
  
  for (let level = 1; level <= 9; level++) {
    if (availableSlots[level] > 0) {
      // Example spell damage calculations (this would be expanded with actual spell database)
      let avgDamage = 0;
      
      switch (level) {
        case 1:
          avgDamage = 10.5; // Magic Missile average
          break;
        case 2:
          avgDamage = 21; // Scorching Ray average
          break;
        case 3:
          avgDamage = 28; // Fireball average
          break;
        case 4:
          avgDamage = 35; // Greater Invisibility + weapon attacks
          break;
        case 5:
          avgDamage = 42; // Cone of Cold average
          break;
        default:
          avgDamage = level * 7; // Rough estimate
      }
      
      spellEfficiency[level] = avgDamage;
    }
  }
  
  // Allocate spell slots optimally
  let totalSlots = Object.values(availableSlots).reduce((sum, slots) => sum + slots, 0);
  let slotsPerEncounter = Math.max(1, Math.floor(totalSlots / encountersPerDay));
  
  // Recommend usage pattern
  if (slotsPerEncounter >= 3) {
    recommendations.push('High resource availability - use higher level spells liberally');
  } else if (slotsPerEncounter >= 2) {
    recommendations.push('Moderate resources - balance spell usage with weapon attacks');
  } else {
    recommendations.push('Limited resources - prioritize weapon attacks, use spells strategically');
  }
  
  // Calculate Warlock contribution
  if (resources.warlockSlots) {
    const warlockDPR = spellEfficiency[resources.warlockSlots.level] || 0;
    totalDPR += warlockDPR * resources.warlockSlots.slots;
    recommendations.push(`Use Warlock ${resources.warlockSlots.slots} level ${resources.warlockSlots.level} slots each short rest`);
  }
  
  // Calculate Sorcery Point optimization
  if (resources.sorceryPoints > 0) {
    recommendations.push(`Convert ${Math.floor(resources.sorceryPoints / 2)} sorcery points to spell slots for additional casts`);
  }
  
  const resourceEfficiency = totalSlots > 0 ? totalDPR / totalSlots : 0;
  
  return {
    optimalSlots,
    expectedDPR: totalDPR,
    resourceEfficiency,
    recommendations
  };
}

/**
 * Analyze multiclass spell synergies
 */
export function analyzeSpellSynergies(classLevels: ClassLevel[]): {
  synergies: string[];
  warnings: string[];
  recommendations: string[];
} {
  const synergies: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  const classes = classLevels.map(cl => cl.class.toLowerCase());
  
  // Sorcerer + Warlock (Sorlock)
  if (classes.includes('sorcerer') && classes.includes('warlock')) {
    synergies.push('Sorlock synergy: Convert Warlock slots to sorcery points for metamagic');
    recommendations.push('Use Warlock slots for Eldritch Blast + Agonizing Blast, convert to sorcery points');
  }
  
  // Cleric + Wizard (Divine Magic)
  if (classes.includes('cleric') && classes.includes('wizard')) {
    synergies.push('Divine Wizard: Access to both arcane and divine spell lists');
    recommendations.push('Use Cleric slots for healing/buffs, Wizard slots for damage/control');
  }
  
  // Paladin + Warlock (Paladin/Warlock)
  if (classes.includes('paladin') && classes.includes('warlock')) {
    synergies.push('Pallock synergy: Warlock slots refresh on short rest for more smites');
    recommendations.push('Use Warlock slots primarily for Divine Smite nova damage');
  }
  
  // Fighter + Wizard (Gish builds)
  if (classes.includes('fighter') && classes.includes('wizard')) {
    synergies.push('Eldritch Knight synergy: Action Surge for double spell casting');
    recommendations.push('Use Action Surge to cast two leveled spells in one turn');
  }
  
  // Warning for conflicting spellcasting abilities
  const spellcastingAbilities = new Set<string>();
  for (const classLevel of classLevels) {
    const className = classLevel.class.toLowerCase();
    if (['wizard'].includes(className)) spellcastingAbilities.add('Intelligence');
    if (['cleric', 'druid', 'ranger'].includes(className)) spellcastingAbilities.add('Wisdom');
    if (['sorcerer', 'bard', 'warlock', 'paladin'].includes(className)) spellcastingAbilities.add('Charisma');
  }
  
  if (spellcastingAbilities.size > 1) {
    warnings.push(`Multiple spellcasting abilities required: ${Array.from(spellcastingAbilities).join(', ')}`);
    recommendations.push('Consider focusing on classes with the same spellcasting ability');
  }
  
  return { synergies, warnings, recommendations };
}
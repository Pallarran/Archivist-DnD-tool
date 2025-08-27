/**
 * Spell damage and effect calculations for DPR simulation
 */

import type { SimpleBuild } from '../store/simpleStore';

export interface SpellEffect {
  name: string;
  level: number;
  damageType?: 'attack' | 'save';
  savingThrow?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  damage: string; // Dice notation like "3d6" or "8d6"
  scalingDamage?: string; // Additional damage per spell level above base
  isCantrip?: boolean;
  attackBonus?: number; // For spell attacks
  requiresConcentration?: boolean;
  targetCount?: number; // For AoE spells
  saveForHalf?: boolean; // Whether failed save deals half damage
  duration?: number; // In rounds
}

// Common spell database for DPR calculations
export const SPELL_DATABASE: Record<string, SpellEffect> = {
  // Cantrips
  'fire bolt': {
    name: 'Fire Bolt',
    level: 0,
    isCantrip: true,
    damageType: 'attack',
    damage: '1d10',
    scalingDamage: '1d10', // Cantrips scale at character level
  },
  'eldritch blast': {
    name: 'Eldritch Blast',
    level: 0,
    isCantrip: true,
    damageType: 'attack',
    damage: '1d10',
    scalingDamage: '1d10',
  },
  
  // 1st Level Spells
  'magic missile': {
    name: 'Magic Missile',
    level: 1,
    damageType: 'attack',
    damage: '3*(1d4+1)', // 3 missiles, auto-hit
    scalingDamage: '1*(1d4+1)', // +1 missile per level
  },
  'burning hands': {
    name: 'Burning Hands',
    level: 1,
    damageType: 'save',
    savingThrow: 'dexterity',
    damage: '3d6',
    scalingDamage: '1d6',
    saveForHalf: true,
    targetCount: 3, // Typical number of enemies in cone
  },
  
  // 2nd Level Spells
  'scorching ray': {
    name: 'Scorching Ray',
    level: 2,
    damageType: 'attack',
    damage: '3*(2d6)', // 3 rays
    scalingDamage: '1*(2d6)', // +1 ray per level
  },
  
  // 3rd Level Spells
  'fireball': {
    name: 'Fireball',
    level: 3,
    damageType: 'save',
    savingThrow: 'dexterity',
    damage: '8d6',
    scalingDamage: '1d6',
    saveForHalf: true,
    targetCount: 4, // Typical number of enemies in blast
  },
  
  // Concentration buffs/debuffs
  'hex': {
    name: 'Hex',
    level: 1,
    requiresConcentration: true,
    damage: '1d6', // Extra damage on each hit
    duration: 10, // 1 hour = many rounds
  },
  'hunters mark': {
    name: "Hunter's Mark",
    level: 1,
    requiresConcentration: true,
    damage: '1d6',
    duration: 10,
  },
  'bless': {
    name: 'Bless',
    level: 1,
    requiresConcentration: true,
    damage: '0', // No direct damage, provides +1d4 to attacks
    duration: 10,
  },
};

/**
 * Calculate spell damage for DPR analysis
 */
export function calculateSpellDamage(
  spell: SpellEffect,
  casterLevel: number,
  spellSlotLevel: number,
  target: {
    ac: number;
    saves: Record<string, number>;
  },
  spellAttackBonus: number,
  spellSaveDC: number
): {
  averageDamage: number;
  hitChance?: number;
  saveChance?: number;
} {
  // Parse base damage
  let baseDamage = parseDiceNotation(spell.damage);
  
  // Add scaling damage
  if (spell.scalingDamage && spellSlotLevel > spell.level) {
    const additionalLevels = spellSlotLevel - spell.level;
    const scalingDamage = parseDiceNotation(spell.scalingDamage);
    baseDamage += scalingDamage * additionalLevels;
  }
  
  // Handle cantrip scaling based on character level
  if (spell.isCantrip && spell.scalingDamage) {
    const cantripTier = Math.floor((casterLevel - 1) / 6); // 0-3 tiers
    const scalingDamage = parseDiceNotation(spell.scalingDamage);
    baseDamage += scalingDamage * cantripTier;
  }
  
  // Apply target count for AoE spells
  if (spell.targetCount && spell.targetCount > 1) {
    baseDamage *= spell.targetCount;
  }
  
  if (spell.damageType === 'attack') {
    // Spell attack roll
    const hitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - spellAttackBonus)) / 20));
    return {
      averageDamage: hitChance * baseDamage,
      hitChance,
    };
  } else if (spell.damageType === 'save') {
    // Saving throw spell
    const saveBonus = target.saves[spell.savingThrow!] || 0;
    const saveChance = Math.max(0.05, Math.min(0.95, (saveBonus + 11 - spellSaveDC) / 20));
    
    if (spell.saveForHalf) {
      // Damage on failed save, half on success
      const fullDamage = baseDamage * (1 - saveChance);
      const halfDamage = (baseDamage / 2) * saveChance;
      return {
        averageDamage: fullDamage + halfDamage,
        saveChance,
      };
    } else {
      // All-or-nothing save
      return {
        averageDamage: baseDamage * (1 - saveChance),
        saveChance,
      };
    }
  }
  
  // Default case (concentration effects, etc.)
  return {
    averageDamage: baseDamage,
  };
}

/**
 * Calculate spell save DC for a character
 */
export function calculateSpellSaveDC(build: SimpleBuild, casterLevel: number): number {
  if (!build.abilityScores) return 13; // Default
  
  // Determine primary spellcasting ability
  let spellcastingMod = 0;
  const { intelligence, wisdom, charisma } = build.abilityScores;
  
  // Simple heuristic based on likely classes
  if (build.classLevels) {
    const primaryClass = build.classLevels[0]?.class?.toLowerCase() || 'fighter';
    switch (primaryClass) {
      case 'wizard':
      case 'eldritch knight': // Fighter subclass
        spellcastingMod = Math.floor((intelligence - 10) / 2);
        break;
      case 'cleric':
      case 'druid':
      case 'ranger':
        spellcastingMod = Math.floor((wisdom - 10) / 2);
        break;
      case 'bard':
      case 'sorcerer':
      case 'warlock':
      case 'paladin':
        spellcastingMod = Math.floor((charisma - 10) / 2);
        break;
      default:
        // Use highest mental stat
        spellcastingMod = Math.max(
          Math.floor((intelligence - 10) / 2),
          Math.floor((wisdom - 10) / 2),
          Math.floor((charisma - 10) / 2)
        );
    }
  }
  
  const proficiencyBonus = Math.ceil(casterLevel / 4) + 1;
  return 8 + proficiencyBonus + spellcastingMod;
}

/**
 * Calculate spell attack bonus for a character
 */
export function calculateSpellAttackBonus(build: SimpleBuild, casterLevel: number): number {
  const spellSaveDC = calculateSpellSaveDC(build, casterLevel);
  return spellSaveDC - 8; // Attack bonus = DC - 8
}

/**
 * Parse dice notation into average damage
 */
function parseDiceNotation(notation: string): number {
  try {
    // Handle special cases like "3*(1d4+1)" for Magic Missile
    if (notation.includes('*')) {
      const parts = notation.split('*');
      if (parts.length === 2) {
        const multiplier = parseInt(parts[0]);
        const dicePart = parts[1].replace(/[()]/g, '');
        return multiplier * parseDiceNotation(dicePart);
      }
    }
    
    // Standard dice notation: XdY+Z or XdY-Z
    const match = notation.match(/(\d+)d(\d+)(?:\+(\d+))?(?:\-(\d+))?/);
    if (match) {
      const [, numDice, dieSize, bonus, penalty] = match;
      const diceAverage = parseInt(numDice) * (parseInt(dieSize) + 1) / 2;
      const totalBonus = (parseInt(bonus) || 0) - (parseInt(penalty) || 0);
      return diceAverage + totalBonus;
    }
    
    // Plain numbers
    const plainNumber = parseFloat(notation);
    if (!isNaN(plainNumber)) {
      return plainNumber;
    }
    
    return 0;
  } catch (e) {
    console.warn('Failed to parse dice notation:', notation);
    return 0;
  }
}

/**
 * Get available spells for a character build
 */
export function getAvailableSpells(build: SimpleBuild, characterLevel: number): string[] {
  // For now, return a basic set based on class
  // In the future, this could be more sophisticated
  const spells: string[] = [];
  
  if (!build.classLevels) return spells;
  
  const primaryClass = build.classLevels[0]?.class?.toLowerCase() || '';
  
  // Add cantrips for spellcasting classes
  if (['wizard', 'sorcerer', 'warlock', 'bard', 'cleric', 'druid'].includes(primaryClass)) {
    spells.push('fire bolt');
  }
  
  if (primaryClass === 'warlock') {
    spells.push('eldritch blast');
  }
  
  // Add leveled spells based on class progression
  if (characterLevel >= 1) {
    if (['wizard', 'sorcerer'].includes(primaryClass)) {
      spells.push('magic missile', 'burning hands');
    }
    if (['warlock', 'ranger'].includes(primaryClass)) {
      spells.push('hex', 'hunters mark');
    }
    if (['cleric', 'bard'].includes(primaryClass)) {
      spells.push('bless');
    }
  }
  
  if (characterLevel >= 2) {
    if (['wizard', 'sorcerer', 'warlock'].includes(primaryClass)) {
      spells.push('scorching ray');
    }
  }
  
  if (characterLevel >= 3) {
    if (['wizard', 'sorcerer'].includes(primaryClass)) {
      spells.push('fireball');
    }
  }
  
  return spells;
}
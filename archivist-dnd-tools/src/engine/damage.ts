/**
 * Damage calculation system for D&D 5e
 * Handles dice parsing, damage modifiers, resistance/immunity, and expected values
 */

import type { Target, DamageBreakdown } from '../types/simulation';

// Dice parsing and calculation
export interface ParsedDice {
  count: number;
  sides: number;
  bonus: number;
  damageType: string;
}

export const parseDiceExpression = (expression: string, damageType: string = 'untyped'): ParsedDice => {
  // Handle expressions like "1d8+3", "2d6", "1d4+1", "4"
  const match = expression.trim().match(/^(\d+)?(?:d(\d+))?(?:\+(\d+))?$/);
  
  if (!match) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  const [, count, sides, bonus] = match;
  
  // Handle flat numbers like "4"
  if (!sides) {
    return {
      count: 0,
      sides: 0,
      bonus: parseInt(count || '0', 10),
      damageType,
    };
  }

  return {
    count: parseInt(count || '1', 10),
    sides: parseInt(sides, 10),
    bonus: parseInt(bonus || '0', 10),
    damageType,
  };
};

// Calculate expected damage from dice
export const getExpectedDamage = (dice: ParsedDice): number => {
  if (dice.count === 0) return dice.bonus;
  const diceExpectation = dice.count * (dice.sides + 1) / 2;
  return diceExpectation + dice.bonus;
};

// Calculate minimum possible damage
export const getMinimumDamage = (dice: ParsedDice): number => {
  return Math.max(0, dice.count + dice.bonus);
};

// Calculate maximum possible damage
export const getMaximumDamage = (dice: ParsedDice): number => {
  return dice.count * dice.sides + dice.bonus;
};

// Apply Great Weapon Fighting rerolls
export const applyGWFReroll = (dice: ParsedDice): number => {
  if (dice.count === 0) return dice.bonus;
  
  let expectedDamage = dice.bonus;
  
  for (let i = 0; i < dice.count; i++) {
    if (dice.sides <= 2) {
      // For d2 or smaller, GWF has no effect
      expectedDamage += (dice.sides + 1) / 2;
    } else {
      // Reroll 1s and 2s once
      const normalAverage = (dice.sides + 1) / 2;
      const rerollProb = 2 / dice.sides;
      const keepProb = 1 - rerollProb;
      
      // E[damage] = P(keep) * E[original] + P(reroll) * E[reroll result]
      // Where E[reroll result] includes the possibility of getting another 1 or 2
      const rerollAverage = (dice.sides + 1) / 2; // Same expected value on reroll
      expectedDamage += keepProb * normalAverage + rerollProb * rerollAverage;
    }
  }
  
  return expectedDamage;
};

// Apply Elemental Adept (1s become 2s)
export const applyElementalAdept = (dice: ParsedDice): number => {
  if (dice.count === 0) return dice.bonus;
  
  // For each die, instead of 1,2,3,...,n outcomes, we have 2,2,3,...,n
  const originalSum = dice.sides * (dice.sides + 1) / 2; // Sum of 1+2+...+n
  const modifiedSum = originalSum - 1 + 2; // Replace 1 with 2
  const modifiedAverage = modifiedSum / dice.sides;
  
  return dice.count * modifiedAverage + dice.bonus;
};

// Apply damage resistances, immunities, and vulnerabilities
export const applyDamageResistances = (damage: number, damageType: string, target: Target): number => {
  const lowerType = damageType.toLowerCase();
  
  if (target.immunities.includes(lowerType)) {
    return 0;
  }
  
  if (target.resistances.includes(lowerType)) {
    return Math.floor(damage / 2);
  }
  
  if (target.vulnerabilities.includes(lowerType)) {
    return damage * 2;
  }
  
  return damage;
};

// Damage source tracking
export interface DamageSource {
  name: string;
  dice: ParsedDice;
  source: string; // 'weapon', 'spell', 'feat', 'feature', etc.
  onCritDouble?: boolean; // Whether this damage is doubled on crit
  rerollMechanic?: 'gwf' | 'elemental-adept' | 'brutal-critical' | 'none';
}

// Calculate damage from multiple sources
export const calculateTotalDamage = (
  sources: DamageSource[],
  isCrit: boolean = false,
  target?: Target
): DamageBreakdown => {
  const breakdown: DamageBreakdown = {
    base: [],
    modifiers: [],
    total: {
      dice: '',
      bonus: 0,
      expected: 0,
      byType: {},
    },
    afterResistances: {
      expected: 0,
      byType: {},
    },
  };

  let totalExpected = 0;
  const damageByType: Record<string, number> = {};
  const resistedDamageByType: Record<string, number> = {};

  for (const source of sources) {
    let damage = 0;
    let dice = source.dice;
    
    // Apply crit doubling for applicable sources
    if (isCrit && source.onCritDouble) {
      dice = { ...dice, count: dice.count * 2 };
    }
    
    // Apply reroll mechanics
    switch (source.rerollMechanic) {
      case 'gwf':
        damage = applyGWFReroll(dice);
        break;
      case 'elemental-adept':
        damage = applyElementalAdept(dice);
        break;
      default:
        damage = getExpectedDamage(dice);
    }
    
    // Track base damage
    breakdown.base.push({
      dice: formatDiceExpression(dice),
      bonus: dice.bonus,
      type: dice.damageType,
      source: source.name,
      expected: damage,
    });
    
    totalExpected += damage;
    damageByType[dice.damageType] = (damageByType[dice.damageType] || 0) + damage;
    
    // Apply resistances if target is provided
    if (target) {
      const resistedDamage = applyDamageResistances(damage, dice.damageType, target);
      resistedDamageByType[dice.damageType] = (resistedDamageByType[dice.damageType] || 0) + resistedDamage;
    }
  }
  
  breakdown.total = {
    dice: sources.map(s => formatDiceExpression(s.dice)).join(' + '),
    bonus: sources.reduce((sum, s) => sum + s.dice.bonus, 0),
    expected: totalExpected,
    byType: damageByType,
  };
  
  if (target) {
    const totalResisted = Object.values(resistedDamageByType).reduce((sum, dmg) => sum + dmg, 0);
    breakdown.afterResistances = {
      expected: totalResisted,
      byType: resistedDamageByType,
    };
  } else {
    breakdown.afterResistances = {
      expected: totalExpected,
      byType: damageByType,
    };
  }
  
  return breakdown;
};

// Format dice expression for display
export const formatDiceExpression = (dice: ParsedDice): string => {
  if (dice.count === 0) {
    return dice.bonus.toString();
  }
  
  let result = `${dice.count}d${dice.sides}`;
  if (dice.bonus > 0) {
    result += `+${dice.bonus}`;
  } else if (dice.bonus < 0) {
    result += dice.bonus.toString();
  }
  
  return result;
};

// Weapon damage calculation helpers
export const getWeaponDamage = (
  weaponDice: string,
  abilityMod: number,
  damageType: string = 'slashing',
  magicBonus: number = 0
): DamageSource => {
  const dice = parseDiceExpression(weaponDice, damageType);
  dice.bonus += abilityMod + magicBonus;
  
  return {
    name: 'Weapon',
    dice,
    source: 'weapon',
    onCritDouble: true,
    rerollMechanic: 'none',
  };
};

// Spell damage calculation helpers
export const getSpellDamage = (
  spellDice: string,
  damageType: string,
  spellLevel: number,
  baseLevel: number = 1,
  upcastDice?: string
): DamageSource => {
  let dice = parseDiceExpression(spellDice, damageType);
  
  // Handle upcasting
  if (spellLevel > baseLevel && upcastDice) {
    const upcast = parseDiceExpression(upcastDice, damageType);
    const levelDifference = spellLevel - baseLevel;
    dice.count += upcast.count * levelDifference;
    dice.bonus += upcast.bonus * levelDifference;
  }
  
  return {
    name: 'Spell',
    dice,
    source: 'spell',
    onCritDouble: false, // Most spells don't double on crit
    rerollMechanic: 'none',
  };
};

// Feature damage (like Sneak Attack, Divine Smite)
export const getFeatureDamage = (
  featureDice: string,
  damageType: string,
  featureName: string,
  onCritDouble: boolean = false
): DamageSource => {
  const dice = parseDiceExpression(featureDice, damageType);
  
  return {
    name: featureName,
    dice,
    source: 'feature',
    onCritDouble,
    rerollMechanic: 'none',
  };
};

// Calculate expected DPR from attack sequence
export interface AttackSequence {
  hitProbability: number;
  critProbability: number;
  normalDamage: DamageSource[];
  critDamage?: DamageSource[]; // Additional damage on crit
  numAttacks: number;
}

export const calculateDPR = (sequence: AttackSequence, target?: Target): number => {
  const { hitProbability, critProbability, normalDamage, critDamage = [], numAttacks } = sequence;
  
  // Calculate normal hit damage
  const normalBreakdown = calculateTotalDamage(normalDamage, false, target);
  const normalDmg = normalBreakdown.afterResistances.expected;
  
  // Calculate crit damage (includes normal damage doubled + extra crit damage)
  const allCritDamage = [...normalDamage, ...critDamage];
  const critBreakdown = calculateTotalDamage(allCritDamage, true, target);
  const critDmg = critBreakdown.afterResistances.expected;
  
  // Expected damage per attack
  const normalHitProb = hitProbability - critProbability;
  const expectedDamagePerAttack = normalHitProb * normalDmg + critProbability * critDmg;
  
  return expectedDamagePerAttack * numAttacks;
};

// Savage Attacker feat calculation (reroll damage dice once per turn)
export const applySavageAttacker = (damages: DamageSource[]): DamageSource[] => {
  // Find the weapon damage and apply reroll to it
  return damages.map(source => {
    if (source.source === 'weapon') {
      // Reroll all weapon damage dice once, keep higher
      const originalExpected = getExpectedDamage(source.dice);
      
      // For rerolling and keeping higher, the expected value increases
      // This is a simplified approximation
      const rerollBonus = source.dice.count * 0.5; // Rough estimate
      
      return {
        ...source,
        dice: {
          ...source.dice,
          bonus: source.dice.bonus + rerollBonus,
        },
      };
    }
    return source;
  });
};

// Brutal Critical extra dice
export const applyBrutalCritical = (
  weaponDamage: DamageSource,
  extraDice: number
): DamageSource[] => {
  const brutaCritDamage: DamageSource = {
    name: 'Brutal Critical',
    dice: {
      count: extraDice,
      sides: weaponDamage.dice.sides,
      bonus: 0,
      damageType: weaponDamage.dice.damageType,
    },
    source: 'feature',
    onCritDouble: false, // Brutal critical dice are not doubled again
    rerollMechanic: weaponDamage.rerollMechanic,
  };
  
  return [brutaCritDamage];
};
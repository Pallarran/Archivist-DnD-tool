/**
 * Power Attack calculations for Sharpshooter and Great Weapon Master
 * Determines optimal usage based on expected value comparisons
 */

import { getHitProbability, getAdvantageHitProbability, getDisadvantageHitProbability, getElvenAccuracyHitProbability, getCritProbability, getAdvantageCritProbability, getDisadvantageCritProbability, getElvenAccuracyCritProbability } from './probability';
import { calculateDPR, type AttackSequence } from './damage';
import type { Target } from '../types';

export interface PowerAttackAnalysis {
  normalDPR: number;
  powerAttackDPR: number;
  expectedValueDelta: number;
  shouldUsePowerAttack: boolean;
  breakEvenAC: number;
  threshold: number;
}

export interface PowerAttackOptions {
  attackBonus: number;
  targetAC: number;
  attackSequence: AttackSequence;
  advantageState?: 'normal' | 'advantage' | 'disadvantage' | 'elven-accuracy';
  threshold?: number; // EV threshold for power attack usage
  target?: Target;
}

// Calculate hit probability based on advantage state
const getHitProbabilityForState = (
  attackBonus: number, 
  targetAC: number, 
  advantageState: string
): number => {
  switch (advantageState) {
    case 'advantage':
      return getAdvantageHitProbability(attackBonus, targetAC);
    case 'disadvantage':
      return getDisadvantageHitProbability(attackBonus, targetAC);
    case 'elven-accuracy':
      return getElvenAccuracyHitProbability(attackBonus, targetAC);
    default:
      return getHitProbability(attackBonus, targetAC);
  }
};

// Calculate crit probability based on advantage state
const getCritProbabilityForState = (
  critRange: number, 
  advantageState: string
): number => {
  switch (advantageState) {
    case 'advantage':
      return getAdvantageCritProbability(critRange);
    case 'disadvantage':
      return getDisadvantageCritProbability(critRange);
    case 'elven-accuracy':
      return getElvenAccuracyCritProbability(critRange);
    default:
      return getCritProbability(critRange);
  }
};

// Calculate expected damage with and without power attack
export const analyzePowerAttack = (options: PowerAttackOptions): PowerAttackAnalysis => {
  const {
    attackBonus,
    targetAC,
    attackSequence,
    advantageState = 'normal',
    threshold = 0.5,
    target,
  } = options;

  // Normal attack calculations
  const normalHitProb = getHitProbabilityForState(attackBonus, targetAC, advantageState);
  const normalCritProb = getCritProbabilityForState(20, advantageState); // Default crit range
  
  const normalSequence: AttackSequence = {
    ...attackSequence,
    hitProbability: normalHitProb,
    critProbability: normalCritProb,
  };
  
  const normalDPR = calculateDPR(normalSequence, target);

  // Power attack calculations (-5 attack, +10 damage)
  const powerAttackBonus = attackBonus - 5;
  const powerAttackHitProb = getHitProbabilityForState(powerAttackBonus, targetAC, advantageState);
  const powerAttackCritProb = getCritProbabilityForState(20, advantageState);
  
  // Add +10 damage to all weapon attacks
  const powerAttackDamage = attackSequence.normalDamage.map(source => {
    if (source.source === 'weapon') {
      return {
        ...source,
        dice: {
          ...source.dice,
          bonus: source.dice.bonus + 10,
        },
      };
    }
    return source;
  });
  
  const powerAttackSequence: AttackSequence = {
    ...attackSequence,
    hitProbability: powerAttackHitProb,
    critProbability: powerAttackCritProb,
    normalDamage: powerAttackDamage,
  };
  
  const powerAttackDPR = calculateDPR(powerAttackSequence, target);

  // Analysis results
  const expectedValueDelta = powerAttackDPR - normalDPR;
  const shouldUsePowerAttack = expectedValueDelta >= threshold;

  // Calculate break-even AC
  const breakEvenAC = calculateBreakEvenAC({
    attackBonus,
    attackSequence,
    advantageState,
    target,
  });

  return {
    normalDPR,
    powerAttackDPR,
    expectedValueDelta,
    shouldUsePowerAttack,
    breakEvenAC,
    threshold,
  };
};

// Calculate the AC where power attack and normal attack have equal expected value
export const calculateBreakEvenAC = (options: {
  attackBonus: number;
  attackSequence: AttackSequence;
  advantageState?: string;
  target?: Target;
}): number => {
  const { attackBonus, attackSequence, advantageState = 'normal', target } = options;

  // Binary search for break-even AC
  let lowAC = 5;
  let highAC = 30;
  let bestAC = 15;
  let bestDelta = Infinity;

  for (let iterations = 0; iterations < 50; iterations++) {
    const testAC = Math.floor((lowAC + highAC) / 2);
    
    const analysis = analyzePowerAttack({
      attackBonus,
      targetAC: testAC,
      attackSequence,
      advantageState: advantageState as any,
      threshold: 0,
      target,
    });

    const delta = Math.abs(analysis.expectedValueDelta);
    
    if (delta < bestDelta) {
      bestDelta = delta;
      bestAC = testAC;
    }

    if (analysis.expectedValueDelta > 0) {
      // Power attack is better, try higher AC
      lowAC = testAC + 1;
    } else {
      // Normal attack is better, try lower AC
      highAC = testAC - 1;
    }

    if (lowAC >= highAC) break;
  }

  return bestAC;
};

// Generate power attack recommendations across AC range
export const generatePowerAttackRecommendations = (options: {
  attackBonus: number;
  attackSequence: AttackSequence;
  advantageState?: string;
  target?: Target;
  acRange?: [number, number];
}): Array<{
  ac: number;
  normalDPR: number;
  powerAttackDPR: number;
  recommended: boolean;
  advantage: number;
}> => {
  const {
    attackBonus,
    attackSequence,
    advantageState = 'normal',
    target,
    acRange = [10, 25],
  } = options;

  const recommendations = [];
  const [minAC, maxAC] = acRange;

  for (let ac = minAC; ac <= maxAC; ac++) {
    const analysis = analyzePowerAttack({
      attackBonus,
      targetAC: ac,
      attackSequence,
      advantageState: advantageState as any,
      threshold: 0,
      target,
    });

    recommendations.push({
      ac,
      normalDPR: analysis.normalDPR,
      powerAttackDPR: analysis.powerAttackDPR,
      recommended: analysis.shouldUsePowerAttack,
      advantage: analysis.expectedValueDelta,
    });
  }

  return recommendations;
};

// Analyze power attack across different advantage states
export const analyzeAdvantageStates = (options: {
  attackBonus: number;
  targetAC: number;
  attackSequence: AttackSequence;
  target?: Target;
}) => {
  const { attackBonus, targetAC, attackSequence, target } = options;
  
  const states = ['normal', 'advantage', 'disadvantage', 'elven-accuracy'] as const;
  const results: Record<string, PowerAttackAnalysis> = {};

  for (const state of states) {
    results[state] = analyzePowerAttack({
      attackBonus,
      targetAC,
      attackSequence,
      advantageState: state,
      target,
    });
  }

  return results;
};

// Calculate power attack value with different buffs
export const analyzePowerAttackWithBuffs = (options: {
  baseAttackBonus: number;
  targetAC: number;
  attackSequence: AttackSequence;
  buffs?: Array<{
    name: string;
    attackBonus: number;
    damageBonus?: number;
  }>;
  target?: Target;
}) => {
  const { baseAttackBonus, targetAC, attackSequence, buffs = [], target } = options;

  const buffCombinations = [
    { name: 'No Buffs', totalAttackBonus: 0, totalDamageBonus: 0 },
    ...buffs.map(buff => ({
      name: buff.name,
      totalAttackBonus: buff.attackBonus,
      totalDamageBonus: buff.damageBonus || 0,
    })),
  ];

  // Generate all combinations of buffs
  const allCombinations = [];
  for (let i = 0; i < Math.pow(2, buffs.length); i++) {
    const combination = {
      name: '',
      totalAttackBonus: 0,
      totalDamageBonus: 0,
    };

    let names = [];
    for (let j = 0; j < buffs.length; j++) {
      if (i & (1 << j)) {
        const buff = buffs[j];
        names.push(buff.name);
        combination.totalAttackBonus += buff.attackBonus;
        combination.totalDamageBonus += buff.damageBonus || 0;
      }
    }

    combination.name = names.length > 0 ? names.join(' + ') : 'No Buffs';
    allCombinations.push(combination);
  }

  return allCombinations.map(combo => {
    const effectiveAttackBonus = baseAttackBonus + combo.totalAttackBonus;
    
    // Apply damage bonus to weapon attacks
    const buffedSequence = {
      ...attackSequence,
      normalDamage: attackSequence.normalDamage.map(source => {
        if (source.source === 'weapon') {
          return {
            ...source,
            dice: {
              ...source.dice,
              bonus: source.dice.bonus + combo.totalDamageBonus,
            },
          };
        }
        return source;
      }),
    };

    const analysis = analyzePowerAttack({
      attackBonus: effectiveAttackBonus,
      targetAC,
      attackSequence: buffedSequence,
      target,
    });

    return {
      buffCombination: combo.name,
      attackBonus: effectiveAttackBonus,
      analysis,
      recommendation: analysis.shouldUsePowerAttack 
        ? `Use power attack (AC ≤ ${analysis.breakEvenAC})`
        : `Don't use power attack (AC ≥ ${analysis.breakEvenAC + 1})`,
    };
  });
};

// Helper function to format power attack advice
export const formatPowerAttackAdvice = (analysis: PowerAttackAnalysis): string => {
  if (analysis.shouldUsePowerAttack) {
    return `✓ Use Power Attack (+${analysis.expectedValueDelta.toFixed(1)} DPR)`;
  } else {
    return `✗ Don't Use Power Attack (${analysis.expectedValueDelta.toFixed(1)} DPR)`;
  }
};

// Get power attack threshold recommendations
export const getPowerAttackThresholds = (options: {
  attackBonus: number;
  attackSequence: AttackSequence;
  target?: Target;
}) => {
  const { attackBonus, attackSequence, target } = options;
  
  const advantageStates = [
    { name: 'Normal', state: 'normal' as const },
    { name: 'Advantage', state: 'advantage' as const },
    { name: 'Disadvantage', state: 'disadvantage' as const },
    { name: 'Elven Accuracy', state: 'elven-accuracy' as const },
  ];

  return advantageStates.map(({ name, state }) => {
    const breakEvenAC = calculateBreakEvenAC({
      attackBonus,
      attackSequence,
      advantageState: state,
      target,
    });

    return {
      condition: name,
      breakEvenAC,
      recommendation: `Use power attack when target AC ≤ ${breakEvenAC}`,
    };
  });
};
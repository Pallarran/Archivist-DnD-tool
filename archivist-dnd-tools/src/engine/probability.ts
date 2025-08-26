/**
 * Core probability calculations for D&D 5e combat mechanics
 * All functions return deterministic mathematical results, not random outcomes
 */

// Basic probability functions
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

// Calculate hit probability for a single d20 roll
export const getHitProbability = (attackBonus: number, targetAC: number): number => {
  // Need to roll targetAC - attackBonus or higher on d20
  const requiredRoll = clamp(targetAC - attackBonus, 1, 20);
  
  if (requiredRoll <= 1) return 0.95; // Auto-hit except on nat 1
  if (requiredRoll >= 20) return 0.05; // Auto-miss except on nat 20
  
  return (21 - requiredRoll) / 20;
};

// Calculate crit probability for a single d20 roll
export const getCritProbability = (critRange: number = 20): number => {
  // critRange is the minimum value that crits (20 = crits on 20, 19 = crits on 19-20, etc.)
  const critRangeSize = 21 - critRange;
  return clamp(critRangeSize / 20, 0, 1);
};

// Advantage/Disadvantage calculations
export const getAdvantageHitProbability = (attackBonus: number, targetAC: number): number => {
  const baseProb = getHitProbability(attackBonus, targetAC);
  // P(hit with advantage) = 1 - P(miss)²
  return 1 - Math.pow(1 - baseProb, 2);
};

export const getDisadvantageHitProbability = (attackBonus: number, targetAC: number): number => {
  const baseProb = getHitProbability(attackBonus, targetAC);
  // P(hit with disadvantage) = P(hit)²
  return Math.pow(baseProb, 2);
};

export const getAdvantageCritProbability = (critRange: number = 20): number => {
  const baseProb = getCritProbability(critRange);
  // P(crit with advantage) = 1 - P(not crit)²
  return 1 - Math.pow(1 - baseProb, 2);
};

export const getDisadvantageCritProbability = (critRange: number = 20): number => {
  const baseProb = getCritProbability(critRange);
  // P(crit with disadvantage) = P(crit)²
  return Math.pow(baseProb, 2);
};

// Elven Accuracy (roll 3 dice, take highest when you have advantage)
export const getElvenAccuracyHitProbability = (attackBonus: number, targetAC: number): number => {
  const baseProb = getHitProbability(attackBonus, targetAC);
  // P(hit with elven accuracy) = 1 - P(miss)³
  return 1 - Math.pow(1 - baseProb, 3);
};

export const getElvenAccuracyCritProbability = (critRange: number = 20): number => {
  const baseProb = getCritProbability(critRange);
  // P(crit with elven accuracy) = 1 - P(not crit)³
  return 1 - Math.pow(1 - baseProb, 3);
};

// Halfling Luck (reroll 1s on d20)
export const getHalflingLuckHitProbability = (attackBonus: number, targetAC: number): number => {
  const requiredRoll = clamp(targetAC - attackBonus, 1, 20);
  
  if (requiredRoll <= 1) return 0.95; // Auto-hit except on rerolled 1
  if (requiredRoll >= 20) return 0.05; // Auto-miss except on nat 20
  
  // If we need to roll >= 2, then rolling a 1 gets rerolled
  if (requiredRoll >= 2) {
    const baseSuccessChance = (21 - requiredRoll) / 20;
    const rerollSuccessChance = (21 - requiredRoll) / 20; // Same chance on reroll
    // P(success) = P(success on first) + P(roll 1) * P(success on reroll)
    return baseSuccessChance + (1/20) * rerollSuccessChance;
  }
  
  return (21 - requiredRoll) / 20;
};

// Bonus dice (Bless, Bardic Inspiration, etc.)
export const getBonusDiceExpectation = (diceExpression: string): number => {
  // Parse dice expressions like "1d4", "2d6", etc.
  const match = diceExpression.match(/^([+-]?)(\d+)d(\d+)(?:\+(\d+))?$/);
  if (!match) return 0;
  
  const [, sign, count, sides, bonus] = match;
  const multiplier = sign === '-' ? -1 : 1;
  const diceCount = parseInt(count, 10);
  const diceSides = parseInt(sides, 10);
  const fixedBonus = parseInt(bonus || '0', 10);
  
  const diceExpectation = diceCount * (diceSides + 1) / 2;
  return multiplier * (diceExpectation + fixedBonus);
};

// Combine multiple bonus dice
export const getCombinedBonusExpectation = (bonusDice: string[]): number => {
  return bonusDice.reduce((sum, dice) => sum + getBonusDiceExpectation(dice), 0);
};

// Modified attack bonus with bonus dice
export const getEffectiveAttackBonus = (baseAttackBonus: number, bonusDice: string[]): number => {
  return baseAttackBonus + getCombinedBonusExpectation(bonusDice);
};

// Probability of hitting at least once in multiple attacks
export const getMultiAttackHitProbability = (
  singleAttackHitProb: number, 
  numAttacks: number
): number => {
  if (numAttacks <= 0) return 0;
  if (numAttacks === 1) return singleAttackHitProb;
  
  // P(at least one hit) = 1 - P(all miss)
  return 1 - Math.pow(1 - singleAttackHitProb, numAttacks);
};

// Probability of critting at least once in multiple attacks
export const getMultiAttackCritProbability = (
  singleAttackCritProb: number, 
  numAttacks: number
): number => {
  if (numAttacks <= 0) return 0;
  if (numAttacks === 1) return singleAttackCritProb;
  
  // P(at least one crit) = 1 - P(no crits)
  return 1 - Math.pow(1 - singleAttackCritProb, numAttacks);
};

// Expected number of hits in multiple attacks
export const getExpectedHits = (singleAttackHitProb: number, numAttacks: number): number => {
  return singleAttackHitProb * numAttacks;
};

// Expected number of crits in multiple attacks
export const getExpectedCrits = (singleAttackCritProb: number, numAttacks: number): number => {
  return singleAttackCritProb * numAttacks;
};

// Save-based spell probabilities
export const getSaveFailureProbability = (spellDC: number, saveBonus: number): number => {
  // Need to roll spellDC - saveBonus or higher on d20
  const requiredRoll = clamp(spellDC - saveBonus, 1, 20);
  
  if (requiredRoll <= 1) return 0.05; // Only fail on nat 1
  if (requiredRoll >= 20) return 0.95; // Only succeed on nat 20
  
  return (21 - requiredRoll) / 20;
};

export const getSaveSuccessProbability = (spellDC: number, saveBonus: number): number => {
  return 1 - getSaveFailureProbability(spellDC, saveBonus);
};

// Legendary Resistance calculations
export const getLegendaryResistanceAdjustedSaveProb = (
  baseSaveFailProb: number,
  legendaryResistances: number,
  encounterSpells: number
): number => {
  if (legendaryResistances <= 0) return baseSaveFailProb;
  if (encounterSpells <= legendaryResistances) return 0; // All saves auto-succeed
  
  // Simplified model: first N saves auto-succeed, then normal probability
  const normalSaves = encounterSpells - legendaryResistances;
  const totalSaveAttempts = encounterSpells;
  
  return (normalSaves * baseSaveFailProb) / totalSaveAttempts;
};

// Magic Resistance (advantage on saves against spells)
export const getMagicResistanceSaveProb = (spellDC: number, saveBonus: number): number => {
  const baseFailProb = getSaveFailureProbability(spellDC, saveBonus);
  // With advantage, P(fail) = P(fail)²
  const magicResistanceFailProb = Math.pow(baseFailProb, 2);
  return 1 - magicResistanceFailProb;
};

// Great Weapon Fighting reroll calculation
export const getGWFRerollExpectation = (diceSides: number): number => {
  if (diceSides < 2) return 0;
  
  // On a d6: normally 3.5 average
  // With GWF: reroll 1s and 2s once
  // P(1 or 2) = 2/diceSides
  // Expected value when rerolling = average of all outcomes = (diceSides + 1) / 2
  
  const normalExpectation = (diceSides + 1) / 2;
  const rerollProb = 2 / diceSides;
  const rerollExpectation = normalExpectation; // Same average on reroll
  
  // E[damage] = E[keep original] + E[reroll and keep]
  return (1 - rerollProb) * normalExpectation + rerollProb * rerollExpectation;
};

// Elemental Adept reroll calculation (treat 1s as 2s)
export const getElementalAdeptExpectation = (diceSides: number): number => {
  if (diceSides < 2) return 0;
  
  // Instead of getting 1, you get 2
  // So outcomes are: 2, 2, 3, 4, 5, 6 for a d6
  const normalSum = (diceSides * (diceSides + 1)) / 2; // 1+2+3+4+5+6 = 21 for d6
  const adjustedSum = normalSum - 1 + 2; // Replace the single 1 with 2
  
  return adjustedSum / diceSides;
};

export interface ProbabilityCalculation {
  hitProbability: number;
  critProbability: number;
  effectiveAttackBonus: number;
  bonusDiceExpectation: number;
  multiAttackHitProb?: number;
  multiAttackCritProb?: number;
  expectedHits?: number;
  expectedCrits?: number;
}

// Master function to calculate all probabilities for an attack sequence
export const calculateAttackProbabilities = (params: {
  attackBonus: number;
  targetAC: number;
  critRange?: number;
  advantageState?: 'normal' | 'advantage' | 'disadvantage' | 'elven-accuracy';
  bonusDice?: string[];
  halflingLuck?: boolean;
  numAttacks?: number;
}): ProbabilityCalculation => {
  const {
    attackBonus,
    targetAC,
    critRange = 20,
    advantageState = 'normal',
    bonusDice = [],
    halflingLuck = false,
    numAttacks = 1,
  } = params;

  const bonusDiceExpectation = getCombinedBonusExpectation(bonusDice);
  const effectiveAttackBonus = attackBonus + bonusDiceExpectation;

  let hitProbability: number;
  let critProbability: number;

  if (halflingLuck) {
    hitProbability = getHalflingLuckHitProbability(effectiveAttackBonus, targetAC);
    critProbability = getCritProbability(critRange); // Halfling luck doesn't affect crits much
  } else {
    switch (advantageState) {
      case 'advantage':
        hitProbability = getAdvantageHitProbability(effectiveAttackBonus, targetAC);
        critProbability = getAdvantageCritProbability(critRange);
        break;
      case 'disadvantage':
        hitProbability = getDisadvantageHitProbability(effectiveAttackBonus, targetAC);
        critProbability = getDisadvantageCritProbability(critRange);
        break;
      case 'elven-accuracy':
        hitProbability = getElvenAccuracyHitProbability(effectiveAttackBonus, targetAC);
        critProbability = getElvenAccuracyCritProbability(critRange);
        break;
      default:
        hitProbability = getHitProbability(effectiveAttackBonus, targetAC);
        critProbability = getCritProbability(critRange);
    }
  }

  const result: ProbabilityCalculation = {
    hitProbability,
    critProbability,
    effectiveAttackBonus,
    bonusDiceExpectation,
  };

  if (numAttacks > 1) {
    result.multiAttackHitProb = getMultiAttackHitProbability(hitProbability, numAttacks);
    result.multiAttackCritProb = getMultiAttackCritProbability(critProbability, numAttacks);
    result.expectedHits = getExpectedHits(hitProbability, numAttacks);
    result.expectedCrits = getExpectedCrits(critProbability, numAttacks);
  }

  return result;
};
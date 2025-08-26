/**
 * Once-per-turn effect logic and priority system
 * Handles features like Sneak Attack, Colossus Slayer, Divine Smite policy, etc.
 */

import type { Build, Target, CombatContext } from '../types';
import type { DamageSource } from './damage';
import { calculateAttackProbabilities } from './probability';

export interface OncePerTurnEffect {
  id: string;
  name: string;
  priority: number; // Higher number = higher priority
  condition: (context: OncePerTurnContext) => boolean;
  damage: DamageSource;
  resourceCost?: {
    type: string;
    amount: number;
  };
  description: string;
}

export interface OncePerTurnContext {
  build: Build;
  target: Target;
  combat: CombatContext;
  attackNumber: number; // Which attack in the sequence (0-indexed)
  hitProbability: number;
  critProbability: number;
  weapon?: string;
  isMainAction: boolean;
  availableResources: Record<string, number>;
}

export interface OncePerTurnResult {
  effect: OncePerTurnEffect;
  applied: boolean;
  reason: string;
  expectedDamage: number;
  resourcesUsed: Record<string, number>;
}

export interface OncePerTurnAnalysis {
  availableEffects: OncePerTurnEffect[];
  selectedEffect?: OncePerTurnEffect;
  allResults: OncePerTurnResult[];
  totalExpectedDamage: number;
  optimalAttackIndex: number;
  reasoning: string;
}

// Define common once-per-turn effects
export const getOncePerTurnEffects = (build: Build): OncePerTurnEffect[] => {
  const effects: OncePerTurnEffect[] = [];
  
  // Sneak Attack
  const rogueLevel = build.levels.find(l => l.class.toLowerCase() === 'rogue')?.level || 0;
  if (rogueLevel > 0) {
    const sneakDice = Math.ceil(rogueLevel / 2);
    effects.push({
      id: 'sneak-attack',
      name: 'Sneak Attack',
      priority: 100,
      condition: (context) => {
        return (
          context.combat.advantage === 'advantage' ||
          (context.weapon && 
           (build.equipment.mainHand?.properties.includes('finesse') ||
            build.equipment.mainHand?.properties.includes('ranged')))
        );
      },
      damage: {
        name: 'Sneak Attack',
        dice: {
          count: sneakDice,
          sides: 6,
          bonus: 0,
          damageType: 'piercing',
        },
        source: 'feature',
        onCritDouble: true,
        rerollMechanic: 'none',
      },
      description: `${sneakDice}d6 damage once per turn with advantage or finesse/ranged weapon`,
    });
  }

  // Divine Smite (policy-controlled)
  const paladinLevel = build.levels.find(l => l.class.toLowerCase() === 'paladin')?.level || 0;
  if (paladinLevel >= 2) {
    effects.push({
      id: 'divine-smite',
      name: 'Divine Smite',
      priority: 80,
      condition: (context) => {
        const policy = build.policies.smitePolicy;
        if (policy === 'never') return false;
        if (policy === 'onCrit' && context.critProbability < 0.05) return false;
        
        // Check if we have spell slots available
        const hasSlots = Object.values(context.availableResources)
          .some(amount => amount > 0);
        
        return hasSlots && !build.equipment.mainHand?.properties.includes('ranged');
      },
      damage: {
        name: 'Divine Smite',
        dice: {
          count: 2,
          sides: 8,
          bonus: 0,
          damageType: 'radiant',
        },
        source: 'feature',
        onCritDouble: true,
        rerollMechanic: 'none',
      },
      resourceCost: {
        type: 'spellSlot',
        amount: 1,
      },
      description: '2d8 radiant damage, requires spell slot and melee weapon',
    });
  }

  // Colossus Slayer (Hunter Ranger)
  const rangerLevel = build.levels.find(l => l.class.toLowerCase() === 'ranger')?.level || 0;
  const hasColossusSlayer = build.features.includes('Colossus Slayer');
  if (rangerLevel >= 3 && hasColossusSlayer) {
    effects.push({
      id: 'colossus-slayer',
      name: 'Colossus Slayer',
      priority: 50,
      condition: () => true, // Assumes target is below max HP
      damage: {
        name: 'Colossus Slayer',
        dice: {
          count: 1,
          sides: 8,
          bonus: 0,
          damageType: 'weapon', // Same as weapon damage type
        },
        source: 'feature',
        onCritDouble: false,
        rerollMechanic: 'none',
      },
      description: '1d8 damage if target is below maximum hit points',
    });
  }

  // Hunter's Mark (if precast)
  if (build.policies.precast.includes('Hunter\'s Mark') || build.policies.precast.includes('Hex')) {
    effects.push({
      id: 'hunters-mark',
      name: 'Hunter\'s Mark',
      priority: 30,
      condition: () => true,
      damage: {
        name: 'Hunter\'s Mark',
        dice: {
          count: 1,
          sides: 6,
          bonus: 0,
          damageType: 'force',
        },
        source: 'spell',
        onCritDouble: false,
        rerollMechanic: 'none',
      },
      description: '1d6 damage per weapon attack (concentration spell)',
    });
  }

  return effects.sort((a, b) => b.priority - a.priority);
};

// Determine which once-per-turn effect to use
export const analyzeOncePerTurnEffects = (
  build: Build,
  target: Target,
  combat: CombatContext,
  numAttacks: number
): OncePerTurnAnalysis => {
  const availableEffects = getOncePerTurnEffects(build);
  const availableResources = getAvailableResources(build);
  
  const results: OncePerTurnResult[] = [];
  let bestEffect: OncePerTurnEffect | undefined;
  let bestExpectedDamage = 0;
  let bestAttackIndex = 0;

  // Analyze each possible attack for each effect
  for (const effect of availableEffects) {
    for (let attackIndex = 0; attackIndex < numAttacks; attackIndex++) {
      const context: OncePerTurnContext = {
        build,
        target,
        combat,
        attackNumber: attackIndex,
        hitProbability: 0.65, // Default, would be calculated based on build
        critProbability: 0.05, // Default, would be calculated based on build
        isMainAction: true,
        availableResources,
      };

      // Calculate hit/crit probabilities for this attack
      const attackBonus = getAttackBonus(build);
      const probabilities = calculateAttackProbabilities({
        attackBonus,
        targetAC: target.armorClass,
        advantageState: combat.advantage,
      });
      
      context.hitProbability = probabilities.hitProbability;
      context.critProbability = probabilities.critProbability;

      const canUse = effect.condition(context);
      const expectedDamage = canUse ? 
        calculateExpectedEffectDamage(effect, context) : 0;

      const result: OncePerTurnResult = {
        effect,
        applied: canUse,
        reason: canUse ? 'Conditions met' : 'Conditions not met',
        expectedDamage,
        resourcesUsed: effect.resourceCost ? { [effect.resourceCost.type]: effect.resourceCost.amount } : {},
      };

      results.push(result);

      if (canUse && expectedDamage > bestExpectedDamage) {
        bestExpectedDamage = expectedDamage;
        bestEffect = effect;
        bestAttackIndex = attackIndex;
      }
    }
  }

  // Determine strategy based on policy
  let reasoning = 'No once-per-turn effects available';
  if (bestEffect) {
    const policy = build.policies.oncePerTurnPriority;
    if (policy === 'firstHit') {
      reasoning = `Using ${bestEffect.name} on first qualifying attack for consistent damage`;
    } else if (policy === 'bestHit') {
      reasoning = `Using ${bestEffect.name} on attack #${bestAttackIndex + 1} for optimal expected value`;
    }
  }

  return {
    availableEffects,
    selectedEffect: bestEffect,
    allResults: results,
    totalExpectedDamage: bestExpectedDamage,
    optimalAttackIndex: bestAttackIndex,
    reasoning,
  };
};

// Calculate expected damage from a once-per-turn effect
const calculateExpectedEffectDamage = (
  effect: OncePerTurnEffect,
  context: OncePerTurnContext
): number => {
  const { hitProbability, critProbability } = context;
  
  // Base expected damage
  const baseDamage = effect.damage.dice.count * (effect.damage.dice.sides + 1) / 2 + effect.damage.dice.bonus;
  
  // Account for crit doubling if applicable
  let critDamage = baseDamage;
  if (effect.damage.onCritDouble) {
    critDamage = baseDamage * 2;
  }
  
  // Expected damage = P(normal hit) * normal damage + P(crit) * crit damage
  const normalHitProb = hitProbability - critProbability;
  return normalHitProb * baseDamage + critProbability * critDamage;
};

// Get available resources for spending
const getAvailableResources = (build: Build): Record<string, number> => {
  const resources: Record<string, number> = {};
  
  // Spell slots
  Object.entries(build.spellSlots).forEach(([level, amount]) => {
    resources[`spellSlot${level}`] = amount;
  });
  
  // Other resources would be calculated based on class levels
  // Ki points, superiority dice, etc.
  
  return resources;
};

// Get attack bonus (simplified)
const getAttackBonus = (build: Build): number => {
  // This would be more complex in reality, accounting for proficiency, ability mods, etc.
  return build.proficiencyBonus + 5; // Rough estimate
};

// Policy-based decision making for once-per-turn effects
export const applyOncePerTurnPolicy = (
  analysis: OncePerTurnAnalysis,
  policy: 'firstHit' | 'bestHit'
): {
  selectedEffect?: OncePerTurnEffect;
  targetAttack: number;
  reasoning: string;
} => {
  if (!analysis.selectedEffect) {
    return {
      targetAttack: 0,
      reasoning: 'No applicable once-per-turn effects',
    };
  }

  switch (policy) {
    case 'firstHit':
      return {
        selectedEffect: analysis.selectedEffect,
        targetAttack: 0, // Always use on first attack that qualifies
        reasoning: `Apply ${analysis.selectedEffect.name} to first qualifying attack for consistency`,
      };
    
    case 'bestHit':
      return {
        selectedEffect: analysis.selectedEffect,
        targetAttack: analysis.optimalAttackIndex,
        reasoning: `Apply ${analysis.selectedEffect.name} to attack #${analysis.optimalAttackIndex + 1} for maximum expected value`,
      };
    
    default:
      return {
        targetAttack: 0,
        reasoning: 'Unknown policy',
      };
  }
};

// Calculate probability of landing at least one qualifying hit for once-per-turn effects
export const getOncePerTurnTriggerProbability = (
  hitProbabilities: number[],
  effectConditions: boolean[]
): number => {
  // P(at least one qualifying hit) = 1 - P(all qualifying attacks miss)
  let allMissProb = 1;
  
  for (let i = 0; i < hitProbabilities.length; i++) {
    if (effectConditions[i]) {
      allMissProb *= (1 - hitProbabilities[i]);
    }
  }
  
  return 1 - allMissProb;
};

// Advanced analysis: expected value of saving once-per-turn for later attacks
export const analyzeOncePerTurnTiming = (
  build: Build,
  target: Target,
  combat: CombatContext,
  attackSequence: { hitProbabilities: number[]; critProbabilities: number[] }
): {
  strategy: 'immediate' | 'wait' | 'conditional';
  reasoning: string;
  expectedValue: number;
} => {
  const effects = getOncePerTurnEffects(build);
  const primaryEffect = effects[0]; // Highest priority effect
  
  if (!primaryEffect) {
    return {
      strategy: 'immediate',
      reasoning: 'No once-per-turn effects available',
      expectedValue: 0,
    };
  }

  // Calculate expected value of using immediately vs waiting
  const immediateEV = calculateExpectedEffectDamage(primaryEffect, {
    build,
    target,
    combat,
    attackNumber: 0,
    hitProbability: attackSequence.hitProbabilities[0],
    critProbability: attackSequence.critProbabilities[0],
    isMainAction: true,
    availableResources: getAvailableResources(build),
  });

  // For waiting, we need to account for the probability of getting a qualifying hit later
  // This is a simplified calculation
  const waitingEV = attackSequence.hitProbabilities.slice(1)
    .reduce((acc, hitProb, index) => {
      const effectDamage = calculateExpectedEffectDamage(primaryEffect, {
        build,
        target,
        combat,
        attackNumber: index + 1,
        hitProbability: hitProb,
        critProbability: attackSequence.critProbabilities[index + 1],
        isMainAction: true,
        availableResources: getAvailableResources(build),
      });
      return Math.max(acc, effectDamage);
    }, 0);

  if (immediateEV >= waitingEV) {
    return {
      strategy: 'immediate',
      reasoning: `Use ${primaryEffect.name} immediately for ${immediateEV.toFixed(1)} expected damage`,
      expectedValue: immediateEV,
    };
  } else {
    return {
      strategy: 'wait',
      reasoning: `Wait for better opportunity (${waitingEV.toFixed(1)} vs ${immediateEV.toFixed(1)} expected damage)`,
      expectedValue: waitingEV,
    };
  }
};
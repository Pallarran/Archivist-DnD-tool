/**
 * Policy-based decision making engine for combat automation
 */

import type { Build, Target, CombatContext } from '../types';
import type { AdvantageState } from './advantageStates';
import type { PowerAttackAnalysis } from './powerAttack';
import type { OncePerTurnAnalysis } from './oncePerTurn';
import type { AttackSequence } from './damage';
import { analyzePowerAttack } from './powerAttack';
import { analyzeOncePerTurnEffects } from './oncePerTurn';
import { analyzeAdvantageState } from './advantageStates';
import { calculateAttackProbabilities } from './probability';

export interface PolicyDecision {
  action: string;
  reasoning: string;
  expectedValue: number;
  confidence: number; // 0-1 scale
  alternatives: Array<{
    action: string;
    expectedValue: number;
    reasoning: string;
  }>;
}

export interface CombatPolicyContext {
  build: Build;
  target: Target;
  combat: CombatContext;
  round: number;
  remainingResources: {
    spellSlots: Record<string, number>;
    hitDice: number;
    features: Record<string, number>; // Uses per short/long rest
  };
  partyContext?: {
    allyCount: number;
    averageLevel: number;
    hasHealer: boolean;
    hasSupport: boolean;
  };
}

export interface PolicyEngine {
  decidePowerAttack: (context: CombatPolicyContext) => PolicyDecision;
  decideResourceUsage: (context: CombatPolicyContext) => PolicyDecision;
  decideTargeting: (context: CombatPolicyContext, availableTargets: Target[]) => PolicyDecision;
  decidePositioning: (context: CombatPolicyContext) => PolicyDecision;
  decideOncePerTurn: (context: CombatPolicyContext) => PolicyDecision;
}

// Create policy engine based on build configuration
export const createPolicyEngine = (build: Build): PolicyEngine => {
  const policies = build.policies;
  
  return {
    decidePowerAttack: (context) => decidePowerAttackUsage(context, policies),
    decideResourceUsage: (context) => decideResourceUsage(context, policies),
    decideTargeting: (context, targets) => decideTargeting(context, targets, policies),
    decidePositioning: (context) => decidePositioning(context, policies),
    decideOncePerTurn: (context) => decideOncePerTurnUsage(context, policies),
  };
};

// Power attack decision logic
const decidePowerAttackUsage = (
  context: CombatPolicyContext,
  policies: Build['policies']
): PolicyDecision => {
  const { build, target, combat } = context;
  
  // Get attack bonus (simplified)
  const attackBonus = build.proficiencyBonus + 5; // Rough estimate
  
  // Create attack sequence for analysis
  const baseAttackSequence: AttackSequence = {
    hitProbability: 0.65, // Will be calculated
    critProbability: 0.05,
    normalDamage: [], // Would be populated based on equipment
    numAttacks: getNumAttacks(build),
  };
  
  const powerAttackAnalysis = analyzePowerAttack({
    attackBonus,
    targetAC: target.armorClass,
    attackSequence: baseAttackSequence,
    advantageState: combat.advantage,
    target,
  });
  
  const shouldUsePowerAttack = powerAttackAnalysis.shouldUsePowerAttack;
  const expectedValueDelta = powerAttackAnalysis.expectedValueDelta;
  
  let reasoning = '';
  let confidence = 0.8;
  
  if (shouldUsePowerAttack) {
    reasoning = `Power attack increases DPR by ${expectedValueDelta.toFixed(1)}. Target AC ${target.armorClass} is below break-even point of ${powerAttackAnalysis.breakEvenAC}.`;
  } else {
    reasoning = `Power attack decreases DPR by ${Math.abs(expectedValueDelta).toFixed(1)}. Target AC ${target.armorClass} is above break-even point of ${powerAttackAnalysis.breakEvenAC}.`;
  }
  
  // Adjust confidence based on how clear the decision is
  const deltaAbsolute = Math.abs(expectedValueDelta);
  if (deltaAbsolute < 0.5) {
    confidence = 0.6; // Close call
  } else if (deltaAbsolute > 2.0) {
    confidence = 0.95; // Very clear decision
  }
  
  return {
    action: shouldUsePowerAttack ? 'use-power-attack' : 'normal-attack',
    reasoning,
    expectedValue: shouldUsePowerAttack ? powerAttackAnalysis.powerAttackDPR : powerAttackAnalysis.normalDPR,
    confidence,
    alternatives: [
      {
        action: shouldUsePowerAttack ? 'normal-attack' : 'use-power-attack',
        expectedValue: shouldUsePowerAttack ? powerAttackAnalysis.normalDPR : powerAttackAnalysis.powerAttackDPR,
        reasoning: shouldUsePowerAttack ? 
          'Standard attacks for higher accuracy' : 
          'Power attack for higher damage per hit',
      },
    ],
  };
};

// Resource usage decision logic
const decideResourceUsage = (
  context: CombatPolicyContext,
  policies: Build['policies']
): PolicyDecision => {
  const { build, target, combat, round, remainingResources } = context;
  
  // Divine Smite decision
  if (build.levels.some(l => l.class.toLowerCase() === 'paladin')) {
    const hasSpellSlots = Object.values(remainingResources.spellSlots).some(slots => slots > 0);
    
    if (hasSpellSlots) {
      switch (policies.smitePolicy) {
        case 'never':
          return {
            action: 'conserve-spell-slots',
            reasoning: 'Policy set to never use Divine Smite',
            expectedValue: 0,
            confidence: 1.0,
            alternatives: [],
          };
          
        case 'onCrit':
          return {
            action: combat.advantage === 'advantage' ? 'prepare-smite-on-crit' : 'normal-attack',
            reasoning: 'Will use Divine Smite only on critical hits',
            expectedValue: calculateSmiteExpectedValue(context, true),
            confidence: 0.8,
            alternatives: [
              {
                action: 'use-smite-always',
                expectedValue: calculateSmiteExpectedValue(context, false),
                reasoning: 'Use Divine Smite on any hit',
              },
            ],
          };
          
        case 'optimal':
          const smiteEV = calculateSmiteExpectedValue(context, false);
          const normalEV = calculateNormalAttackExpectedValue(context);
          
          return {
            action: smiteEV > normalEV ? 'use-smite' : 'normal-attack',
            reasoning: `Smite EV: ${smiteEV.toFixed(1)} vs Normal EV: ${normalEV.toFixed(1)}`,
            expectedValue: Math.max(smiteEV, normalEV),
            confidence: 0.9,
            alternatives: [
              {
                action: smiteEV > normalEV ? 'normal-attack' : 'use-smite',
                expectedValue: Math.min(smiteEV, normalEV),
                reasoning: 'Alternative approach with lower expected value',
              },
            ],
          };
          
        case 'always':
          return {
            action: 'use-smite',
            reasoning: 'Policy set to always use Divine Smite when available',
            expectedValue: calculateSmiteExpectedValue(context, false),
            confidence: 0.7,
            alternatives: [],
          };
      }
    }
  }
  
  return {
    action: 'normal-attack',
    reasoning: 'No special resource usage warranted',
    expectedValue: calculateNormalAttackExpectedValue(context),
    confidence: 0.8,
    alternatives: [],
  };
};

// Target selection logic
const decideTargeting = (
  context: CombatPolicyContext,
  availableTargets: Target[],
  policies: Build['policies']
): PolicyDecision => {
  if (availableTargets.length <= 1) {
    return {
      action: 'attack-primary-target',
      reasoning: 'Only one target available',
      expectedValue: calculateNormalAttackExpectedValue(context),
      confidence: 1.0,
      alternatives: [],
    };
  }
  
  // Calculate expected damage against each target
  const targetAnalyses = availableTargets.map(target => {
    const targetContext = { ...context, target };
    const expectedDamage = calculateNormalAttackExpectedValue(targetContext);
    
    return {
      target,
      expectedDamage,
      hitProbability: calculateHitProbability(context.build, target),
      tacticalValue: calculateTacticalValue(target, context),
    };
  });
  
  // Sort by combined tactical and damage value
  const bestTarget = targetAnalyses.reduce((best, current) => {
    const bestScore = best.expectedDamage + best.tacticalValue;
    const currentScore = current.expectedDamage + current.tacticalValue;
    return currentScore > bestScore ? current : best;
  });
  
  const alternatives = targetAnalyses
    .filter(t => t !== bestTarget)
    .map(analysis => ({
      action: `attack-${analysis.target.name || 'target'}`,
      expectedValue: analysis.expectedDamage,
      reasoning: `Hit chance: ${(analysis.hitProbability * 100).toFixed(1)}%, Tactical value: ${analysis.tacticalValue.toFixed(1)}`,
    }));
  
  return {
    action: `attack-${bestTarget.target.name || 'best-target'}`,
    reasoning: `Highest combined value: ${bestTarget.expectedDamage.toFixed(1)} damage + ${bestTarget.tacticalValue.toFixed(1)} tactical`,
    expectedValue: bestTarget.expectedDamage,
    confidence: 0.8,
    alternatives,
  };
};

// Positioning decision logic
const decidePositioning = (
  context: CombatPolicyContext,
  policies: Build['policies']
): PolicyDecision => {
  const { build, target, combat } = context;
  
  // Check for flanking opportunity
  if (!combat.flanking && combat.allyWithin5ft) {
    const flankingAdvantage = calculateAdvantageValue(context, 'advantage');
    const normalValue = calculateAdvantageValue(context, 'normal');
    const advantageGain = flankingAdvantage - normalValue;
    
    if (advantageGain > 1.0) {
      return {
        action: 'move-for-flanking',
        reasoning: `Flanking would increase DPR by ${advantageGain.toFixed(1)}`,
        expectedValue: flankingAdvantage,
        confidence: 0.8,
        alternatives: [
          {
            action: 'attack-from-current-position',
            expectedValue: normalValue,
            reasoning: 'Attack without repositioning',
          },
        ],
      };
    }
  }
  
  // Check for cover considerations
  if (combat.cover === 'partial') {
    return {
      action: 'move-to-avoid-cover',
      reasoning: 'Target has partial cover, reducing hit chance',
      expectedValue: calculateNormalAttackExpectedValue(context) * 1.1, // Estimated improvement
      confidence: 0.7,
      alternatives: [
        {
          action: 'attack-through-cover',
          expectedValue: calculateNormalAttackExpectedValue(context),
          reasoning: 'Attack despite cover penalty',
        },
      ],
    };
  }
  
  return {
    action: 'maintain-position',
    reasoning: 'Current position is tactically sound',
    expectedValue: calculateNormalAttackExpectedValue(context),
    confidence: 0.6,
    alternatives: [],
  };
};

// Once-per-turn effect decision logic
const decideOncePerTurnUsage = (
  context: CombatPolicyContext,
  policies: Build['policies']
): PolicyDecision => {
  const { build, target, combat } = context;
  
  const analysis = analyzeOncePerTurnEffects(build, target, combat, getNumAttacks(build));
  
  if (!analysis.selectedEffect) {
    return {
      action: 'no-once-per-turn',
      reasoning: 'No applicable once-per-turn effects',
      expectedValue: 0,
      confidence: 1.0,
      alternatives: [],
    };
  }
  
  const timing = policies.oncePerTurnPriority === 'firstHit' ? 'first-qualifying-attack' : `attack-${analysis.optimalAttackIndex + 1}`;
  
  return {
    action: `use-${analysis.selectedEffect.id}-on-${timing}`,
    reasoning: analysis.reasoning,
    expectedValue: analysis.totalExpectedDamage,
    confidence: 0.9,
    alternatives: analysis.availableEffects
      .filter(e => e !== analysis.selectedEffect)
      .slice(0, 2)
      .map(effect => ({
        action: `use-${effect.id}`,
        expectedValue: calculateEffectExpectedValue(effect, context),
        reasoning: effect.description,
      })),
  };
};

// Helper functions
const getNumAttacks = (build: Build): number => {
  // This would be more complex in reality, accounting for class features, feats, etc.
  let attacks = 1;
  
  // Fighter Extra Attack
  const fighterLevel = build.levels.find(l => l.class.toLowerCase() === 'fighter')?.level || 0;
  if (fighterLevel >= 5) attacks++;
  if (fighterLevel >= 11) attacks++;
  if (fighterLevel >= 20) attacks++;
  
  // Other classes with Extra Attack
  const extraAttackClasses = ['paladin', 'ranger', 'barbarian'];
  const hasExtraAttack = build.levels.some(l => 
    extraAttackClasses.includes(l.class.toLowerCase()) && l.level >= 5
  );
  if (hasExtraAttack && attacks === 1) attacks++;
  
  return attacks;
};

const calculateHitProbability = (build: Build, target: Target): number => {
  const attackBonus = build.proficiencyBonus + 5; // Simplified
  const probabilities = calculateAttackProbabilities({
    attackBonus,
    targetAC: target.armorClass,
  });
  return probabilities.hitProbability;
};

const calculateTacticalValue = (target: Target, context: CombatPolicyContext): number => {
  let value = 0;
  
  // Lower HP targets are more valuable (easier to eliminate)
  if (target.currentHP && target.maxHP) {
    const hpPercent = target.currentHP / target.maxHP;
    value += (1 - hpPercent) * 2; // Up to +2 for low HP targets
  }
  
  // Spellcasters and support enemies are high priority
  if (target.type === 'spellcaster') value += 3;
  if (target.type === 'support') value += 2;
  
  // Conditions that make target easier to hit
  if (target.conditions?.includes('prone') || target.conditions?.includes('restrained')) {
    value += 1;
  }
  
  return value;
};

const calculateAdvantageValue = (context: CombatPolicyContext, advantageState: AdvantageState): number => {
  const attackBonus = context.build.proficiencyBonus + 5;
  const probabilities = calculateAttackProbabilities({
    attackBonus,
    targetAC: context.target.armorClass,
    advantageState,
  });
  
  // Simplified expected damage calculation
  return probabilities.hitProbability * 10; // Assume 10 average damage
};

const calculateSmiteExpectedValue = (context: CombatPolicyContext, onCritOnly: boolean): number => {
  // Simplified calculation - would use actual damage calculations in practice
  const hitProb = calculateHitProbability(context.build, context.target);
  const critProb = 0.05; // Simplified
  
  const smiteDamage = 9; // 2d8 average
  
  if (onCritOnly) {
    return critProb * (smiteDamage * 2); // Double on crit
  } else {
    return hitProb * smiteDamage + critProb * smiteDamage; // Additional damage on crit
  }
};

const calculateNormalAttackExpectedValue = (context: CombatPolicyContext): number => {
  // Simplified calculation
  const hitProb = calculateHitProbability(context.build, context.target);
  const averageDamage = 8; // Would calculate from weapon + ability mod
  return hitProb * averageDamage * getNumAttacks(context.build);
};

const calculateEffectExpectedValue = (effect: any, context: CombatPolicyContext): number => {
  // Simplified calculation for once-per-turn effects
  const hitProb = calculateHitProbability(context.build, context.target);
  return hitProb * 6; // Rough estimate
};

// Policy evaluation and recommendations
export const evaluatePolicyEffectiveness = (
  build: Build,
  simulationResults: any[]
): {
  score: number;
  recommendations: string[];
  inefficiencies: string[];
} => {
  const score = 0.8; // Placeholder
  const recommendations: string[] = [];
  const inefficiencies: string[] = [];
  
  // Analyze Divine Smite usage
  if (build.policies.smitePolicy === 'always') {
    inefficiencies.push('Always using Divine Smite may waste spell slots against weak enemies');
    recommendations.push('Consider switching to "optimal" smite policy for better resource management');
  }
  
  if (build.policies.smitePolicy === 'never') {
    inefficiencies.push('Never using Divine Smite wastes a significant damage source');
    recommendations.push('Consider using Divine Smite at least on critical hits');
  }
  
  return {
    score,
    recommendations,
    inefficiencies,
  };
};
/**
 * Advantage state system for D&D 5e combat mechanics
 * Handles advantage/disadvantage modifiers from various sources
 */

import type { Build, Target, CombatContext } from '../types';
import { calculateAttackProbabilities } from './probability';

export type AdvantageState = 'normal' | 'advantage' | 'disadvantage' | 'elven-accuracy';

export interface AdvantageSource {
  id: string;
  name: string;
  type: 'advantage' | 'disadvantage';
  condition?: (context: AdvantageContext) => boolean;
  description: string;
}

export interface AdvantageContext {
  build: Build;
  target: Target;
  combat: CombatContext;
  attackType: 'melee' | 'ranged' | 'spell';
  weapon?: string;
}

export interface AdvantageAnalysis {
  finalState: AdvantageState;
  sources: AdvantageSource[];
  advantageSources: AdvantageSource[];
  disadvantageSources: AdvantageSource[];
  reasoning: string;
  probabilities: {
    hit: number;
    crit: number;
  };
}

// Common advantage sources
export const getAdvantageSource = (id: string): AdvantageSource | undefined => {
  const sources: Record<string, AdvantageSource> = {
    'flanking': {
      id: 'flanking',
      name: 'Flanking',
      type: 'advantage',
      condition: (context) => context.combat.flanking === true,
      description: 'Target is flanked by allies',
    },
    'hidden': {
      id: 'hidden',
      name: 'Hidden/Unseen',
      type: 'advantage',
      condition: (context) => context.combat.hidden === true,
      description: 'Attacking while hidden or target cannot see you',
    },
    'prone-target': {
      id: 'prone-target',
      name: 'Prone Target (Melee)',
      type: 'advantage',
      condition: (context) => 
        context.combat.targetConditions.includes('prone') && 
        context.attackType === 'melee',
      description: 'Target is prone (melee attacks have advantage)',
    },
    'prone-target-ranged': {
      id: 'prone-target-ranged',
      name: 'Prone Target (Ranged)',
      type: 'disadvantage',
      condition: (context) => 
        context.combat.targetConditions.includes('prone') && 
        context.attackType === 'ranged',
      description: 'Target is prone (ranged attacks have disadvantage)',
    },
    'restrained-target': {
      id: 'restrained-target',
      name: 'Restrained Target',
      type: 'advantage',
      condition: (context) => context.combat.targetConditions.includes('restrained'),
      description: 'Target is restrained',
    },
    'paralyzed-target': {
      id: 'paralyzed-target',
      name: 'Paralyzed Target',
      type: 'advantage',
      condition: (context) => context.combat.targetConditions.includes('paralyzed'),
      description: 'Target is paralyzed',
    },
    'stunned-target': {
      id: 'stunned-target',
      name: 'Stunned Target',
      type: 'advantage',
      condition: (context) => context.combat.targetConditions.includes('stunned'),
      description: 'Target is stunned',
    },
    'unconscious-target': {
      id: 'unconscious-target',
      name: 'Unconscious Target',
      type: 'advantage',
      condition: (context) => context.combat.targetConditions.includes('unconscious'),
      description: 'Target is unconscious',
    },
    'blinded-attacker': {
      id: 'blinded-attacker',
      name: 'Blinded Attacker',
      type: 'disadvantage',
      condition: (context) => context.build.conditions.includes('blinded'),
      description: 'You are blinded',
    },
    'poisoned-attacker': {
      id: 'poisoned-attacker',
      name: 'Poisoned Attacker',
      type: 'disadvantage',
      condition: (context) => context.build.conditions.includes('poisoned'),
      description: 'You are poisoned',
    },
    'frightened-attacker': {
      id: 'frightened-attacker',
      name: 'Frightened Attacker',
      type: 'disadvantage',
      condition: (context) => context.build.conditions.includes('frightened'),
      description: 'You are frightened',
    },
    'dodge-action': {
      id: 'dodge-action',
      name: 'Dodge Action',
      type: 'disadvantage',
      condition: (context) => context.combat.targetActions.includes('dodge'),
      description: 'Target took the Dodge action',
    },
    'long-range': {
      id: 'long-range',
      name: 'Long Range',
      type: 'disadvantage',
      condition: (context) => 
        context.attackType === 'ranged' && 
        context.combat.range === 'long',
      description: 'Ranged attack at long range',
    },
    'cover': {
      id: 'cover',
      name: 'Partial Cover',
      type: 'disadvantage',
      condition: (context) => context.combat.cover === 'partial',
      description: 'Target has partial cover',
    },
    'darkness': {
      id: 'darkness',
      name: 'Darkness (No Darkvision)',
      type: 'disadvantage',
      condition: (context) => 
        context.combat.lighting === 'darkness' && 
        !context.build.features.includes('Darkvision'),
      description: 'Fighting in darkness without darkvision',
    },
    // Feature-based advantages
    'reckless-attack': {
      id: 'reckless-attack',
      name: 'Reckless Attack',
      type: 'advantage',
      condition: (context) => 
        context.build.features.includes('Reckless Attack') &&
        context.attackType === 'melee' &&
        context.combat.recklessAttack === true,
      description: 'Barbarian Reckless Attack (also grants advantage to enemies)',
    },
    'pack-tactics': {
      id: 'pack-tactics',
      name: 'Pack Tactics',
      type: 'advantage',
      condition: (context) => 
        context.build.features.includes('Pack Tactics') &&
        context.combat.allyWithin5ft === true,
      description: 'Pack Tactics: ally within 5 feet of target',
    },
    'archery-fighting-style': {
      id: 'archery-fighting-style',
      name: 'Archery Fighting Style',
      type: 'advantage',
      condition: (context) => 
        context.build.fightingStyles.includes('Archery') &&
        context.attackType === 'ranged',
      description: '+2 bonus to ranged weapon attacks (treated as advantage for simplicity)',
    },
  };

  return sources[id];
};

// Determine final advantage state from multiple sources
export const analyzeAdvantageState = (context: AdvantageContext): AdvantageAnalysis => {
  const allSources = Object.values({
    'flanking': getAdvantageSource('flanking'),
    'hidden': getAdvantageSource('hidden'),
    'prone-target': getAdvantageSource('prone-target'),
    'prone-target-ranged': getAdvantageSource('prone-target-ranged'),
    'restrained-target': getAdvantageSource('restrained-target'),
    'paralyzed-target': getAdvantageSource('paralyzed-target'),
    'stunned-target': getAdvantageSource('stunned-target'),
    'unconscious-target': getAdvantageSource('unconscious-target'),
    'blinded-attacker': getAdvantageSource('blinded-attacker'),
    'poisoned-attacker': getAdvantageSource('poisoned-attacker'),
    'frightened-attacker': getAdvantageSource('frightened-attacker'),
    'dodge-action': getAdvantageSource('dodge-action'),
    'long-range': getAdvantageSource('long-range'),
    'cover': getAdvantageSource('cover'),
    'darkness': getAdvantageSource('darkness'),
    'reckless-attack': getAdvantageSource('reckless-attack'),
    'pack-tactics': getAdvantageSource('pack-tactics'),
    'archery-fighting-style': getAdvantageSource('archery-fighting-style'),
  }).filter(Boolean) as AdvantageSource[];

  // Filter sources that apply to this context
  const applicableSources = allSources.filter(source => 
    !source.condition || source.condition(context)
  );

  const advantageSources = applicableSources.filter(s => s.type === 'advantage');
  const disadvantageSources = applicableSources.filter(s => s.type === 'disadvantage');

  // Determine final state
  let finalState: AdvantageState = 'normal';
  let reasoning = '';

  const hasAdvantage = advantageSources.length > 0;
  const hasDisadvantage = disadvantageSources.length > 0;

  if (hasAdvantage && hasDisadvantage) {
    finalState = 'normal';
    reasoning = `Advantage and disadvantage cancel out (${advantageSources.length} advantage, ${disadvantageSources.length} disadvantage sources)`;
  } else if (hasAdvantage) {
    // Check for Elven Accuracy
    if (context.build.features.includes('Elven Accuracy')) {
      finalState = 'elven-accuracy';
      reasoning = `Elven Accuracy with advantage from: ${advantageSources.map(s => s.name).join(', ')}`;
    } else {
      finalState = 'advantage';
      reasoning = `Advantage from: ${advantageSources.map(s => s.name).join(', ')}`;
    }
  } else if (hasDisadvantage) {
    finalState = 'disadvantage';
    reasoning = `Disadvantage from: ${disadvantageSources.map(s => s.name).join(', ')}`;
  } else {
    reasoning = 'No advantage or disadvantage sources apply';
  }

  // Calculate probabilities for this advantage state
  const attackBonus = getAttackBonus(context.build, context.attackType);
  const probabilities = calculateAttackProbabilities({
    attackBonus,
    targetAC: context.target.armorClass,
    advantageState: finalState,
  });

  return {
    finalState,
    sources: applicableSources,
    advantageSources,
    disadvantageSources,
    reasoning,
    probabilities: {
      hit: probabilities.hitProbability,
      crit: probabilities.critProbability,
    },
  };
};

// Helper function to get attack bonus (simplified)
const getAttackBonus = (build: Build, attackType: 'melee' | 'ranged' | 'spell'): number => {
  // This is a simplified version - would be more complex in practice
  let bonus = build.proficiencyBonus;
  
  if (attackType === 'melee') {
    bonus += Math.max(build.abilities.strength, build.abilities.dexterity) - 10 >> 1;
  } else if (attackType === 'ranged') {
    bonus += (build.abilities.dexterity - 10) >> 1;
  } else {
    // Spell attacks use spellcasting ability
    const casterLevel = build.levels.find(l => 
      ['wizard', 'sorcerer', 'warlock', 'bard', 'cleric', 'druid', 'paladin', 'ranger'].includes(l.class.toLowerCase())
    );
    if (casterLevel) {
      if (['wizard', 'artificer'].includes(casterLevel.class.toLowerCase())) {
        bonus += (build.abilities.intelligence - 10) >> 1;
      } else if (['cleric', 'druid'].includes(casterLevel.class.toLowerCase())) {
        bonus += (build.abilities.wisdom - 10) >> 1;
      } else {
        bonus += (build.abilities.charisma - 10) >> 1;
      }
    }
  }
  
  return bonus;
};

// Compare advantage states across different scenarios
export const compareAdvantageStates = (
  baseContext: AdvantageContext,
  scenarios: Array<{
    name: string;
    modifications: Partial<AdvantageContext>;
  }>
): Array<{
  scenario: string;
  analysis: AdvantageAnalysis;
  hitProbabilityChange: number;
  critProbabilityChange: number;
}> => {
  const baseAnalysis = analyzeAdvantageState(baseContext);
  
  return scenarios.map(scenario => {
    const modifiedContext = { ...baseContext, ...scenario.modifications };
    const analysis = analyzeAdvantageState(modifiedContext);
    
    return {
      scenario: scenario.name,
      analysis,
      hitProbabilityChange: analysis.probabilities.hit - baseAnalysis.probabilities.hit,
      critProbabilityChange: analysis.probabilities.crit - baseAnalysis.probabilities.crit,
    };
  });
};

// Generate advantage state recommendations
export const generateAdvantageRecommendations = (
  context: AdvantageContext
): Array<{
  recommendation: string;
  benefit: string;
  requirement: string;
  probability: number;
}> => {
  const currentAnalysis = analyzeAdvantageState(context);
  const recommendations = [];
  
  // Check for easily obtainable advantages
  if (currentAnalysis.finalState === 'normal' || currentAnalysis.finalState === 'disadvantage') {
    // Flanking recommendation
    if (!context.combat.flanking) {
      const flankingContext = { 
        ...context, 
        combat: { ...context.combat, flanking: true }
      };
      const flankingAnalysis = analyzeAdvantageState(flankingContext);
      
      recommendations.push({
        recommendation: 'Position for flanking',
        benefit: `+${((flankingAnalysis.probabilities.hit - currentAnalysis.probabilities.hit) * 100).toFixed(1)}% hit chance`,
        requirement: 'Ally opposite target within 5 feet',
        probability: flankingAnalysis.probabilities.hit,
      });
    }
    
    // Hide action recommendation
    if (!context.combat.hidden) {
      const hiddenContext = { 
        ...context, 
        combat: { ...context.combat, hidden: true }
      };
      const hiddenAnalysis = analyzeAdvantageState(hiddenContext);
      
      recommendations.push({
        recommendation: 'Take Hide action',
        benefit: `+${((hiddenAnalysis.probabilities.hit - currentAnalysis.probabilities.hit) * 100).toFixed(1)}% hit chance`,
        requirement: 'Successfully hide with Stealth check',
        probability: hiddenAnalysis.probabilities.hit,
      });
    }
  }
  
  // Reckless Attack for Barbarians
  if (context.build.features.includes('Reckless Attack') && 
      context.attackType === 'melee' && 
      !context.combat.recklessAttack) {
    const recklessContext = { 
      ...context, 
      combat: { ...context.combat, recklessAttack: true }
    };
    const recklessAnalysis = analyzeAdvantageState(recklessContext);
    
    recommendations.push({
      recommendation: 'Use Reckless Attack',
      benefit: `+${((recklessAnalysis.probabilities.hit - currentAnalysis.probabilities.hit) * 100).toFixed(1)}% hit chance`,
      requirement: 'Grants advantage to enemies attacking you until your next turn',
      probability: recklessAnalysis.probabilities.hit,
    });
  }
  
  return recommendations.sort((a, b) => b.probability - a.probability);
};

// Advantage state sweep for optimization
export const advantageStateSweep = (
  baseContext: AdvantageContext,
  acRange: [number, number] = [10, 25]
): Array<{
  ac: number;
  states: Record<AdvantageState, {
    hitProbability: number;
    critProbability: number;
    advantage: number; // Probability increase over normal
  }>;
}> => {
  const [minAC, maxAC] = acRange;
  const results = [];
  
  for (let ac = minAC; ac <= maxAC; ac++) {
    const contextWithAC = {
      ...baseContext,
      target: { ...baseContext.target, armorClass: ac },
    };
    
    const states: Record<AdvantageState, any> = {} as any;
    
    (['normal', 'advantage', 'disadvantage', 'elven-accuracy'] as AdvantageState[]).forEach(state => {
      const attackBonus = getAttackBonus(contextWithAC.build, contextWithAC.attackType);
      const probs = calculateAttackProbabilities({
        attackBonus,
        targetAC: ac,
        advantageState: state,
      });
      
      const normalProbs = calculateAttackProbabilities({
        attackBonus,
        targetAC: ac,
        advantageState: 'normal',
      });
      
      states[state] = {
        hitProbability: probs.hitProbability,
        critProbability: probs.critProbability,
        advantage: probs.hitProbability - normalProbs.hitProbability,
      };
    });
    
    results.push({ ac, states });
  }
  
  return results;
};
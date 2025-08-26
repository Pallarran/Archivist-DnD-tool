/**
 * Main DPR calculation engine integrating all math systems
 */

import type { Build, Target, CombatContext } from '../types';
import { analyzeAdvantageState, type AdvantageContext } from './advantageStates';
import { analyzePowerAttack, type PowerAttackOptions } from './powerAttack';
import { analyzeOncePerTurnEffects } from './oncePerTurn';
import { createPolicyEngine } from './policyEngine';
import { calculateAttackProbabilities } from './probability';
import { calculateDPR as calculateAttackDPR, getWeaponDamage, type AttackSequence } from './damage';

export interface DPRCalculationOptions {
  build: Build;
  target: Target;
  combat: CombatContext;
  rounds: number;
}

export interface DPRResult {
  dpr: {
    total: number;
    byRound: number[];
    breakdown: {
      weaponDamage: number;
      oncePerTurn: number;
      spellDamage: number;
      otherSources: number;
    };
    conditions: {
      normal: number;
      advantage: number;
      disadvantage: number;
      elvenAccuracy?: number;
    };
  };
  hitChances: {
    normal: number;
    advantage: number;
    disadvantage: number;
    elvenAccuracy?: number;
  };
  critChances: {
    normal: number;
    advantage: number;
    disadvantage: number;
    elvenAccuracy?: number;
  };
  powerAttack?: {
    recommended: boolean;
    breakEvenAC: number;
    normalDPR: number;
    powerAttackDPR: number;
  };
  oncePerTurnAnalysis?: {
    selectedEffect: string;
    reasoning: string;
    alternatives: Array<{
      name: string;
      damage: number;
      conditions: string;
    }>;
  };
  resourceUsage: {
    spellSlots: Record<string, number>;
    features: Record<string, number>;
  };
}

export const calculateDPR = async (options: DPRCalculationOptions): Promise<DPRResult> => {
  const { build, target, combat, rounds } = options;

  // Get attack bonus and weapon info
  const attackBonus = getAttackBonus(build);
  const numAttacks = getNumAttacks(build);
  
  // Analyze advantage state
  const advantageContext: AdvantageContext = {
    build,
    target,
    combat,
    attackType: build.equipment.mainHand?.type === 'ranged' ? 'ranged' : 'melee',
    weapon: build.equipment.mainHand?.name,
  };
  
  const advantageAnalysis = analyzeAdvantageState(advantageContext);
  
  // Calculate base probabilities for different advantage states
  const probabilityCalculations = {
    normal: calculateAttackProbabilities({
      attackBonus,
      targetAC: target.armorClass,
      advantageState: 'normal',
    }),
    advantage: calculateAttackProbabilities({
      attackBonus,
      targetAC: target.armorClass,
      advantageState: 'advantage',
    }),
    disadvantage: calculateAttackProbabilities({
      attackBonus,
      targetAC: target.armorClass,
      advantageState: 'disadvantage',
    }),
  };

  // Add Elven Accuracy if applicable
  if (build.features.includes('Elven Accuracy')) {
    probabilityCalculations.elvenAccuracy = calculateAttackProbabilities({
      attackBonus,
      targetAC: target.armorClass,
      advantageState: 'elven-accuracy',
    });
  }

  // Create weapon damage sources
  const weaponDamage = build.equipment.mainHand 
    ? getWeaponDamage(
        build.equipment.mainHand.damage,
        getAttackAbilityMod(build),
        build.equipment.mainHand.damageType
      )
    : getWeaponDamage('1d4', getAttackAbilityMod(build), 'bludgeoning'); // Unarmed

  // Create attack sequence
  const currentProbabilities = probabilityCalculations[advantageAnalysis.finalState] || probabilityCalculations.normal;
  const attackSequence: AttackSequence = {
    hitProbability: currentProbabilities.hitProbability,
    critProbability: currentProbabilities.critProbability,
    normalDamage: [weaponDamage],
    numAttacks,
  };

  // Add off-hand weapon if present
  if (build.equipment.offHand) {
    const offHandDamage = getWeaponDamage(
      build.equipment.offHand.damage,
      getAttackAbilityMod(build),
      build.equipment.offHand.damageType
    );
    // Off-hand doesn't get ability modifier to damage unless TWF fighting style
    if (!build.fightingStyles?.includes('Two-Weapon Fighting')) {
      offHandDamage.dice.bonus = 0;
    }
    attackSequence.normalDamage.push(offHandDamage);
  }

  // Analyze power attacks if applicable
  let powerAttackAnalysis;
  const hasSharpshooter = build.features.includes('Sharpshooter');
  const hasGWM = build.features.includes('Great Weapon Master');
  
  if (hasSharpshooter || hasGWM) {
    const powerAttackOptions: PowerAttackOptions = {
      attackBonus,
      targetAC: target.armorClass,
      attackSequence,
      advantageState: advantageAnalysis.finalState,
      target,
    };
    
    powerAttackAnalysis = analyzePowerAttack(powerAttackOptions);
  }

  // Analyze once-per-turn effects
  const oncePerTurnAnalysis = analyzeOncePerTurnEffects(build, target, combat, numAttacks);
  
  // Calculate DPR for different advantage states
  const dprByAdvantageState = {
    normal: calculateAttackDPR({
      ...attackSequence,
      hitProbability: probabilityCalculations.normal.hitProbability,
      critProbability: probabilityCalculations.normal.critProbability,
    }, target),
    advantage: calculateAttackDPR({
      ...attackSequence,
      hitProbability: probabilityCalculations.advantage.hitProbability,
      critProbability: probabilityCalculations.advantage.critProbability,
    }, target),
    disadvantage: calculateAttackDPR({
      ...attackSequence,
      hitProbability: probabilityCalculations.disadvantage.hitProbability,
      critProbability: probabilityCalculations.disadvantage.critProbability,
    }, target),
  };

  if (probabilityCalculations.elvenAccuracy) {
    dprByAdvantageState.elvenAccuracy = calculateAttackDPR({
      ...attackSequence,
      hitProbability: probabilityCalculations.elvenAccuracy.hitProbability,
      critProbability: probabilityCalculations.elvenAccuracy.critProbability,
    }, target);
  }

  // Use current advantage state for main calculation
  const baseDPR = dprByAdvantageState[advantageAnalysis.finalState] || dprByAdvantageState.normal;
  
  // Add once-per-turn damage
  const oncePerTurnDPR = oncePerTurnAnalysis.totalExpectedDamage;
  
  // Calculate resource usage
  const resourceUsage = calculateResourceUsage(build, oncePerTurnAnalysis, rounds);
  
  // Create round-by-round breakdown (simplified)
  const roundBreakdown = Array.from({ length: rounds }, (_, round) => {
    let roundDPR = baseDPR;
    
    // Add once-per-turn effects
    roundDPR += oncePerTurnDPR;
    
    // Resource depletion over rounds (simplified)
    const resourceMultiplier = Math.max(0.5, 1 - (round * 0.1));
    if (round > 3) {
      roundDPR *= resourceMultiplier; // Reduced effectiveness as resources deplete
    }
    
    return roundDPR;
  });

  const totalDPR = baseDPR + oncePerTurnDPR;
  
  // Breakdown by damage source
  const breakdown = {
    weaponDamage: baseDPR,
    oncePerTurn: oncePerTurnDPR,
    spellDamage: calculateSpellDPR(build, target, combat), // Additional spell damage
    otherSources: 0, // Temporary/conditional bonuses
  };

  return {
    dpr: {
      total: totalDPR,
      byRound: roundBreakdown,
      breakdown,
      conditions: dprByAdvantageState,
    },
    hitChances: {
      normal: probabilityCalculations.normal.hitProbability,
      advantage: probabilityCalculations.advantage.hitProbability,
      disadvantage: probabilityCalculations.disadvantage.hitProbability,
      ...(probabilityCalculations.elvenAccuracy && {
        elvenAccuracy: probabilityCalculations.elvenAccuracy.hitProbability
      })
    },
    critChances: {
      normal: probabilityCalculations.normal.critProbability,
      advantage: probabilityCalculations.advantage.critProbability,
      disadvantage: probabilityCalculations.disadvantage.critProbability,
      ...(probabilityCalculations.elvenAccuracy && {
        elvenAccuracy: probabilityCalculations.elvenAccuracy.critProbability
      })
    },
    ...(powerAttackAnalysis && {
      powerAttack: {
        recommended: powerAttackAnalysis.shouldUsePowerAttack,
        breakEvenAC: powerAttackAnalysis.breakEvenAC,
        normalDPR: powerAttackAnalysis.normalDPR,
        powerAttackDPR: powerAttackAnalysis.powerAttackDPR,
      }
    }),
    ...(oncePerTurnAnalysis.selectedEffect && {
      oncePerTurnAnalysis: {
        selectedEffect: oncePerTurnAnalysis.selectedEffect.name,
        reasoning: oncePerTurnAnalysis.reasoning,
        alternatives: oncePerTurnAnalysis.availableEffects
          .filter(e => e !== oncePerTurnAnalysis.selectedEffect)
          .slice(0, 3)
          .map(effect => ({
            name: effect.name,
            damage: 6, // Simplified
            conditions: effect.description,
          })),
      }
    }),
    resourceUsage,
  };
};

// Helper functions
const getAttackBonus = (build: Build): number => {
  const proficiencyBonus = build.proficiencyBonus;
  const abilityMod = getAttackAbilityMod(build);
  
  // Magic weapon bonus (simplified)
  const magicBonus = 0; // Would be calculated from equipment
  
  return proficiencyBonus + abilityMod + magicBonus;
};

const getAttackAbilityMod = (build: Build): number => {
  const weapon = build.equipment.mainHand;
  
  if (weapon?.properties.includes('finesse')) {
    return Math.max(
      Math.floor((build.abilities.strength - 10) / 2),
      Math.floor((build.abilities.dexterity - 10) / 2)
    );
  } else if (weapon?.type === 'ranged') {
    return Math.floor((build.abilities.dexterity - 10) / 2);
  } else {
    return Math.floor((build.abilities.strength - 10) / 2);
  }
};

const getNumAttacks = (build: Build): number => {
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
  
  // Dual wielding adds bonus action attack
  if (build.equipment.offHand) attacks++;
  
  return attacks;
};

const calculateResourceUsage = (
  build: Build, 
  oncePerTurnAnalysis: any, 
  rounds: number
): { spellSlots: Record<string, number>; features: Record<string, number> } => {
  const spellSlots: Record<string, number> = {};
  const features: Record<string, number> = {};
  
  // Calculate spell slot usage from policies and effects
  if (build.policies.smitePolicy !== 'never') {
    const paladinLevel = build.levels.find(l => l.class.toLowerCase() === 'paladin')?.level || 0;
    if (paladinLevel >= 2) {
      // Estimate Divine Smite usage based on policy
      let smitesPerEncounter = 0;
      if (build.policies.smitePolicy === 'always') {
        smitesPerEncounter = Math.min(rounds, 4); // Assume 4 spell slots available
      } else if (build.policies.smitePolicy === 'optimal') {
        smitesPerEncounter = Math.min(rounds * 0.5, 2); // Use on ~50% of hits
      } else if (build.policies.smitePolicy === 'onCrit') {
        smitesPerEncounter = rounds * 0.05; // ~5% crit chance
      }
      
      // Distribute across spell slot levels (prefer lower levels)
      let remainingSmites = Math.floor(smitesPerEncounter);
      for (let level = 1; level <= 5 && remainingSmites > 0; level++) {
        const slotsAvailable = build.spellSlots[level.toString()] || 0;
        const slotsUsed = Math.min(remainingSmites, slotsAvailable);
        if (slotsUsed > 0) {
          spellSlots[level.toString()] = slotsUsed;
          remainingSmites -= slotsUsed;
        }
      }
    }
  }
  
  // Precast spells
  build.policies.precast.forEach(spell => {
    // Assume most precast spells use level 1-2 slots
    const level = spell.includes('Hunter') || spell.includes('Hex') ? '1' : '2';
    spellSlots[level] = (spellSlots[level] || 0) + 1;
  });
  
  return { spellSlots, features };
};

const calculateSpellDPR = (build: Build, target: Target, combat: CombatContext): number => {
  let spellDPR = 0;
  
  // Add damage from precast spells
  if (build.policies.precast.includes('Hunter\'s Mark') || build.policies.precast.includes('Hex')) {
    spellDPR += 3.5; // 1d6 average damage per hit
  }
  
  // Add other spell effects
  build.policies.precast.forEach(spell => {
    if (spell.includes('Spiritual Weapon')) {
      spellDPR += 5.5; // ~1d8+mod bonus action attack
    }
    if (spell.includes('Spirit Guardians')) {
      spellDPR += 7; // Area damage (simplified)
    }
  });
  
  return spellDPR;
};
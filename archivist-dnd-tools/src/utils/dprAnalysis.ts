/**
 * DPR Analysis Engine - Advanced damage per round calculations
 * Handles AC-based DPR curves, level progression, and advantage states
 */

import type { SimpleBuild } from '../store/simpleStore';
import { calculateClassResources, getMulticlassSpellSlots } from './multiclassSpellcasting';

export interface DPRPoint {
  ac: number;
  dpr: number;
  hitChance: number;
  critChance: number;
}

export interface DPRCurve {
  normal: DPRPoint[];
  advantage: DPRPoint[];
  disadvantage: DPRPoint[];
}

export interface LevelDPRProgression {
  level: number;
  totalLevel: number;
  classLevels: Record<string, number>;
  proficiencyBonus: number;
  attackBonus: number;
  damage: {
    weaponDamage: number;
    bonusDamage: number;
    oncePerTurnDamage: number;
  };
  dprCurve: DPRCurve;
  resources: {
    spellSlots: Record<number, number>;
    classResources: Record<string, number>;
  };
  keyFeatures: string[];
  breakpoints: {
    newFeatures: string[];
    attacksIncrease: boolean;
    spellProgression: boolean;
    majorImprovement: boolean;
  };
}

export interface AttackCalculation {
  attackBonus: number;
  damageDice: string;
  damageBonus: number;
  attackCount: number;
  critRange: number;
  bonusActionAttacks: Array<{
    damage: string;
    count: number;
    description: string;
  }>;
  oncePerTurnEffects: Array<{
    damage: string;
    description: string;
  }>;
}

/**
 * DPR Analysis Engine
 */
export class DPRAnalysisEngine {
  /**
   * Calculate DPR for a specific AC with advantage state
   */
  static calculateDPRAtAC(
    build: SimpleBuild,
    targetAC: number,
    advantageState: 'normal' | 'advantage' | 'disadvantage' = 'normal'
  ): DPRPoint {
    const attackCalc = this.getAttackCalculation(build);
    
    // Base hit chance calculation
    const attackRoll = attackCalc.attackBonus;
    const neededRoll = Math.max(2, Math.min(20, targetAC - attackRoll + 1));
    let baseHitChance = Math.max(0.05, Math.min(0.95, (21 - neededRoll) / 20));
    
    // Apply advantage/disadvantage
    let hitChance = baseHitChance;
    if (advantageState === 'advantage') {
      hitChance = 1 - Math.pow(1 - baseHitChance, 2);
    } else if (advantageState === 'disadvantage') {
      hitChance = Math.pow(baseHitChance, 2);
    }
    
    // Critical hit chance
    const baseCritChance = attackCalc.critRange / 20;
    let critChance = baseCritChance;
    if (advantageState === 'advantage') {
      const hasElvenAccuracy = this.hasFeature(build, 'elven-accuracy');
      if (hasElvenAccuracy) {
        critChance = 1 - Math.pow(1 - baseCritChance, 3); // Triple advantage
      } else {
        critChance = 1 - Math.pow(1 - baseCritChance, 2); // Regular advantage
      }
    } else if (advantageState === 'disadvantage') {
      critChance = Math.pow(baseCritChance, 2);
    }
    
    // Calculate damage components
    const weaponDamage = this.parseDiceExpression(attackCalc.damageDice) + attackCalc.damageBonus;
    const critDamage = this.parseDiceExpression(attackCalc.damageDice); // Only dice double on crit
    
    // Regular hit damage vs critical hit damage
    const regularHitDamage = weaponDamage;
    const criticalHitDamage = weaponDamage + critDamage;
    
    // Expected damage per attack
    const nonCritHitChance = hitChance - critChance;
    const expectedDamagePerAttack = (nonCritHitChance * regularHitDamage) + (critChance * criticalHitDamage);
    
    // Main hand attacks
    let totalDPR = expectedDamagePerAttack * attackCalc.attackCount;
    
    // Bonus action attacks
    for (const bonusAttack of attackCalc.bonusActionAttacks) {
      const bonusDamage = this.parseDiceExpression(bonusAttack.damage);
      const bonusExpectedDamage = (nonCritHitChance * bonusDamage) + (critChance * (bonusDamage + this.parseDiceExpression(bonusAttack.damage.split('+')[0] || bonusAttack.damage)));
      totalDPR += bonusExpectedDamage * bonusAttack.count;
    }
    
    // Once-per-turn effects (like Sneak Attack)
    for (const oncePerTurn of attackCalc.oncePerTurnEffects) {
      const onceDamage = this.parseDiceExpression(oncePerTurn.damage);
      // Once per turn damage benefits from any hit in the turn
      const chanceToHitAtLeastOnce = Math.min(0.95, 1 - Math.pow(1 - hitChance, attackCalc.attackCount));
      totalDPR += chanceToHitAtLeastOnce * onceDamage;
    }
    
    return {
      ac: targetAC,
      dpr: Math.max(0, totalDPR),
      hitChance,
      critChance
    };
  }

  /**
   * Generate DPR curve across AC range
   */
  static generateDPRCurve(build: SimpleBuild, acRange: { min: number; max: number } = { min: 10, max: 25 }): DPRCurve {
    const normal: DPRPoint[] = [];
    const advantage: DPRPoint[] = [];
    const disadvantage: DPRPoint[] = [];
    
    for (let ac = acRange.min; ac <= acRange.max; ac++) {
      normal.push(this.calculateDPRAtAC(build, ac, 'normal'));
      advantage.push(this.calculateDPRAtAC(build, ac, 'advantage'));
      disadvantage.push(this.calculateDPRAtAC(build, ac, 'disadvantage'));
    }
    
    return { normal, advantage, disadvantage };
  }

  /**
   * Calculate level-by-level DPR progression
   */
  static analyzeLevelProgression(build: SimpleBuild, targetAC: number = 15): LevelDPRProgression[] {
    const progression: LevelDPRProgression[] = [];
    const baseClassLevels = build.classLevels || [];
    
    for (let level = 1; level <= 20; level++) {
      // Calculate class levels at this total level
      const scaledClassLevels = this.scaleClassLevelsToLevel(baseClassLevels, level);
      
      // Create build at this level
      const levelBuild: SimpleBuild = {
        ...build,
        level,
        classLevels: scaledClassLevels
      };
      
      // Calculate progression data
      const proficiencyBonus = Math.ceil(level / 4) + 1;
      const attackCalc = this.getAttackCalculation(levelBuild);
      const dprCurve = this.generateDPRCurve(levelBuild);
      const resources = calculateClassResources(levelBuild, level);
      
      // Identify key features and breakpoints
      const keyFeatures = this.getKeyFeaturesAtLevel(scaledClassLevels, level);
      const breakpoints = this.analyzeBreakpoints(scaledClassLevels, level);
      
      progression.push({
        level,
        totalLevel: level,
        classLevels: scaledClassLevels.reduce((acc, cl) => ({ ...acc, [cl.class]: cl.level }), {}),
        proficiencyBonus,
        attackBonus: attackCalc.attackBonus,
        damage: {
          weaponDamage: this.parseDiceExpression(attackCalc.damageDice) + attackCalc.damageBonus,
          bonusDamage: attackCalc.bonusActionAttacks.reduce((sum, ba) => sum + this.parseDiceExpression(ba.damage), 0),
          oncePerTurnDamage: attackCalc.oncePerTurnEffects.reduce((sum, ot) => sum + this.parseDiceExpression(ot.damage), 0)
        },
        dprCurve,
        resources: {
          spellSlots: resources.spellSlots,
          classResources: {
            kiPoints: resources.kiPoints,
            rageUses: resources.rageUses,
            sorceryPoints: resources.sorceryPoints,
            superiorityDice: resources.superiorityDice
          }
        },
        keyFeatures,
        breakpoints
      });
    }
    
    return progression;
  }

  /**
   * Get attack calculation details for a build
   */
  private static getAttackCalculation(build: SimpleBuild): AttackCalculation {
    const classLevels = build.classLevels || [];
    const totalLevel = build.level || classLevels.reduce((sum, cl) => sum + cl.level, 0);
    const profBonus = Math.ceil(totalLevel / 4) + 1;
    const abilityScores = build.abilityScores || { strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 };
    
    // Determine primary attack ability
    const mainWeapon = build.equipment?.mainHand;
    let abilityMod = 0;
    
    if (mainWeapon?.properties?.includes('finesse')) {
      abilityMod = Math.max(
        Math.floor((abilityScores.strength - 10) / 2),
        Math.floor((abilityScores.dexterity - 10) / 2)
      );
    } else if (mainWeapon?.type === 'ranged') {
      abilityMod = Math.floor((abilityScores.dexterity - 10) / 2);
    } else {
      abilityMod = Math.floor((abilityScores.strength - 10) / 2);
    }
    
    // Calculate attack bonus
    const magicBonus = mainWeapon?.magic || 0;
    const attackBonus = profBonus + abilityMod + magicBonus;
    
    // Base damage
    const damageDice = mainWeapon?.damage || '1d8';
    let damageBonus = abilityMod + magicBonus + (mainWeapon?.damageBonus || 0);
    
    // Fighting style bonuses
    const fightingStyles = this.getFightingStyles(build);
    if (fightingStyles.includes('dueling') && !build.equipment?.offHand) {
      damageBonus += 2;
    }
    
    // Class feature damage bonuses
    if (this.hasRage(build)) {
      damageBonus += this.getRageDamageBonus(classLevels);
    }
    
    // Attack count (Extra Attack)
    let attackCount = 1;
    const fighterLevel = classLevels.find(cl => cl.class.toLowerCase() === 'fighter')?.level || 0;
    if (fighterLevel >= 20) attackCount = 4;
    else if (fighterLevel >= 11) attackCount = 3;
    else if (fighterLevel >= 5) attackCount = 2;
    
    // Other classes with Extra Attack
    const otherExtraAttackClasses = ['barbarian', 'paladin', 'ranger'];
    const hasOtherExtraAttack = classLevels.some(cl => 
      otherExtraAttackClasses.includes(cl.class.toLowerCase()) && cl.level >= 5
    );
    if (hasOtherExtraAttack && attackCount === 1) {
      attackCount = 2;
    }
    
    // Critical hit range
    let critRange = 1; // 20 only by default
    if (this.hasFeature(build, 'champion')) {
      if (fighterLevel >= 15) critRange = 3; // 18-20
      else if (fighterLevel >= 3) critRange = 2; // 19-20
    }
    
    // Bonus action attacks
    const bonusActionAttacks = this.getBonusActionAttacks(build);
    
    // Once-per-turn effects
    const oncePerTurnEffects = this.getOncePerTurnEffects(build);
    
    return {
      attackBonus,
      damageDice,
      damageBonus,
      attackCount,
      critRange,
      bonusActionAttacks,
      oncePerTurnEffects
    };
  }

  /**
   * Parse dice expression to average damage
   */
  private static parseDiceExpression(expression: string): number {
    try {
      // Handle expressions like "2d6+3", "1d8", "4"
      const parts = expression.toLowerCase().replace(/\s+/g, '').split(/[\+\-]/);
      let total = 0;
      let isNegative = false;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        let value = 0;
        
        if (part.includes('d')) {
          const [numDice, dieSize] = part.split('d').map(n => parseInt(n) || 1);
          value = numDice * (dieSize + 1) / 2; // Average of dice
        } else {
          value = parseInt(part) || 0;
        }
        
        if (i > 0) {
          // Determine if this part should be added or subtracted
          const operator = expression[expression.indexOf(parts[i - 1]) + parts[i - 1].length];
          isNegative = operator === '-';
        }
        
        total += isNegative ? -value : value;
        isNegative = false;
      }
      
      return Math.max(0, total);
    } catch (e) {
      console.warn('Failed to parse dice expression:', expression);
      return 0;
    }
  }

  /**
   * Scale class levels to target level
   */
  private static scaleClassLevelsToLevel(classLevels: Array<{class: string; level: number}>, targetLevel: number) {
    if (classLevels.length === 0) return [{ class: 'Fighter', level: targetLevel }];
    
    const totalLevels = classLevels.reduce((sum, cl) => sum + cl.level, 0);
    
    if (totalLevels <= targetLevel) {
      // Scale up proportionally
      const scaleFactor = targetLevel / totalLevels;
      let remainingLevels = targetLevel;
      
      return classLevels.map((cl, index) => {
        if (index === classLevels.length - 1) {
          // Last class gets remaining levels
          return { class: cl.class, level: remainingLevels };
        } else {
          const scaledLevel = Math.max(1, Math.floor(cl.level * scaleFactor));
          remainingLevels -= scaledLevel;
          return { class: cl.class, level: scaledLevel };
        }
      });
    } else {
      // Scale down proportionally
      const scaleFactor = targetLevel / totalLevels;
      let remainingLevels = targetLevel;
      
      return classLevels.map((cl, index) => {
        if (index === classLevels.length - 1) {
          return { class: cl.class, level: Math.max(1, remainingLevels) };
        } else {
          const scaledLevel = Math.max(1, Math.floor(cl.level * scaleFactor));
          remainingLevels -= scaledLevel;
          return { class: cl.class, level: scaledLevel };
        }
      });
    }
  }

  /**
   * Helper methods
   */
  private static hasFeature(build: SimpleBuild, featureId: string): boolean {
    if (!build.featureSelections) return false;
    
    return Object.values(build.featureSelections).some(selection => {
      return selection.selections?.includes(featureId) || 
             selection.improvements?.feat === featureId;
    });
  }

  private static getFightingStyles(build: SimpleBuild): string[] {
    const styles: string[] = [];
    if (!build.featureSelections) return styles;
    
    Object.values(build.featureSelections).forEach(selection => {
      if (selection.selections) {
        selection.selections.forEach(sel => {
          if (['archery', 'defense', 'dueling', 'great-weapon-fighting', 'protection', 'two-weapon-fighting'].includes(sel)) {
            styles.push(sel);
          }
        });
      }
    });
    
    return styles;
  }

  private static hasRage(build: SimpleBuild): boolean {
    return (build.classLevels || []).some(cl => cl.class.toLowerCase() === 'barbarian');
  }

  private static getRageDamageBonus(classLevels: Array<{class: string; level: number}>): number {
    const barbarianLevel = classLevels.find(cl => cl.class.toLowerCase() === 'barbarian')?.level || 0;
    if (barbarianLevel >= 16) return 4;
    if (barbarianLevel >= 9) return 3;
    return 2;
  }

  private static getBonusActionAttacks(build: SimpleBuild): Array<{damage: string; count: number; description: string}> {
    const attacks = [];
    const mainWeapon = build.equipment?.mainHand;
    const offHand = build.equipment?.offHand;
    
    // Two-weapon fighting
    if (mainWeapon && offHand) {
      attacks.push({
        damage: offHand.damage || '1d6',
        count: 1,
        description: 'Off-hand Attack'
      });
    }
    
    // Polearm Master
    if (this.hasFeature(build, 'polearm-master')) {
      attacks.push({
        damage: '1d4+' + Math.floor(((build.abilityScores?.strength || 15) - 10) / 2),
        count: 1,
        description: 'Polearm Master'
      });
    }
    
    return attacks;
  }

  private static getOncePerTurnEffects(build: SimpleBuild): Array<{damage: string; description: string}> {
    const effects = [];
    const classLevels = build.classLevels || [];
    
    // Sneak Attack
    const rogueLevel = classLevels.find(cl => cl.class.toLowerCase() === 'rogue')?.level || 0;
    if (rogueLevel > 0) {
      const sneakDice = Math.ceil(rogueLevel / 2);
      effects.push({
        damage: `${sneakDice}d6`,
        description: 'Sneak Attack'
      });
    }
    
    return effects;
  }

  private static getKeyFeaturesAtLevel(classLevels: Array<{class: string; level: number}>, totalLevel: number): string[] {
    const features = [];
    
    for (const cl of classLevels) {
      const className = cl.class.toLowerCase();
      const level = cl.level;
      
      // Major feature milestones
      if (level === 1) features.push(`${cl.class} Base Features`);
      if (level === 2 && ['fighter', 'ranger'].includes(className)) features.push('Fighting Style');
      if (level === 3) features.push(`${cl.class} Subclass`);
      if (level === 5 && ['fighter', 'barbarian', 'paladin', 'ranger'].includes(className)) features.push('Extra Attack');
      if (level === 11 && className === 'fighter') features.push('Extra Attack (2)');
      if (level === 20 && className === 'fighter') features.push('Extra Attack (3)');
    }
    
    // Proficiency bonus increases
    const profBonus = Math.ceil(totalLevel / 4) + 1;
    if ([5, 9, 13, 17].includes(totalLevel)) {
      features.push(`Proficiency Bonus +${profBonus}`);
    }
    
    return features;
  }

  private static analyzeBreakpoints(classLevels: Array<{class: string; level: number}>, totalLevel: number) {
    const newFeatures = this.getKeyFeaturesAtLevel(classLevels, totalLevel);
    const attacksIncrease = newFeatures.some(f => f.includes('Extra Attack'));
    const spellProgression = classLevels.some(cl => 
      ['wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'warlock', 'paladin', 'ranger'].includes(cl.class.toLowerCase()) &&
      cl.level >= 1
    );
    const majorImprovement = newFeatures.length > 0 || [4, 8, 12, 16, 19].includes(totalLevel); // ASI levels
    
    return {
      newFeatures,
      attacksIncrease,
      spellProgression,
      majorImprovement
    };
  }
}
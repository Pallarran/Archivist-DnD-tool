import { Build, LevelAnalysis, ClassLevel } from '../types/build';
import { getProficiencyBonus, getAttacksPerAction, getSpellSlots, getFeaturesAtLevel } from '../data/classProgression';

export class LevelAnalysisEngine {
  // Calculate DPR analysis for a build at all levels 1-20
  static analyzeBuildProgression(build: Build): LevelAnalysis[] {
    const results: LevelAnalysis[] = [];
    
    for (let level = 1; level <= 20; level++) {
      const analysis = this.analyzeBuildAtLevel(build, level);
      results.push(analysis);
    }
    
    return results;
  }

  // Calculate analysis for a build at a specific level
  static analyzeBuildAtLevel(build: Build, targetLevel: number): LevelAnalysis {
    const proficiencyBonus = getProficiencyBonus(targetLevel);
    
    // Calculate effective class levels for multiclass builds
    const classLevels = this.calculateClassLevels(build.levels, targetLevel);
    const primaryClass = this.getPrimaryClass(classLevels);
    
    // Calculate hit points
    const { hitPointsAverage, hitPointsMax } = this.calculateHitPoints(classLevels, build.abilities.constitution);
    
    // Calculate attacks per action (use highest from any class)
    const attacksPerAction = this.calculateAttacksPerAction(classLevels);
    
    // Calculate spell slots (combine if multiclass spellcaster)
    const spellSlots = this.calculateSpellSlots(classLevels);
    
    // Calculate DPR for different advantage states
    const dpr = this.calculateDPRAtLevel(build, targetLevel, proficiencyBonus, attacksPerAction);
    
    // Get features gained at this level
    const features = this.getFeaturesAtLevel(classLevels, targetLevel);
    
    // Identify breakpoints
    const breakpoints = this.identifyBreakpoints(classLevels, targetLevel, features);
    
    return {
      level: targetLevel,
      proficiencyBonus,
      hitPointsAverage,
      hitPointsMax,
      attacksPerAction,
      spellSlots,
      dpr,
      features,
      breakpoints
    };
  }

  private static calculateClassLevels(buildLevels: ClassLevel[], targetLevel: number): Array<{class: string; level: number}> {
    // For multiclass builds, distribute levels proportionally up to target level
    const totalBuildLevel = buildLevels.reduce((sum, cl) => sum + cl.level, 0);
    
    if (totalBuildLevel <= targetLevel) {
      // Build doesn't exceed target level, use as-is
      return buildLevels.map(cl => ({ class: cl.class, level: cl.level }));
    }
    
    // Scale down proportionally to fit target level
    const scaleFactor = targetLevel / totalBuildLevel;
    const scaledLevels: Array<{class: string; level: number}> = [];
    let remainingLevels = targetLevel;
    
    for (let i = 0; i < buildLevels.length; i++) {
      const cl = buildLevels[i];
      if (i === buildLevels.length - 1) {
        // Last class gets remaining levels
        scaledLevels.push({ class: cl.class, level: remainingLevels });
      } else {
        const levelForThisClass = Math.max(1, Math.floor(cl.level * scaleFactor));
        scaledLevels.push({ class: cl.class, level: levelForThisClass });
        remainingLevels -= levelForThisClass;
      }
    }
    
    return scaledLevels;
  }

  private static getPrimaryClass(classLevels: Array<{class: string; level: number}>): string {
    return classLevels.reduce((primary, current) => 
      current.level > primary.level ? current : primary
    ).class;
  }

  private static calculateHitPoints(classLevels: Array<{class: string; level: number}>, constitution: number): {hitPointsAverage: number; hitPointsMax: number} {
    const conModifier = Math.floor((constitution - 10) / 2);
    
    let hitPointsAverage = 0;
    let hitPointsMax = 0;
    
    for (const {class: className, level} of classLevels) {
      const hitDie = this.getClassHitDie(className);
      const avgPerLevel = (hitDie / 2) + 0.5; // Average of hit die
      
      // First level gets max HP
      if (level >= 1) {
        hitPointsMax += hitDie + conModifier;
        hitPointsAverage += hitDie + conModifier;
        
        // Subsequent levels
        for (let i = 2; i <= level; i++) {
          hitPointsMax += hitDie + conModifier;
          hitPointsAverage += avgPerLevel + conModifier;
        }
      }
    }
    
    return { hitPointsAverage: Math.floor(hitPointsAverage), hitPointsMax };
  }

  private static getClassHitDie(className: string): number {
    const hitDice: Record<string, number> = {
      'Fighter': 10,
      'Rogue': 8,
      'Ranger': 10,
      'Barbarian': 12,
      'Paladin': 10,
      'Wizard': 6,
      'Sorcerer': 6,
      'Warlock': 8,
      'Bard': 8,
      'Cleric': 8,
      'Druid': 8,
      'Monk': 8,
      'Artificer': 8
    };
    return hitDice[className] || 8;
  }

  private static calculateAttacksPerAction(classLevels: Array<{class: string; level: number}>): number {
    let maxAttacks = 1;
    
    for (const {class: className, level} of classLevels) {
      const attacks = getAttacksPerAction(className, level);
      maxAttacks = Math.max(maxAttacks, attacks);
    }
    
    return maxAttacks;
  }

  private static calculateSpellSlots(classLevels: Array<{class: string; level: number}>): Record<string, number> {
    // For now, just use the primary spellcasting class
    // In a full implementation, this would handle multiclass spellcasting rules
    for (const {class: className, level} of classLevels) {
      const slots = getSpellSlots(className, level);
      if (Object.keys(slots).length > 0) {
        return slots;
      }
    }
    return {};
  }

  private static getFeaturesAtLevel(classLevels: Array<{class: string; level: number}>, targetLevel: number) {
    const features: any[] = [];
    
    for (const {class: className, level} of classLevels) {
      if (level >= targetLevel) {
        const classFeatures = getFeaturesAtLevel(className, targetLevel);
        features.push(...classFeatures);
      }
    }
    
    return features;
  }

  private static identifyBreakpoints(classLevels: Array<{class: string; level: number}>, targetLevel: number, features: any[]) {
    const breakpoints: any = {};
    
    // Check for major features
    const majorFeatures = features.filter(f => 
      f.name.includes('Extra Attack') || 
      f.name.includes('Sneak Attack') && f.name.includes('d6') ||
      f.name.includes('Archetype') ||
      f.name.includes('Fighting Style')
    );
    
    if (majorFeatures.length > 0) {
      breakpoints.majorFeature = majorFeatures[0].name;
    }
    
    // Check for ASI levels
    if (features.some(f => f.category === 'asi')) {
      breakpoints.asi = true;
    }
    
    // Check for new spell levels
    for (const {class: className, level} of classLevels) {
      const spellSlots = getSpellSlots(className, targetLevel);
      const prevSpellSlots = targetLevel > 1 ? getSpellSlots(className, targetLevel - 1) : {};
      
      for (const [slotLevel, count] of Object.entries(spellSlots)) {
        if (count > 0 && (!prevSpellSlots[slotLevel] || prevSpellSlots[slotLevel] === 0)) {
          breakpoints.spellLevel = parseInt(slotLevel);
          break;
        }
      }
    }
    
    return breakpoints;
  }

  private static calculateDPRAtLevel(build: Build, level: number, proficiencyBonus: number, attacksPerAction: number) {
    // Calculate weapon-based DPR
    const weaponDPR = this.calculateWeaponDPR(build, proficiencyBonus, attacksPerAction);
    
    // Calculate spell-based DPR
    const spellDPR = this.calculateSpellDPR(build, level, proficiencyBonus);
    
    // Calculate off-turn action DPR (opportunity attacks, reactions)
    const offTurnDPR = this.calculateOffTurnDPR(build, level, proficiencyBonus);
    
    // Combine all DPR sources
    return {
      normal: weaponDPR.normal + spellDPR.normal + offTurnDPR.normal,
      advantage: weaponDPR.advantage + spellDPR.advantage + offTurnDPR.advantage,
      disadvantage: weaponDPR.disadvantage + spellDPR.disadvantage + offTurnDPR.disadvantage
    };
  }

  private static calculateWeaponDPR(build: Build, proficiencyBonus: number, attacksPerAction: number) {
    const baseAttackBonus = proficiencyBonus + this.getAbilityModifier(build.abilities.strength, build.abilities.dexterity);
    const weapon = build.equipment.mainHand;
    const baseDamage = weapon ? this.parseDamageString(weapon.damage) : 8;
    const damageBonus = this.getAbilityModifier(build.abilities.strength, build.abilities.dexterity);
    
    // Default AC for calculations
    const targetAC = 15;
    
    // Calculate hit chances
    const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - baseAttackBonus)) / 20));
    const advantageHitChance = 1 - Math.pow(1 - normalHitChance, 2);
    const disadvantageHitChance = Math.pow(normalHitChance, 2);
    
    // Calculate DPR
    const totalDamage = (baseDamage + damageBonus) * attacksPerAction;
    const normalDPR = normalHitChance * totalDamage;
    const advantageDPR = advantageHitChance * totalDamage;
    const disadvantageDPR = disadvantageHitChance * totalDamage;
    
    return {
      normal: normalDPR,
      advantage: advantageDPR,
      disadvantage: disadvantageDPR
    };
  }

  private static calculateSpellDPR(build: Build, level: number, proficiencyBonus: number) {
    // Get class levels for spellcasting
    const classLevels = this.calculateClassLevels(build.levels, level);
    
    let totalSpellDPR = { normal: 0, advantage: 0, disadvantage: 0 };
    
    // Check each class for spellcasting abilities
    for (const {class: className, level: classLevel} of classLevels) {
      const spellDPR = this.calculateClassSpellDPR(className, classLevel, build, proficiencyBonus);
      totalSpellDPR.normal += spellDPR.normal;
      totalSpellDPR.advantage += spellDPR.advantage;
      totalSpellDPR.disadvantage += spellDPR.disadvantage;
    }
    
    return totalSpellDPR;
  }

  private static calculateClassSpellDPR(className: string, classLevel: number, build: Build, proficiencyBonus: number) {
    // For now, implement basic spell DPR for known spellcasting classes
    switch (className) {
      case 'Ranger':
        return this.calculateRangerSpellDPR(classLevel, build, proficiencyBonus);
      case 'Eldritch Knight': // Fighter subclass
        return this.calculateEldritchKnightSpellDPR(classLevel, build, proficiencyBonus);
      case 'Arcane Trickster': // Rogue subclass
        return this.calculateArcaneTricksterSpellDPR(classLevel, build, proficiencyBonus);
      default:
        return { normal: 0, advantage: 0, disadvantage: 0 };
    }
  }

  private static calculateRangerSpellDPR(level: number, build: Build, proficiencyBonus: number) {
    if (level < 2) return { normal: 0, advantage: 0, disadvantage: 0 }; // Rangers get spells at level 2
    
    const spellAttackBonus = proficiencyBonus + Math.floor((build.abilities.wisdom - 10) / 2);
    const spellSaveDC = 8 + proficiencyBonus + Math.floor((build.abilities.wisdom - 10) / 2);
    
    // Calculate single-target and AoE spell contributions
    const singleTargetDPR = this.calculateSingleTargetSpellDPR(level, spellAttackBonus, spellSaveDC, 'ranger');
    const aoeDPR = this.calculateAoESpellDPR(level, spellSaveDC, 'ranger');
    
    return {
      normal: singleTargetDPR.normal + aoeDPR.normal,
      advantage: singleTargetDPR.advantage + aoeDPR.advantage,
      disadvantage: singleTargetDPR.disadvantage + aoeDPR.disadvantage
    };
  }

  private static calculateEldritchKnightSpellDPR(level: number, build: Build, proficiencyBonus: number) {
    if (level < 3) return { normal: 0, advantage: 0, disadvantage: 0 }; // EK gets spells at level 3
    
    const spellAttackBonus = proficiencyBonus + Math.floor((build.abilities.intelligence - 10) / 2);
    const spellSaveDC = 8 + proficiencyBonus + Math.floor((build.abilities.intelligence - 10) / 2);
    
    // Calculate cantrip damage (primary spell damage for EK)
    const cantripDPR = this.calculateEldritchKnightCantripDPR(level, spellAttackBonus);
    
    // Calculate AoE spell contribution
    const aoeDPR = this.calculateAoESpellDPR(level, spellSaveDC, 'eldritch_knight');
    
    return {
      normal: cantripDPR.normal + aoeDPR.normal,
      advantage: cantripDPR.advantage + aoeDPR.advantage,
      disadvantage: cantripDPR.disadvantage + aoeDPR.disadvantage
    };
  }

  private static calculateEldritchKnightCantripDPR(level: number, spellAttackBonus: number) {
    // Cantrips scale with total character level, not class level
    let spellDamage = 0;
    
    if (level >= 17) spellDamage = 22; // 4d10 Fire Bolt
    else if (level >= 11) spellDamage = 16.5; // 3d10 Fire Bolt
    else if (level >= 5) spellDamage = 11; // 2d10 Fire Bolt
    else spellDamage = 5.5; // 1d10 Fire Bolt
    
    const targetAC = 15;
    const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - spellAttackBonus)) / 20));
    const advantageHitChance = 1 - Math.pow(1 - normalHitChance, 2);
    const disadvantageHitChance = Math.pow(normalHitChance, 2);
    
    // EKs typically use cantrips as a backup option, not primary damage
    const usageRate = 0.3; // Used roughly 30% of the time
    
    return {
      normal: normalHitChance * spellDamage * usageRate,
      advantage: advantageHitChance * spellDamage * usageRate,
      disadvantage: disadvantageHitChance * spellDamage * usageRate
    };
  }

  private static calculateArcaneTricksterSpellDPR(level: number, build: Build, proficiencyBonus: number) {
    if (level < 3) return { normal: 0, advantage: 0, disadvantage: 0 }; // AT gets spells at level 3
    
    const spellAttackBonus = proficiencyBonus + Math.floor((build.abilities.intelligence - 10) / 2);
    
    // Simplified AT spell damage (mostly utility, some damage cantrips)
    let spellDamage = 0;
    
    if (level >= 3) {
      // Minor damage from cantrips like Mage Hand legerdemain or occasional damage spell
      spellDamage = 2; // Very limited damage contribution
    }
    
    const targetAC = 15;
    const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - spellAttackBonus)) / 20));
    const advantageHitChance = 1 - Math.pow(1 - normalHitChance, 2);
    const disadvantageHitChance = Math.pow(normalHitChance, 2);
    
    return {
      normal: normalHitChance * spellDamage,
      advantage: advantageHitChance * spellDamage,
      disadvantage: disadvantageHitChance * spellDamage
    };
  }

  private static getAbilityModifier(str: number, dex: number): number {
    // Use higher of STR or DEX for damage calculations (simplified)
    const primaryStat = Math.max(str, dex);
    return Math.floor((primaryStat - 10) / 2);
  }

  private static calculateSingleTargetSpellDPR(level: number, spellAttackBonus: number, spellSaveDC: number, casterType: string) {
    const targetAC = 15; // Default AC
    const targetSaveBonus = 2; // Average save bonus
    
    let spellDamage = 0;
    let saveBasedDamage = 0;
    
    if (casterType === 'ranger') {
      if (level >= 2) {
        // Hunter's Mark or similar concentration spell
        spellDamage = 3.5; // 1d6 average, applied to weapon attacks
      }
      
      if (level >= 5) {
        // 2nd level spells like Flame Arrows
        saveBasedDamage = 7; // 2d6 average
      }
      
      if (level >= 9) {
        // 3rd level spells like Conjure Barrage
        saveBasedDamage = 10.5; // 3d6 average
      }
    }
    
    // Calculate hit chances for spell attacks
    const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - spellAttackBonus)) / 20));
    const advantageHitChance = 1 - Math.pow(1 - normalHitChance, 2);
    const disadvantageHitChance = Math.pow(normalHitChance, 2);
    
    // Calculate save success rates
    const saveChance = Math.max(0.05, Math.min(0.95, (spellSaveDC - targetSaveBonus - 1) / 20));
    const saveFailureRate = 1 - saveChance;
    const saveDamage = saveBasedDamage * saveFailureRate + (saveBasedDamage * 0.5 * saveChance); // Half damage on save
    
    return {
      normal: (normalHitChance * spellDamage) + saveDamage,
      advantage: (advantageHitChance * spellDamage) + saveDamage, // Save spells don't benefit from advantage
      disadvantage: (disadvantageHitChance * spellDamage) + saveDamage
    };
  }

  private static calculateAoESpellDPR(level: number, spellSaveDC: number, casterType: string) {
    // AoE spell calculations with multi-target considerations
    const averageTargetsHit = this.getAverageTargetsHit(level);
    const targetSaveBonus = 2; // Average save bonus
    
    let aoeDamage = 0;
    let useRate = 0; // How often AoE spells are used per round
    
    if (casterType === 'ranger') {
      if (level >= 9) {
        // 3rd level AoE spells like Conjure Barrage
        aoeDamage = 10.5; // 3d6 average
        useRate = 0.2; // Used roughly once every 5 rounds
      }
      
      if (level >= 13) {
        // 4th level AoE spells
        aoeDamage = 14; // 4d6 average
        useRate = 0.25; // Slightly more frequent use
      }
      
      if (level >= 17) {
        // 5th level AoE spells
        aoeDamage = 17.5; // 5d6 average
        useRate = 0.3; // More frequent use at high levels
      }
    } else if (casterType === 'eldritch_knight') {
      if (level >= 7) {
        // Access to 2nd level AoE spells like Shatter
        aoeDamage = 9; // 3d8 average
        useRate = 0.15; // Limited spell slots
      }
      
      if (level >= 13) {
        // 3rd level AoE spells like Fireball
        aoeDamage = 28; // 8d6 average
        useRate = 0.2; // Still limited slots but more impactful
      }
    }
    
    if (aoeDamage === 0) {
      return { normal: 0, advantage: 0, disadvantage: 0 };
    }
    
    // Calculate save success rates
    const saveChance = Math.max(0.05, Math.min(0.95, (spellSaveDC - targetSaveBonus - 1) / 20));
    const saveFailureRate = 1 - saveChance;
    
    // AoE damage calculation: (targets hit) * (damage per target) * (usage rate)
    const damagePerTarget = (aoeDamage * saveFailureRate) + (aoeDamage * 0.5 * saveChance); // Half damage on save
    const totalAoEDPR = averageTargetsHit * damagePerTarget * useRate;
    
    return {
      normal: totalAoEDPR,
      advantage: totalAoEDPR, // AoE save spells don't benefit from advantage
      disadvantage: totalAoEDPR
    };
  }

  private static calculateOffTurnDPR(build: Build, level: number, proficiencyBonus: number) {
    const classLevels = this.calculateClassLevels(build.levels, level);
    
    let totalOffTurnDPR = { normal: 0, advantage: 0, disadvantage: 0 };
    
    // Calculate opportunity attacks
    const opportunityAttackDPR = this.calculateOpportunityAttackDPR(build, proficiencyBonus);
    totalOffTurnDPR.normal += opportunityAttackDPR.normal;
    totalOffTurnDPR.advantage += opportunityAttackDPR.advantage;
    totalOffTurnDPR.disadvantage += opportunityAttackDPR.disadvantage;
    
    // Calculate class-specific reaction attacks
    for (const {class: className, level: classLevel} of classLevels) {
      const reactionDPR = this.calculateClassReactionDPR(className, classLevel, build, proficiencyBonus);
      totalOffTurnDPR.normal += reactionDPR.normal;
      totalOffTurnDPR.advantage += reactionDPR.advantage;
      totalOffTurnDPR.disadvantage += reactionDPR.disadvantage;
    }
    
    return totalOffTurnDPR;
  }

  private static calculateOpportunityAttackDPR(build: Build, proficiencyBonus: number) {
    // Basic opportunity attack calculation
    const baseAttackBonus = proficiencyBonus + this.getAbilityModifier(build.abilities.strength, build.abilities.dexterity);
    const weapon = build.equipment.mainHand;
    const baseDamage = weapon ? this.parseDamageString(weapon.damage) : 8;
    const damageBonus = this.getAbilityModifier(build.abilities.strength, build.abilities.dexterity);
    
    const targetAC = 15; // Default AC
    const opportunityChance = 0.3; // Estimate 30% chance per round for opportunity attack
    
    // Calculate hit chances
    const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - baseAttackBonus)) / 20));
    const advantageHitChance = 1 - Math.pow(1 - normalHitChance, 2);
    const disadvantageHitChance = Math.pow(normalHitChance, 2);
    
    const totalDamage = baseDamage + damageBonus;
    
    return {
      normal: normalHitChance * totalDamage * opportunityChance,
      advantage: advantageHitChance * totalDamage * opportunityChance,
      disadvantage: disadvantageHitChance * totalDamage * opportunityChance
    };
  }

  private static calculateClassReactionDPR(className: string, classLevel: number, build: Build, proficiencyBonus: number) {
    switch (className) {
      case 'Fighter':
        return this.calculateFighterReactionDPR(classLevel, build, proficiencyBonus);
      case 'Rogue':
        return this.calculateRogueReactionDPR(classLevel, build, proficiencyBonus);
      case 'Ranger':
        return this.calculateRangerReactionDPR(classLevel, build, proficiencyBonus);
      default:
        return { normal: 0, advantage: 0, disadvantage: 0 };
    }
  }

  private static calculateFighterReactionDPR(level: number, build: Build, proficiencyBonus: number) {
    let reactionDPR = { normal: 0, advantage: 0, disadvantage: 0 };
    
    // Battle Master Riposte (assuming Battle Master subclass)
    if (level >= 3) {
      const baseAttackBonus = proficiencyBonus + this.getAbilityModifier(build.abilities.strength, build.abilities.dexterity);
      const weapon = build.equipment.mainHand;
      const baseDamage = weapon ? this.parseDamageString(weapon.damage) : 8;
      const damageBonus = this.getAbilityModifier(build.abilities.strength, build.abilities.dexterity);
      
      // Superiority die damage
      let superiorityDie = 8; // d8 at levels 3-9
      if (level >= 10) superiorityDie = 10; // d10 at levels 10-17
      if (level >= 18) superiorityDie = 12; // d12 at levels 18+
      
      const superiorityDieAverage = (superiorityDie / 2) + 0.5;
      const totalDamage = baseDamage + damageBonus + superiorityDieAverage;
      
      const targetAC = 15;
      const riposteChance = 0.2; // Estimate 20% chance per round for riposte opportunity
      
      const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - baseAttackBonus)) / 20));
      const advantageHitChance = 1 - Math.pow(1 - normalHitChance, 2);
      const disadvantageHitChance = Math.pow(normalHitChance, 2);
      
      reactionDPR.normal += normalHitChance * totalDamage * riposteChance;
      reactionDPR.advantage += advantageHitChance * totalDamage * riposteChance;
      reactionDPR.disadvantage += disadvantageHitChance * totalDamage * riposteChance;
    }
    
    return reactionDPR;
  }

  private static calculateRogueReactionDPR(level: number, build: Build, proficiencyBonus: number) {
    // Rogues don't have many reaction-based attacks, but they might have opportunity attacks with Sneak Attack
    const opportunityWithSneakChance = 0.1; // 10% chance to get Sneak Attack on opportunity attack
    
    if (opportunityWithSneakChance > 0) {
      const sneakAttackDice = Math.ceil(level / 2);
      const sneakAttackDamage = sneakAttackDice * 3.5; // d6 average
      
      const baseAttackBonus = proficiencyBonus + this.getAbilityModifier(build.abilities.strength, build.abilities.dexterity);
      const targetAC = 15;
      
      const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - baseAttackBonus)) / 20));
      const advantageHitChance = 1 - Math.pow(1 - normalHitChance, 2);
      const disadvantageHitChance = Math.pow(normalHitChance, 2);
      
      return {
        normal: normalHitChance * sneakAttackDamage * opportunityWithSneakChance,
        advantage: advantageHitChance * sneakAttackDamage * opportunityWithSneakChance,
        disadvantage: disadvantageHitChance * sneakAttackDamage * opportunityWithSneakChance
      };
    }
    
    return { normal: 0, advantage: 0, disadvantage: 0 };
  }

  private static calculateRangerReactionDPR(level: number, build: Build, proficiencyBonus: number) {
    // Rangers don't have many reaction attacks, but Hunter's Mark can apply to opportunity attacks
    if (level >= 2) {
      const huntersMarkChance = 0.2; // 20% chance Hunter's Mark is up and applies to opportunity attack
      const huntersMarkDamage = 3.5; // 1d6 average
      
      const baseAttackBonus = proficiencyBonus + this.getAbilityModifier(build.abilities.strength, build.abilities.dexterity);
      const targetAC = 15;
      
      const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - baseAttackBonus)) / 20));
      const advantageHitChance = 1 - Math.pow(1 - normalHitChance, 2);
      const disadvantageHitChance = Math.pow(normalHitChance, 2);
      
      return {
        normal: normalHitChance * huntersMarkDamage * huntersMarkChance,
        advantage: advantageHitChance * huntersMarkDamage * huntersMarkChance,
        disadvantage: disadvantageHitChance * huntersMarkDamage * huntersMarkChance
      };
    }
    
    return { normal: 0, advantage: 0, disadvantage: 0 };
  }

  private static getAverageTargetsHit(level: number): number {
    // Estimate average number of targets hit by AoE spells based on level and encounter design
    if (level <= 4) return 1.5; // Early levels, smaller encounters
    if (level <= 8) return 2.0; // Mid levels, moderate encounters
    if (level <= 12) return 2.5; // Higher levels, larger encounters
    if (level <= 16) return 3.0; // High levels, complex encounters
    return 3.5; // Epic levels, massive encounters
  }

  private static parseDamageString(damage: string): number {
    // Simple damage parsing - in full implementation this would handle complex dice expressions
    if (damage.includes('d8')) return 4.5;
    if (damage.includes('d6')) return 3.5;
    if (damage.includes('d10')) return 5.5;
    if (damage.includes('d12')) return 6.5;
    if (damage.includes('d4')) return 2.5;
    return parseFloat(damage) || 4.5;
  }
}
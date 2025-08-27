/**
 * Simple Build Lab with ability score management
 * Integration with simplified store for persistent character builds
 */

import React, { useState, useEffect } from 'react';
import { useSimpleStore, type SimpleBuild } from '../store/simpleStore';
import { BasicAbilityScoreForm, type AbilityScores } from '../components/forms/BasicAbilityScoreForm';
import { ClassLevelForm } from '../components/forms/ClassLevelForm';
import { EquipmentForm } from '../components/forms/EquipmentForm';
import { ClassFeatureDisplay, type FeatureSelection } from '../components/forms/ClassFeatureDisplay';
import type { Equipment, ClassLevel } from '../types/build';
import { 
  calculateClassResources, 
  optimizeSpellSlotUsage, 
  analyzeSpellSynergies,
  getMulticlassSpellSlots,
  calculateMulticlassSpellcasterLevel,
  type ClassResources
} from '../utils/multiclassSpellcasting';

// Import feats for half-feat ability score handling
const COMMON_FEATS = [
  { id: 'athlete', name: 'Athlete', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true },
  { id: 'durable', name: 'Durable', fixedAbility: 'constitution', isHalfFeat: true },
  { id: 'elven-accuracy', name: 'Elven Accuracy', abilityOptions: ['dexterity', 'intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'fey-touched', name: 'Fey Touched', abilityOptions: ['intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'great-weapon-master', name: 'Great Weapon Master', isHalfFeat: false },
  { id: 'heavy-armor-master', name: 'Heavy Armor Master', fixedAbility: 'strength', isHalfFeat: true },
  { id: 'inspiring-leader', name: 'Inspiring Leader', fixedAbility: 'charisma', isHalfFeat: true },
  { id: 'keen-mind', name: 'Keen Mind', fixedAbility: 'intelligence', isHalfFeat: true },
  { id: 'moderately-armored', name: 'Moderately Armored', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true },
  { id: 'observant', name: 'Observant', abilityOptions: ['intelligence', 'wisdom'], isHalfFeat: true },
  { id: 'piercer', name: 'Piercer', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true },
  { id: 'resilient', name: 'Resilient', abilityOptions: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'shadow-touched', name: 'Shadow Touched', abilityOptions: ['intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'sharpshooter', name: 'Sharpshooter', isHalfFeat: false },
  { id: 'skill-expert', name: 'Skill Expert', abilityOptions: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'slasher', name: 'Slasher', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true },
  { id: 'telekinetic', name: 'Telekinetic', abilityOptions: ['intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'telepathic', name: 'Telepathic', abilityOptions: ['intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'weapon-master', name: 'Weapon Master', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true },
  { id: 'savage-attacker', name: 'Savage Attacker', isHalfFeat: false },
  // Add other feats as needed
] as const;

// Extended build interface for Build Lab
interface DetailedBuild {
  id: string;
  name: string;
  level: number;
  attackBonus: number;
  damage: string;
  notes?: string;
  createdAt: string;
  
  // Additional Build Lab properties
  abilityScores: AbilityScores;
  race?: string;
  classLevels: ClassLevel[];
  background?: string;
}

export const SimpleBuildLab: React.FC = () => {
  // Store integration
  const builds = useSimpleStore((state) => state.builds);
  const selectedBuild = useSimpleStore((state) => state.getSelectedBuild());
  const { addBuild, updateBuild, deleteBuild, selectBuild, addNotification } = useSimpleStore();

  // Build creation/editing state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingBuild, setEditingBuild] = useState<SimpleBuild | null>(null);
  const [activeTab, setActiveTab] = useState<'basics' | 'abilities' | 'classes' | 'equipment'>('basics');
  
  // Form state
  const [buildName, setBuildName] = useState<string>('');
  const [buildRace, setBuildRace] = useState<string>('Human');
  const [buildBackground, setBuildBackground] = useState<string>('Soldier');
  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  });
  const [abilityScoreMethod, setAbilityScoreMethod] = useState<'pointBuy' | 'standardArray' | 'manual'>('pointBuy');
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([{
    class: 'fighter',
    level: 1,
    hitDie: 10,
    subclass: '',
  }]);
  const [equipment, setEquipment] = useState<Equipment>({
    mainHand: null,
    offHand: null,
    armor: null,
    accessories: []
  });
  const [featureSelections, setFeatureSelections] = useState<{ [featureId: string]: FeatureSelection }>({});

  // Common D&D races and backgrounds
  const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
  const backgrounds = ['Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier', 'Charlatan', 'Entertainer', 'Guild Artisan', 'Hermit', 'Outlander', 'Sailor'];

  // Calculate derived stats
  const getAbilityModifier = (score: number): number => Math.floor((score - 10) / 2);
  
  const getTotalLevel = (): number => {
    return classLevels.reduce((total, cl) => total + cl.level, 0);
  };

  const getFightingStyles = (): string[] => {
    const styles: string[] = [];
    Object.values(featureSelections).forEach(selection => {
      if (selection.selections) {
        selection.selections.forEach(selectionId => {
          // Check if this selection is a fighting style
          if (['archery', 'defense', 'dueling', 'great-weapon-fighting', 'protection', 'two-weapon-fighting'].includes(selectionId)) {
            styles.push(selectionId);
          }
        });
      }
    });
    return styles;
  };

  const getExtraAttacks = (): number => {
    let extraAttacks = 0;
    classLevels.forEach(classLevel => {
      const className = classLevel.class.toLowerCase();
      const level = classLevel.level;
      
      // Fighter gets extra attacks at levels 5, 11, and 20
      if (className === 'fighter') {
        if (level >= 20) extraAttacks += 3;
        else if (level >= 11) extraAttacks += 2;
        else if (level >= 5) extraAttacks += 1;
      }
      // Other classes get extra attack at level 5
      else if (['barbarian', 'paladin', 'ranger'].includes(className) && level >= 5) {
        extraAttacks += 1;
      }
    });
    return extraAttacks;
  };
  
  const calculateAttackBonus = (): number => {
    // Attack bonus calculation: proficiency bonus + ability modifier + equipment bonus + fighting style bonus + feat bonuses
    const totalLevel = getTotalLevel();
    const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;
    const selectedFeats = getSelectedFeats();
    const halfFeatBonuses = getHalfFeatAbilityBonuses();
    let primaryAbilityMod = 0;
    let equipmentBonus = 0;
    let fightingStyleBonus = 0;
    let featBonus = 0;

    // Get weapon for primary attack
    const weapon = equipment.mainHand;
    
    // Use the first (primary) class for attack bonus calculation
    const primaryClass = classLevels[0]?.class.toLowerCase() || 'fighter';

    // Check for fighting style bonuses
    const fightingStyles = getFightingStyles();
    if (fightingStyles.includes('archery') && weapon?.type === 'ranged') {
      fightingStyleBonus += 2; // Archery fighting style gives +2 to ranged attacks
    }

    // Determine primary ability based on class and weapon
    if (weapon && weapon.properties.includes('finesse')) {
      // Finesse weapons can use Str or Dex - choose the better one
      primaryAbilityMod = Math.max(
        getAbilityModifier(abilityScores.strength),
        getAbilityModifier(abilityScores.dexterity)
      );
    } else if (weapon && weapon.type === 'ranged') {
      // Ranged weapons use Dex
      primaryAbilityMod = getAbilityModifier(abilityScores.dexterity);
    } else {
      // Default class-based ability
      switch (primaryClass) {
        case 'barbarian':
        case 'fighter':
        case 'paladin':
          primaryAbilityMod = getAbilityModifier(abilityScores.strength);
          break;
        case 'monk':
        case 'ranger':
        case 'rogue':
          primaryAbilityMod = getAbilityModifier(abilityScores.dexterity);
          break;
        case 'cleric':
        case 'druid':
          primaryAbilityMod = getAbilityModifier(abilityScores.wisdom);
          break;
        case 'sorcerer':
        case 'warlock':
        case 'bard':
          primaryAbilityMod = getAbilityModifier(abilityScores.charisma);
          break;
        case 'wizard':
          primaryAbilityMod = getAbilityModifier(abilityScores.intelligence);
          break;
        default:
          primaryAbilityMod = getAbilityModifier(abilityScores.strength);
      }
    }

    // Add equipment bonuses
    if (weapon?.magic) {
      equipmentBonus += weapon.magic;
    }
    if (weapon?.toHitBonus) {
      equipmentBonus += weapon.toHitBonus;
    }
    
    // Feat penalties (power attack features)
    // Note: This shows the penalty in the attack bonus, but in actual combat
    // the player chooses whether to use power attack each turn
    if (selectedFeats.includes('great-weapon-master') && weapon && weapon.properties.some(p => ['heavy', 'two-handed'].includes(p))) {
      // Don't apply penalty by default - this is a choice
      // featBonus -= 5; 
    }
    if (selectedFeats.includes('sharpshooter') && weapon && weapon.type === 'ranged') {
      // Don't apply penalty by default - this is a choice  
      // featBonus -= 5;
    }
    
    // Other feat bonuses
    // Most feats don't provide direct attack bonuses, but some half-feats boost ability scores
    // which are already included in the ability modifier calculation

    return proficiencyBonus + primaryAbilityMod + equipmentBonus + fightingStyleBonus + featBonus;
  };

  // Get selected feats from feature selections
  const getSelectedFeats = (): Array<{feat: string; abilityChoice?: string}> => {
    const feats: Array<{feat: string; abilityChoice?: string}> = [];
    Object.values(featureSelections).forEach(selection => {
      if (selection.improvements?.type === 'feat' && selection.improvements.feat) {
        feats.push({
          feat: selection.improvements.feat,
          abilityChoice: selection.improvements.featAbility
        });
      }
    });
    return feats;
  };
  
  // Get ability score bonuses from half-feats
  const getHalfFeatAbilityBonuses = () => {
    const bonuses = {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0
    };
    
    const selectedFeats = getSelectedFeats();
    selectedFeats.forEach(feat => {
      if (feat.abilityChoice && feat.abilityChoice in bonuses) {
        (bonuses as any)[feat.abilityChoice] += 1;
      }
    });
    
    return bonuses;
  };
  
  // Get critical hit range (20 by default, expanded for Champion, etc.)
  const getCriticalHitRange = (): number => {
    const fighterLevel = classLevels.find(cl => cl.class.toLowerCase() === 'fighter')?.level || 0;
    
    // Champion Fighter expanded critical range
    if (hasFeature('champion')) {
      if (fighterLevel >= 15) return 3; // 18-20 (Superior Critical)
      if (fighterLevel >= 3) return 2; // 19-20 (Improved Critical)
    }
    
    // Other expanded crit ranges can be added here
    return 1; // Normal 20 only
  };
  
  // Calculate critical hit chance including advantage states
  const getCriticalHitChance = (advantageState: 'normal' | 'advantage' | 'disadvantage'): number => {
    const critRange = getCriticalHitRange();
    const baseCritChance = critRange / 20;
    
    const selectedFeats = getSelectedFeats().map(f => f.feat);
    
    if (advantageState === 'advantage') {
      if (selectedFeats.includes('elven-accuracy')) {
        // Elven Accuracy: Triple advantage for crit fishing
        return 1 - Math.pow(1 - baseCritChance, 3);
      } else {
        // Regular advantage
        return 1 - Math.pow(1 - baseCritChance, 2);
      }
    } else if (advantageState === 'disadvantage') {
      return Math.pow(baseCritChance, 2);
    }
    
    return baseCritChance; // Normal
  };
  
  // Calculate bonus action attacks
  const getBonusActionAttacks = (): {damage: string; attacks: number; description: string}[] => {
    const bonusAttacks: {damage: string; attacks: number; description: string}[] = [];
    const selectedFeats = getSelectedFeats().map(f => f.feat);
    const weapon = equipment.mainHand;
    const offHand = equipment.offHand;
    const halfFeatBonuses = getHalfFeatAbilityBonuses();
    
    // Two-Weapon Fighting
    if (weapon && offHand && !weapon.properties.includes('heavy') && !offHand.properties.includes('heavy')) {
      const fightingStyles = getFightingStyles();
      let offHandDamage = offHand.damage || '1d6';
      
      // Two-Weapon Fighting style adds ability modifier
      if (fightingStyles.includes('two-weapon-fighting')) {
        const abilityMod = weapon.type === 'ranged' 
          ? getAbilityModifier(abilityScores.dexterity + halfFeatBonuses.dexterity)
          : getAbilityModifier(abilityScores.strength + halfFeatBonuses.strength);
        offHandDamage += `+${abilityMod}`;
      }
      
      bonusAttacks.push({
        damage: offHandDamage,
        attacks: 1,
        description: 'Two-Weapon Fighting'
      });
    }
    
    // Polearm Master bonus attack
    if (selectedFeats.includes('polearm-master') && weapon && 
        ['glaive', 'halberd', 'pike', 'quarterstaff', 'spear'].some(w => weapon.name.toLowerCase().includes(w))) {
      bonusAttacks.push({
        damage: '1d4+' + getAbilityModifier(abilityScores.strength + halfFeatBonuses.strength),
        attacks: 1,
        description: 'Polearm Master'
      });
    }
    
    // Crossbow Expert bonus attack
    if (selectedFeats.includes('crossbow-expert') && weapon && weapon.name.toLowerCase().includes('crossbow')) {
      bonusAttacks.push({
        damage: '1d6+' + getAbilityModifier(abilityScores.dexterity + halfFeatBonuses.dexterity),
        attacks: 1,
        description: 'Crossbow Expert'
      });
    }
    
    return bonusAttacks;
  };

  // Calculate all resources for the current build
  const calculateResources = (): ClassResources => {
    const totalLevel = getTotalLevel();
    const mockBuild: SimpleBuild = {
      id: 'current',
      name: buildName,
      level: totalLevel,
      attackBonus: 0,
      damage: '',
      createdAt: new Date().toISOString(),
      race: buildRace,
      background: buildBackground,
      abilityScores,
      classLevels,
      equipment,
      featureSelections,
      notes: ''
    };
    
    return calculateClassResources(mockBuild, totalLevel);
  };

  // Calculate resource optimization
  const getResourceOptimization = () => {
    const resources = calculateResources();
    const spellAttackBonus = getAttackBonus(); // Approximation
    const spellSaveDC = 8 + Math.ceil(getTotalLevel() / 4) + 1 + Math.max(
      getAbilityModifier(abilityScores.intelligence),
      getAbilityModifier(abilityScores.wisdom),
      getAbilityModifier(abilityScores.charisma)
    );
    
    return optimizeSpellSlotUsage(resources, 15, spellAttackBonus, spellSaveDC);
  };

  // Analyze multiclass synergies
  const getMulticlassSynergies = () => {
    return analyzeSpellSynergies(classLevels);
  };

  // Calculate Sneak Attack dice for rogues
  const getSneakAttackDice = (): number => {
    const rogueLevel = classLevels.find(cl => cl.class.toLowerCase() === 'rogue')?.level || 0;
    if (rogueLevel === 0) return 0;
    return Math.ceil(rogueLevel / 2); // 1d6 at level 1, +1d6 every 2 levels
  };

  // Calculate Rage damage bonus for barbarians
  const getRageDamageBonus = (): number => {
    const barbarianLevel = classLevels.find(cl => cl.class.toLowerCase() === 'barbarian')?.level || 0;
    if (barbarianLevel === 0) return 0;
    if (barbarianLevel >= 16) return 4;
    if (barbarianLevel >= 9) return 3;
    return 2; // Base rage damage at levels 1-8
  };

  // Check if build has specific features
  const hasFeature = (featureId: string): boolean => {
    return Object.values(featureSelections).some(selection => 
      selection.selections && selection.selections.includes(featureId)
    );
  };

  const calculateDamage = (): string => {
    // Damage calculation based on equipped weapon and abilities
    const weapon = equipment.mainHand;
    const primaryClass = classLevels[0]?.class.toLowerCase() || 'fighter';
    const totalLevel = getTotalLevel();
    const selectedFeats = getSelectedFeats();
    const halfFeatBonuses = getHalfFeatAbilityBonuses();
    
    let damageDice = '1d8'; // Default if no weapon
    let abilityMod = 0;
    let equipmentBonus = 0;
    let fightingStyleBonus = 0;
    let featureBonus = 0;
    let extraDamage: string[] = [];
    
    // Get weapon damage dice
    if (weapon?.damage) {
      damageDice = weapon.damage;
    }
    
    // Calculate ability modifier for damage
    if (weapon && weapon.properties.includes('finesse')) {
      // Finesse weapons can use Str or Dex - choose the better one
      abilityMod = Math.max(
        getAbilityModifier(abilityScores.strength),
        getAbilityModifier(abilityScores.dexterity)
      );
    } else if (weapon && weapon.type === 'ranged') {
      // Ranged weapons use Dex
      abilityMod = getAbilityModifier(abilityScores.dexterity);
    } else {
      // Default class-based ability for damage
      switch (primaryClass) {
        case 'barbarian':
        case 'fighter':
        case 'paladin':
          abilityMod = getAbilityModifier(abilityScores.strength);
          break;
        case 'monk':
        case 'ranger':
        case 'rogue':
          abilityMod = getAbilityModifier(abilityScores.dexterity);
          break;
        default:
          abilityMod = getAbilityModifier(abilityScores.strength);
      }
    }

    // Check for fighting style damage bonuses
    const fightingStyles = getFightingStyles();
    if (fightingStyles.includes('dueling') && weapon && !equipment.offHand) {
      // Dueling fighting style: +2 damage when wielding one-handed weapon with no other weapons
      if (weapon.properties.includes('versatile') || weapon.type === 'melee') {
        fightingStyleBonus += 2;
      }
    }
    
    // Great Weapon Fighting: Average damage increase (approximately +0.83 per die)
    if (fightingStyles.includes('great-weapon-fighting') && weapon) {
      if (weapon.damage.includes('d12')) {
        extraDamage.push('GWF+0.8'); // Approximate boost for d12
      } else if (weapon.damage.includes('d10')) {
        extraDamage.push('GWF+0.7'); // Approximate boost for d10
      } else if (weapon.damage.includes('2d6')) {
        extraDamage.push('GWF+1.3'); // Approximate boost for 2d6
      }
    }
    
    // Add equipment bonuses
    if (weapon?.magic) {
      equipmentBonus += weapon.magic;
    }
    if (weapon?.damageBonus) {
      equipmentBonus += weapon.damageBonus;
    }
    
    // Class feature bonuses
    // Barbarian Rage damage
    if (primaryClass === 'barbarian') {
      const rageDamage = getRageDamageBonus();
      if (rageDamage > 0) {
        featureBonus += rageDamage;
        extraDamage.push(`Rage+${rageDamage}`);
      }
    }
    
    // Rogue Sneak Attack (once per turn, not per attack)
    const sneakAttackDice = getSneakAttackDice();
    if (sneakAttackDice > 0) {
      extraDamage.push(`Sneak+${sneakAttackDice}d6/turn`);
    }
    
    // Paladin Divine Smite (level 1 slot assumption)
    if (primaryClass === 'paladin' && totalLevel >= 2) {
      extraDamage.push('Smite+2d8');
    }
    
    // Feat bonuses
    // Great Weapon Master / Sharpshooter power attack
    if (selectedFeats.includes('great-weapon-master') && weapon && weapon.properties.some(p => ['heavy', 'two-handed'].includes(p))) {
      extraDamage.push('GWM+10');
    }
    if (selectedFeats.includes('sharpshooter') && weapon && weapon.type === 'ranged') {
      extraDamage.push('SS+10');
    }
    
    // Piercer feat
    if (selectedFeats.includes('piercer') && weapon && weapon.properties.includes('piercing')) {
      extraDamage.push('Pierce+1d');
    }
    
    // Slasher feat doesn't add direct damage but affects battlefield control
    // Savage Attacker feat allows rerolling damage dice once per turn
    if (selectedFeats.includes('savage-attacker')) {
      extraDamage.push('Savage+0.5d'); // Approximate damage boost
    }
    
    // Half-feats that boost ability scores (already included in ability mods)
    // Alert, Lucky, Mobile, etc. don't directly affect damage
    
    const totalBonus = abilityMod + equipmentBonus + fightingStyleBonus;
    const extraAttacks = getExtraAttacks();
    const totalAttacks = 1 + extraAttacks;
    
    let damageString = totalBonus > 0 ? `${damageDice}+${totalBonus}` : `${damageDice}${totalBonus}`;
    
    // Add extra damage sources
    if (extraDamage.length > 0) {
      damageString += ` (${extraDamage.join(', ')})`;
    }
    
    if (totalAttacks > 1) {
      damageString += ` (×${totalAttacks} attacks)`;
    }
    
    // Add bonus action attacks
    const bonusAttacks = getBonusActionAttacks();
    if (bonusAttacks.length > 0) {
      const bonusAttackStrings = bonusAttacks.map(ba => `${ba.damage} ${ba.description}`);
      damageString += ` + ${bonusAttackStrings.join(' + ')}`;
    }
    
    // Add critical hit information
    const critRange = getCriticalHitRange();
    if (critRange > 1) {
      const critThreshold = 21 - critRange;
      damageString += ` (Crit: ${critThreshold}-20)`;
    }
    
    return damageString;
  };

  // Calculate spellcasting information
  const calculateSpellcasting = (): {
    hasSpells: boolean;
    spellSlots: Record<number, number>;
    spellAttackBonus: number;
    spellSaveDC: number;
    casterLevel: number;
    warlockSlots: { level: number; slots: number } | null;
    resources: string[];
    synergies: string[];
  } => {
    const resources = calculateResources();
    const synergies = getMulticlassSynergies();
    const casterLevel = calculateMulticlassSpellcasterLevel(classLevels);
    const hasSpells = casterLevel > 0 || resources.warlockSlots !== null;
    
    // Calculate spell attack bonus and save DC
    const primarySpellMod = Math.max(
      getAbilityModifier(abilityScores.intelligence),
      getAbilityModifier(abilityScores.wisdom),
      getAbilityModifier(abilityScores.charisma)
    );
    const profBonus = Math.ceil(getTotalLevel() / 4) + 1;
    const spellAttackBonus = profBonus + primarySpellMod;
    const spellSaveDC = 8 + profBonus + primarySpellMod;
    
    // Format resource strings
    const resourceStrings: string[] = [];
    
    if (Object.keys(resources.spellSlots).length > 0) {
      const slotStrings = Object.entries(resources.spellSlots)
        .filter(([level, slots]) => slots > 0)
        .map(([level, slots]) => `${slots}×${level}${level === '1' ? 'st' : level === '2' ? 'nd' : level === '3' ? 'rd' : 'th'}`);
      if (slotStrings.length > 0) {
        resourceStrings.push(`Slots: ${slotStrings.join(', ')}`);
      }
    }
    
    if (resources.warlockSlots) {
      resourceStrings.push(`Warlock: ${resources.warlockSlots.slots}×${resources.warlockSlots.level}${resources.warlockSlots.level === 1 ? 'st' : resources.warlockSlots.level === 2 ? 'nd' : resources.warlockSlots.level === 3 ? 'rd' : 'th'}`);
    }
    
    if (resources.sorceryPoints > 0) {
      resourceStrings.push(`Sorcery Points: ${resources.sorceryPoints}`);
    }
    
    if (resources.kiPoints > 0) {
      resourceStrings.push(`Ki: ${resources.kiPoints}`);
    }
    
    if (resources.rageUses > 0) {
      resourceStrings.push(`Rage: ${resources.rageUses === 999 ? '∞' : resources.rageUses}`);
    }
    
    if (resources.superiorityDice > 0) {
      resourceStrings.push(`Superiority Dice: ${resources.superiorityDice}`);
    }
    
    return {
      hasSpells,
      spellSlots: resources.spellSlots,
      spellAttackBonus,
      spellSaveDC,
      casterLevel,
      warlockSlots: resources.warlockSlots,
      resources: resourceStrings,
      synergies: synergies.synergies
    };
  };

  const calculateArmorClass = (): number => {
    // AC calculation: base 10 + armor + dex modifier + shield + magic bonuses + fighting style bonuses
    let baseAC = 10;
    let armorBonus = 0;
    let dexMod = getAbilityModifier(abilityScores.dexterity);
    let shieldBonus = 0;
    let magicBonus = 0;
    let fightingStyleBonus = 0;
    
    if (equipment.armor) {
      armorBonus = equipment.armor.ac;
      
      // Apply Dex modifier limits based on armor type
      if (equipment.armor.type === 'heavy') {
        dexMod = 0; // Heavy armor doesn't benefit from Dex
      } else if (equipment.armor.type === 'medium') {
        dexMod = Math.min(dexMod, 2); // Medium armor caps at +2 Dex
      }
      // Light armor uses full Dex modifier
      
      if (equipment.armor.magic) {
        magicBonus += equipment.armor.magic;
      }
      
      // With armor, use armor AC instead of base 10
      baseAC = 0;
    }
    
    // Check for fighting style AC bonuses
    const fightingStyles = getFightingStyles();
    if (fightingStyles.includes('defense') && equipment.armor) {
      fightingStyleBonus += 1; // Defense fighting style gives +1 AC while wearing armor
    }
    
    // TODO: Add shield bonus when shield state is properly tracked
    // This would require passing shield state from EquipmentForm
    
    return baseAC + armorBonus + dexMod + shieldBonus + magicBonus + fightingStyleBonus;
  };

  // Create new build
  const handleCreateBuild = () => {
    if (!buildName.trim()) {
      addNotification({
        type: 'error',
        message: 'Build name is required',
      });
      return;
    }

    const totalLevel = getTotalLevel();
    const classNames = classLevels.map(cl => `${cl.class} ${cl.level}`).join('/');
    
    const newBuild = {
      name: buildName.trim(),
      level: totalLevel,
      attackBonus: calculateAttackBonus(),
      damage: calculateDamage(),
      notes: `${buildRace} ${classNames} (${buildBackground})`,
      // Store detailed character data for editing
      race: buildRace,
      background: buildBackground,
      abilityScores: { ...abilityScores },
      abilityScoreMethod,
      classLevels: [...classLevels],
      equipment: {
        mainHand: equipment.mainHand,
        offHand: equipment.offHand,
        armor: equipment.armor,
        accessories: equipment.accessories || []
      },
      featureSelections: { ...featureSelections }
    };

    addBuild(newBuild);

    // Reset form using the same function as cancel
    handleCancelEdit();

    addNotification({
      type: 'success',
      message: `Character "${newBuild.name}" created successfully!`,
    });
  };

  // Start editing an existing build
  const handleEditBuild = (build: SimpleBuild) => {
    setEditingBuild(build);
    setBuildName(build.name);
    
    // Load stored character data or fall back to parsing notes/defaults
    if (build.race) {
      setBuildRace(build.race);
    } else {
      // Fall back to parsing notes for older builds without detailed data
      const notesParts = build.notes?.match(/^(\w+)\s+(.*?)\s+\((.+)\)$/) || [];
      if (notesParts.length >= 4) {
        setBuildRace(notesParts[1]);
      } else {
        setBuildRace('Human');
      }
    }
    
    if (build.background) {
      setBuildBackground(build.background);
    } else {
      // Fall back to parsing notes or default
      const notesParts = build.notes?.match(/^(\w+)\s+(.*?)\s+\((.+)\)$/) || [];
      if (notesParts.length >= 4) {
        setBuildBackground(notesParts[3]);
      } else {
        setBuildBackground('Soldier');
      }
    }
    
    // Load ability scores or use defaults
    if (build.abilityScores) {
      setAbilityScores({ ...build.abilityScores });
    } else {
      setAbilityScores({
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      });
    }
    
    // Load ability score method or use default
    if (build.abilityScoreMethod) {
      setAbilityScoreMethod(build.abilityScoreMethod);
    } else {
      setAbilityScoreMethod('manual'); // Default to manual for legacy builds since they had manual entry
    }
    
    // Load class levels or create from build level
    if (build.classLevels && build.classLevels.length > 0) {
      setClassLevels([...build.classLevels]);
    } else {
      // Fall back to single class at build level
      setClassLevels([{
        class: 'fighter',
        level: build.level,
        hitDie: 10,
        subclass: '',
      }]);
    }
    
    // Load equipment or use defaults
    if (build.equipment) {
      setEquipment({
        mainHand: build.equipment.mainHand || null,
        offHand: build.equipment.offHand || null,
        armor: build.equipment.armor || null,
        accessories: build.equipment.accessories || []
      });
    } else {
      setEquipment({
        mainHand: null,
        offHand: null,
        armor: null,
        accessories: []
      });
    }
    
    // Load feature selections
    if (build.featureSelections) {
      setFeatureSelections({ ...build.featureSelections });
    } else {
      setFeatureSelections({});
    }
    
    setIsCreating(true);
    setActiveTab('basics');
  };

  // Update existing build
  const handleUpdateBuild = () => {
    if (!editingBuild || !buildName.trim()) {
      addNotification({
        type: 'error',
        message: 'Build name is required',
      });
      return;
    }

    const totalLevel = getTotalLevel();
    const classNames = classLevels.map(cl => `${cl.class} ${cl.level}`).join('/');
    
    const updatedData = {
      name: buildName.trim(),
      level: totalLevel,
      attackBonus: calculateAttackBonus(),
      damage: calculateDamage(),
      notes: `${buildRace} ${classNames} (${buildBackground})`,
      // Store detailed character data for future editing
      race: buildRace,
      background: buildBackground,
      abilityScores: { ...abilityScores },
      abilityScoreMethod,
      classLevels: [...classLevels],
      equipment: {
        mainHand: equipment.mainHand,
        offHand: equipment.offHand,
        armor: equipment.armor,
        accessories: equipment.accessories || []
      },
      featureSelections: { ...featureSelections }
    };

    updateBuild(editingBuild.id, updatedData);
    handleCancelEdit();

    addNotification({
      type: 'success',
      message: `Character "${updatedData.name}" updated successfully!`,
    });
  };

  // Cancel editing/creating
  const handleCancelEdit = () => {
    setEditingBuild(null);
    setIsCreating(false);
    setActiveTab('basics');
    // Reset form values
    setBuildName('');
    setBuildRace('Human');
    setBuildBackground('Soldier');
    setAbilityScores({
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    });
    setAbilityScoreMethod('pointBuy');
    setClassLevels([{
      class: 'fighter',
      level: 1,
      hitDie: 10,
      subclass: '',
    }]);
    setEquipment({
      mainHand: null,
      offHand: null,
      armor: null,
      accessories: []
    });
    setFeatureSelections({});
  };

  // Delete build with confirmation
  const handleDeleteBuild = (build: SimpleBuild) => {
    if (window.confirm(`Are you sure you want to delete "${build.name}"? This action cannot be undone.`)) {
      deleteBuild(build.id);
    }
  };

  // Update calculations when relevant data changes
  useEffect(() => {
    // Auto-calculate attack bonus and damage when ability scores, class/level, or equipment change
  }, [abilityScores, classLevels, equipment]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Build Lab</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Create and customize character builds with comprehensive D&D 5e support
        </p>
      </div>

      {/* Build Management Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Character Builds ({builds.length})
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => isCreating || editingBuild ? handleCancelEdit() : setIsCreating(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isCreating || editingBuild
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isCreating || editingBuild ? 'Cancel' : 'New Character'}
          </button>
        </div>
      </div>

      {/* Character Creation/Editing Form */}
      {(isCreating || editingBuild) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingBuild ? `Edit Character: ${editingBuild.name}` : 'Create New Character'}
          </h3>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'basics' as const, label: 'Basics' },
              { key: 'abilities' as const, label: 'Ability Scores' },
              { key: 'classes' as const, label: 'Classes & Features' },
              { key: 'equipment' as const, label: 'Equipment' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={buildName}
                    onChange={(e) => setBuildName(e.target.value)}
                    placeholder="e.g., Thorin Ironshield"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Race
                  </label>
                  <select
                    value={buildRace}
                    onChange={(e) => setBuildRace(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {races.map((race) => (
                      <option key={race} value={race}>{race}</option>
                    ))}
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background
                  </label>
                  <select
                    value={buildBackground}
                    onChange={(e) => setBuildBackground(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {backgrounds.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Character Preview</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{buildName || 'Unnamed Character'}</strong> - Level {getTotalLevel()} {buildRace} {classLevels.map(cl => cl.class).join('/')} ({buildBackground})
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Attack Bonus: +{calculateAttackBonus()} • Damage: {calculateDamage()} • AC: {calculateArmorClass()}
                </p>
                {classLevels.length > 1 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Classes: {classLevels.map(cl => `${cl.class} ${cl.level}`).join(', ')}
                  </p>
                )}
                {(() => {
                  const spellcasting = calculateSpellcasting();
                  if (spellcasting.hasSpells || spellcasting.resources.length > 0) {
                    return (
                      <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                        {spellcasting.hasSpells && (
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Spell Attack: +{spellcasting.spellAttackBonus} • Spell Save DC: {spellcasting.spellSaveDC}
                          </p>
                        )}
                        {spellcasting.resources.length > 0 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {spellcasting.resources.slice(0, 2).join(' • ')}
                          </p>
                        )}
                        {spellcasting.synergies.length > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                            ⚡ {spellcasting.synergies[0]}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
                {equipment.mainHand && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Weapon: {equipment.mainHand.name} ({equipment.mainHand.damage} {equipment.mainHand.damageType})
                  </p>
                )}
                {equipment.armor && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Armor: {equipment.armor.name} (AC {equipment.armor.ac}
                    {equipment.armor.type === 'light' && ' + Dex'}
                    {equipment.armor.type === 'medium' && ' + Dex (max 2)'}
                    )
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'abilities' && (
            <BasicAbilityScoreForm
              scores={abilityScores}
              onChange={setAbilityScores}
              method={abilityScoreMethod}
              onMethodChange={setAbilityScoreMethod}
              className="mt-4"
            />
          )}

          {activeTab === 'classes' && (
            <ClassLevelForm
              levels={classLevels}
              onChange={setClassLevels}
              featureSelections={featureSelections}
              onFeatureSelectionChange={(featureId, selection) => {
                setFeatureSelections(prev => ({
                  ...prev,
                  [featureId]: selection
                }));
              }}
            />
          )}


          {activeTab === 'equipment' && (
            <EquipmentForm
              equipment={equipment}
              onChange={setEquipment}
            />
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={editingBuild ? handleUpdateBuild : handleCreateBuild}
              disabled={!buildName.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingBuild ? 'Update Character' : 'Create Character'}
            </button>
          </div>
        </div>
      )}

      {/* Existing Builds */}
      {builds.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Characters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {builds.map((build) => (
              <div
                key={build.id}
                className={`p-4 rounded-lg border transition-colors ${
                  selectedBuild?.id === build.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => selectBuild(build.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{build.name}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Lv.{build.level}</span>
                  </div>
                  
                  {build.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{build.notes}</p>
                  )}
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>Attack: +{build.attackBonus} • Damage: {build.damage}</div>
                    {(() => {
                      // Calculate resources for this build
                      const resources = calculateClassResources(build, build.level);
                      const spellSlots = getMulticlassSpellSlots(build.classLevels || []);
                      const resourceStrings: string[] = [];
                      
                      if (Object.keys(spellSlots).length > 0) {
                        const slotStrings = Object.entries(spellSlots)
                          .filter(([level, slots]) => slots > 0)
                          .slice(0, 3) // Show only first 3 spell levels
                          .map(([level, slots]) => `${slots}×${level}`);
                        if (slotStrings.length > 0) {
                          resourceStrings.push(`Slots: ${slotStrings.join(', ')}`);
                        }
                      }
                      
                      if (resources.warlockSlots) {
                        resourceStrings.push(`Warlock: ${resources.warlockSlots.slots}×${resources.warlockSlots.level}`);
                      }
                      
                      if (resources.sorceryPoints > 0) {
                        resourceStrings.push(`SP: ${resources.sorceryPoints}`);
                      }
                      
                      if (resources.kiPoints > 0) {
                        resourceStrings.push(`Ki: ${resources.kiPoints}`);
                      }
                      
                      if (resources.rageUses > 0) {
                        resourceStrings.push(`Rage: ${resources.rageUses === 999 ? '∞' : resources.rageUses}`);
                      }
                      
                      return resourceStrings.length > 0 && (
                        <div>{resourceStrings.slice(0, 2).join(' • ')}</div>
                      );
                    })()}
                    <div>Created: {new Date(build.createdAt).toLocaleDateString()}</div>
                  </div>
                  
                  {selectedBuild?.id === build.id && (
                    <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        ✓ Selected for DPR Calculator
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditBuild(build);
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Edit build"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBuild(build);
                    }}
                    className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete build"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 text-6xl mb-4">🎭</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Characters Yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Create your first D&D character to get started with optimization!
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Create Your First Character
          </button>
        </div>
      )}
    </div>
  );
};
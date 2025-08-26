import { ClassProgression, ClassFeature } from '../types/build';

// Standard proficiency bonus progression (same for all classes)
const standardProficiencyBonus = [
  { level: 1, bonus: 2 },
  { level: 5, bonus: 3 },
  { level: 9, bonus: 4 },
  { level: 13, bonus: 5 },
  { level: 17, bonus: 6 }
];

// Fighter class progression
const fighterFeatures: ClassFeature[] = [
  { name: 'Fighting Style', description: 'Choose a fighting style', level: 1, class: 'Fighter', category: 'core' },
  { name: 'Second Wind', description: 'Regain 1d10+Fighter level HP as bonus action', level: 1, class: 'Fighter', category: 'core' },
  { name: 'Action Surge', description: 'Take an additional action on your turn', level: 2, class: 'Fighter', category: 'core' },
  { name: 'Martial Archetype', description: 'Choose your Fighter subclass', level: 3, class: 'Fighter', category: 'subclass' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 4, class: 'Fighter', category: 'asi' },
  { name: 'Extra Attack', description: 'Attack twice when you take the Attack action', level: 5, class: 'Fighter', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 6, class: 'Fighter', category: 'asi' },
  { name: 'Martial Archetype Feature', description: 'Gain a subclass feature', level: 7, class: 'Fighter', category: 'subclass' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 8, class: 'Fighter', category: 'asi' },
  { name: 'Indomitable', description: 'Reroll a failed saving throw', level: 9, class: 'Fighter', category: 'core' },
  { name: 'Martial Archetype Feature', description: 'Gain a subclass feature', level: 10, class: 'Fighter', category: 'subclass' },
  { name: 'Extra Attack (2)', description: 'Attack three times when you take the Attack action', level: 11, class: 'Fighter', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 12, class: 'Fighter', category: 'asi' },
  { name: 'Indomitable (2 uses)', description: 'Use Indomitable twice per long rest', level: 13, class: 'Fighter', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 14, class: 'Fighter', category: 'asi' },
  { name: 'Martial Archetype Feature', description: 'Gain a subclass feature', level: 15, class: 'Fighter', category: 'subclass' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 16, class: 'Fighter', category: 'asi' },
  { name: 'Action Surge (2 uses)', description: 'Use Action Surge twice per short rest', level: 17, class: 'Fighter', category: 'core' },
  { name: 'Martial Archetype Feature', description: 'Gain a subclass feature', level: 18, class: 'Fighter', category: 'subclass' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 19, class: 'Fighter', category: 'asi' },
  { name: 'Extra Attack (3)', description: 'Attack four times when you take the Attack action', level: 20, class: 'Fighter', category: 'core' }
];

// Rogue class progression
const rogueFeatures: ClassFeature[] = [
  { name: 'Expertise', description: 'Double proficiency bonus for chosen skills', level: 1, class: 'Rogue', category: 'core' },
  { name: 'Sneak Attack', description: '1d6 extra damage with advantage or ally nearby', level: 1, class: 'Rogue', category: 'core' },
  { name: 'Thieves\' Cant', description: 'Secret language of rogues and criminals', level: 1, class: 'Rogue', category: 'core' },
  { name: 'Cunning Action', description: 'Dash, Disengage, or Hide as bonus action', level: 2, class: 'Rogue', category: 'core' },
  { name: 'Roguish Archetype', description: 'Choose your Rogue subclass', level: 3, class: 'Rogue', category: 'subclass' },
  { name: 'Sneak Attack (2d6)', description: 'Sneak Attack damage increases', level: 3, class: 'Rogue', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 4, class: 'Rogue', category: 'asi' },
  { name: 'Sneak Attack (3d6)', description: 'Sneak Attack damage increases', level: 5, class: 'Rogue', category: 'core' },
  { name: 'Expertise', description: 'Choose two more skills for Expertise', level: 6, class: 'Rogue', category: 'core' },
  { name: 'Sneak Attack (4d6)', description: 'Sneak Attack damage increases', level: 7, class: 'Rogue', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 8, class: 'Rogue', category: 'asi' },
  { name: 'Roguish Archetype Feature', description: 'Gain a subclass feature', level: 9, class: 'Rogue', category: 'subclass' },
  { name: 'Sneak Attack (5d6)', description: 'Sneak Attack damage increases', level: 9, class: 'Rogue', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 10, class: 'Rogue', category: 'asi' },
  { name: 'Sneak Attack (6d6)', description: 'Sneak Attack damage increases', level: 11, class: 'Rogue', category: 'core' },
  { name: 'Reliable Talent', description: 'Treat d20 rolls of 9 or lower as 10 for ability checks', level: 11, class: 'Rogue', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 12, class: 'Rogue', category: 'asi' },
  { name: 'Roguish Archetype Feature', description: 'Gain a subclass feature', level: 13, class: 'Rogue', category: 'subclass' },
  { name: 'Sneak Attack (7d6)', description: 'Sneak Attack damage increases', level: 13, class: 'Rogue', category: 'core' },
  { name: 'Blindsense', description: 'Sense hidden creatures within 10 feet', level: 14, class: 'Rogue', category: 'core' },
  { name: 'Sneak Attack (8d6)', description: 'Sneak Attack damage increases', level: 15, class: 'Rogue', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 16, class: 'Rogue', category: 'asi' },
  { name: 'Roguish Archetype Feature', description: 'Gain a subclass feature', level: 17, class: 'Rogue', category: 'subclass' },
  { name: 'Sneak Attack (9d6)', description: 'Sneak Attack damage increases', level: 17, class: 'Rogue', category: 'core' },
  { name: 'Elusive', description: 'No attack roll has advantage against you while not incapacitated', level: 18, class: 'Rogue', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 19, class: 'Rogue', category: 'asi' },
  { name: 'Sneak Attack (10d6)', description: 'Sneak Attack damage increases', level: 19, class: 'Rogue', category: 'core' },
  { name: 'Stroke of Luck', description: 'Turn a miss into a hit or failed ability check into 20', level: 20, class: 'Rogue', category: 'core' }
];

// Ranger class progression
const rangerFeatures: ClassFeature[] = [
  { name: 'Favored Enemy', description: 'Choose a favored enemy type for bonuses', level: 1, class: 'Ranger', category: 'core' },
  { name: 'Natural Explorer', description: 'Choose a favored terrain for bonuses', level: 1, class: 'Ranger', category: 'core' },
  { name: 'Fighting Style', description: 'Choose a fighting style', level: 2, class: 'Ranger', category: 'core' },
  { name: 'Spellcasting', description: 'Learn and cast ranger spells', level: 2, class: 'Ranger', category: 'spell' },
  { name: 'Ranger Archetype', description: 'Choose your Ranger subclass', level: 3, class: 'Ranger', category: 'subclass' },
  { name: 'Primeval Awareness', description: 'Sense certain creature types', level: 3, class: 'Ranger', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 4, class: 'Ranger', category: 'asi' },
  { name: 'Extra Attack', description: 'Attack twice when you take the Attack action', level: 5, class: 'Ranger', category: 'core' },
  { name: 'Favored Enemy (2nd)', description: 'Choose another favored enemy', level: 6, class: 'Ranger', category: 'core' },
  { name: 'Natural Explorer (2nd)', description: 'Choose another favored terrain', level: 6, class: 'Ranger', category: 'core' },
  { name: 'Ranger Archetype Feature', description: 'Gain a subclass feature', level: 7, class: 'Ranger', category: 'subclass' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 8, class: 'Ranger', category: 'asi' },
  { name: 'Land\'s Stride', description: 'Move through difficult terrain without penalty', level: 8, class: 'Ranger', category: 'core' },
  { name: 'Natural Explorer (3rd)', description: 'Choose another favored terrain', level: 10, class: 'Ranger', category: 'core' },
  { name: 'Ranger Archetype Feature', description: 'Gain a subclass feature', level: 11, class: 'Ranger', category: 'subclass' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 12, class: 'Ranger', category: 'asi' },
  { name: 'Vanish', description: 'Hide as bonus action and can\'t be tracked', level: 14, class: 'Ranger', category: 'core' },
  { name: 'Favored Enemy (3rd)', description: 'Choose another favored enemy', level: 14, class: 'Ranger', category: 'core' },
  { name: 'Ranger Archetype Feature', description: 'Gain a subclass feature', level: 15, class: 'Ranger', category: 'subclass' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 16, class: 'Ranger', category: 'asi' },
  { name: 'Feral Senses', description: 'Fight invisible creatures and sense them within 30 feet', level: 18, class: 'Ranger', category: 'core' },
  { name: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', level: 19, class: 'Ranger', category: 'asi' },
  { name: 'Foe Slayer', description: 'Add Wisdom modifier to one attack or damage roll per turn against favored enemies', level: 20, class: 'Ranger', category: 'core' }
];

// Spell slot progressions
const rangerSpellSlots = [
  { level: 1, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  { level: 2, 1: 2, 2: 0, 3: 0, 4: 0, 5: 0 },
  { level: 3, 1: 3, 2: 0, 3: 0, 4: 0, 5: 0 },
  { level: 4, 1: 3, 2: 0, 3: 0, 4: 0, 5: 0 },
  { level: 5, 1: 4, 2: 2, 3: 0, 4: 0, 5: 0 },
  { level: 6, 1: 4, 2: 2, 3: 0, 4: 0, 5: 0 },
  { level: 7, 1: 4, 2: 3, 3: 0, 4: 0, 5: 0 },
  { level: 8, 1: 4, 2: 3, 3: 0, 4: 0, 5: 0 },
  { level: 9, 1: 4, 2: 3, 3: 2, 4: 0, 5: 0 },
  { level: 10, 1: 4, 2: 3, 3: 2, 4: 0, 5: 0 },
  { level: 11, 1: 4, 2: 3, 3: 3, 4: 0, 5: 0 },
  { level: 12, 1: 4, 2: 3, 3: 3, 4: 0, 5: 0 },
  { level: 13, 1: 4, 2: 3, 3: 3, 4: 1, 5: 0 },
  { level: 14, 1: 4, 2: 3, 3: 3, 4: 1, 5: 0 },
  { level: 15, 1: 4, 2: 3, 3: 3, 4: 2, 5: 0 },
  { level: 16, 1: 4, 2: 3, 3: 3, 4: 2, 5: 0 },
  { level: 17, 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  { level: 18, 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  { level: 19, 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
  { level: 20, 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
];

// Class progression data
export const classProgressions: Record<string, ClassProgression> = {
  Fighter: {
    class: 'Fighter',
    hitDie: 10,
    primaryAbility: ['Strength', 'Dexterity'],
    savingThrowProficiencies: ['Strength', 'Constitution'],
    skillChoices: 2,
    availableSkills: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
    weaponProficiencies: ['Simple weapons', 'Martial weapons'],
    armorProficiencies: ['All armor', 'Shields'],
    features: fighterFeatures,
    attacksPerAction: [
      { level: 1, attacks: 1 },
      { level: 5, attacks: 2 },
      { level: 11, attacks: 3 },
      { level: 20, attacks: 4 }
    ],
    proficiencyBonus: standardProficiencyBonus
  },
  
  Rogue: {
    class: 'Rogue',
    hitDie: 8,
    primaryAbility: ['Dexterity'],
    savingThrowProficiencies: ['Dexterity', 'Intelligence'],
    skillChoices: 4,
    availableSkills: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
    weaponProficiencies: ['Simple weapons', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
    armorProficiencies: ['Light armor'],
    features: rogueFeatures,
    attacksPerAction: [
      { level: 1, attacks: 1 }
    ],
    proficiencyBonus: standardProficiencyBonus
  },

  Ranger: {
    class: 'Ranger',
    hitDie: 10,
    primaryAbility: ['Dexterity', 'Wisdom'],
    savingThrowProficiencies: ['Strength', 'Dexterity'],
    skillChoices: 3,
    availableSkills: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
    weaponProficiencies: ['Simple weapons', 'Martial weapons'],
    armorProficiencies: ['Light armor', 'Medium armor', 'Shields'],
    features: rangerFeatures,
    spellSlots: rangerSpellSlots,
    attacksPerAction: [
      { level: 1, attacks: 1 },
      { level: 5, attacks: 2 }
    ],
    proficiencyBonus: standardProficiencyBonus
  }
};

// Helper function to get proficiency bonus by level
export const getProficiencyBonus = (level: number): number => {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
};

// Helper function to get attacks per action by level for a given class
export const getAttacksPerAction = (className: string, level: number): number => {
  const classData = classProgressions[className];
  if (!classData) return 1;
  
  let attacks = 1;
  for (const attackLevel of classData.attacksPerAction) {
    if (level >= attackLevel.level) {
      attacks = attackLevel.attacks;
    }
  }
  return attacks;
};

// Helper function to get spell slots by level for a spellcasting class
export const getSpellSlots = (className: string, level: number): Record<string, number> => {
  const classData = classProgressions[className];
  if (!classData || !classData.spellSlots) return {};
  
  const slotData = classData.spellSlots.find(slot => slot.level === level);
  if (!slotData) return {};
  
  const slots: Record<string, number> = {};
  for (let i = 1; i <= 9; i++) {
    const slotCount = slotData[i as keyof typeof slotData] as number;
    if (slotCount && slotCount > 0) {
      slots[i.toString()] = slotCount;
    }
  }
  return slots;
};

// Helper function to get class features gained at a specific level
export const getFeaturesAtLevel = (className: string, level: number): ClassFeature[] => {
  const classData = classProgressions[className];
  if (!classData) return [];
  
  return classData.features.filter(feature => feature.level === level);
};

// Helper function to get all features up to a given level
export const getFeaturesUpToLevel = (className: string, level: number): ClassFeature[] => {
  const classData = classProgressions[className];
  if (!classData) return [];
  
  return classData.features.filter(feature => feature.level <= level);
};
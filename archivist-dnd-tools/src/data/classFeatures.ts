/**
 * Comprehensive D&D 5e Class Features Database
 * All SRD-safe class and subclass features with choice selections
 */

import type { ClassFeature, FeatureChoice } from '../components/forms/ClassFeatureDisplay';

// Common fighting style choices
const FIGHTING_STYLES: FeatureChoice[] = [
  {
    id: 'archery',
    name: 'Archery',
    description: '+2 bonus to attack rolls with ranged weapons',
    shortDescription: '+2 ranged attack'
  },
  {
    id: 'defense',
    name: 'Defense',
    description: '+1 AC while wearing armor',
    shortDescription: '+1 AC with armor'
  },
  {
    id: 'dueling',
    name: 'Dueling',
    description: '+2 damage when wielding one-handed weapon with no other weapons',
    shortDescription: '+2 damage (one-handed)'
  },
  {
    id: 'great-weapon-fighting',
    name: 'Great Weapon Fighting',
    description: 'Reroll 1s and 2s on damage dice for two-handed weapons',
    shortDescription: 'Reroll 1s, 2s (two-handed)'
  },
  {
    id: 'protection',
    name: 'Protection',
    description: 'Use reaction to impose disadvantage on attack against nearby ally',
    shortDescription: 'Shield ally (reaction)'
  },
  {
    id: 'two-weapon-fighting',
    name: 'Two-Weapon Fighting',
    description: 'Add ability modifier to off-hand attack damage',
    shortDescription: '+ability mod to off-hand'
  }
];

// Battle Master maneuvers
const BATTLE_MASTER_MANEUVERS: FeatureChoice[] = [
  {
    id: 'commanders-strike',
    name: "Commander's Strike",
    description: 'Direct ally to strike using their reaction'
  },
  {
    id: 'disarming-attack',
    name: 'Disarming Attack',
    description: 'Force target to drop held item'
  },
  {
    id: 'distracting-strike',
    name: 'Distracting Strike',
    description: 'Give ally advantage on next attack'
  },
  {
    id: 'feinting-attack',
    name: 'Feinting Attack',
    description: 'Gain advantage on attack with bonus action'
  },
  {
    id: 'goading-attack',
    name: 'Goading Attack',
    description: 'Taunt enemy, impose disadvantage on attacks vs others'
  },
  {
    id: 'lunging-attack',
    name: 'Lunging Attack',
    description: 'Increase reach by 5 feet for one attack'
  },
  {
    id: 'maneuvering-attack',
    name: 'Maneuvering Attack',
    description: 'Allow ally to move without provoking opportunity attacks'
  },
  {
    id: 'menacing-attack',
    name: 'Menacing Attack',
    description: 'Frighten target until end of your next turn'
  },
  {
    id: 'parry',
    name: 'Parry',
    description: 'Reduce damage taken as reaction'
  },
  {
    id: 'precision-attack',
    name: 'Precision Attack',
    description: 'Add superiority die to attack roll'
  },
  {
    id: 'pushing-attack',
    name: 'Pushing Attack',
    description: 'Push target up to 15 feet away'
  },
  {
    id: 'rally',
    name: 'Rally',
    description: 'Give temporary hit points to ally'
  },
  {
    id: 'riposte',
    name: 'Riposte',
    description: 'Attack as reaction when enemy misses you'
  },
  {
    id: 'sweeping-attack',
    name: 'Sweeping Attack',
    description: 'Attack additional creature within reach'
  },
  {
    id: 'trip-attack',
    name: 'Trip Attack',
    description: 'Knock target prone'
  }
];

// Skill choices for expertise and proficiencies
const SKILL_CHOICES: FeatureChoice[] = [
  { id: 'acrobatics', name: 'Acrobatics', description: 'Dexterity-based skill for balance and agility' },
  { id: 'animal-handling', name: 'Animal Handling', description: 'Wisdom-based skill for interacting with animals' },
  { id: 'arcana', name: 'Arcana', description: 'Intelligence-based skill for magical knowledge' },
  { id: 'athletics', name: 'Athletics', description: 'Strength-based skill for physical activities' },
  { id: 'deception', name: 'Deception', description: 'Charisma-based skill for misleading others' },
  { id: 'history', name: 'History', description: 'Intelligence-based skill for historical knowledge' },
  { id: 'insight', name: 'Insight', description: 'Wisdom-based skill for reading people' },
  { id: 'intimidation', name: 'Intimidation', description: 'Charisma-based skill for threatening others' },
  { id: 'investigation', name: 'Investigation', description: 'Intelligence-based skill for finding clues' },
  { id: 'medicine', name: 'Medicine', description: 'Wisdom-based skill for healing and diagnosis' },
  { id: 'nature', name: 'Nature', description: 'Intelligence-based skill for natural knowledge' },
  { id: 'perception', name: 'Perception', description: 'Wisdom-based skill for noticing things' },
  { id: 'performance', name: 'Performance', description: 'Charisma-based skill for entertaining' },
  { id: 'persuasion', name: 'Persuasion', description: 'Charisma-based skill for convincing others' },
  { id: 'religion', name: 'Religion', description: 'Intelligence-based skill for religious knowledge' },
  { id: 'sleight-of-hand', name: 'Sleight of Hand', description: 'Dexterity-based skill for manual tricks' },
  { id: 'stealth', name: 'Stealth', description: 'Dexterity-based skill for moving unseen' },
  { id: 'survival', name: 'Survival', description: 'Wisdom-based skill for wilderness survival' }
];

// Metamagic options for Sorcerer
const METAMAGIC_OPTIONS: FeatureChoice[] = [
  {
    id: 'careful-spell',
    name: 'Careful Spell',
    description: 'Protect allies from your spell effects (1 sorcery point)',
    shortDescription: 'Protect allies'
  },
  {
    id: 'distant-spell',
    name: 'Distant Spell',
    description: 'Double spell range or make touch spells 30ft range (1 sorcery point)',
    shortDescription: 'Double range'
  },
  {
    id: 'empowered-spell',
    name: 'Empowered Spell',
    description: 'Reroll damage dice (1 sorcery point)',
    shortDescription: 'Reroll damage'
  },
  {
    id: 'extended-spell',
    name: 'Extended Spell',
    description: 'Double spell duration (1 sorcery point)',
    shortDescription: 'Double duration'
  },
  {
    id: 'heightened-spell',
    name: 'Heightened Spell',
    description: 'Give one target disadvantage on save (3 sorcery points)',
    shortDescription: 'Disadvantage on save'
  },
  {
    id: 'quickened-spell',
    name: 'Quickened Spell',
    description: 'Cast spell as bonus action (2 sorcery points)',
    shortDescription: 'Cast as bonus action'
  },
  {
    id: 'subtle-spell',
    name: 'Subtle Spell',
    description: 'Cast without verbal or somatic components (1 sorcery point)',
    shortDescription: 'No V/S components'
  },
  {
    id: 'twinned-spell',
    name: 'Twinned Spell',
    description: 'Target second creature with single-target spell (spell level sorcery points)',
    shortDescription: 'Target two creatures'
  }
];

// Warlock Invocations
const ELDRITCH_INVOCATIONS: FeatureChoice[] = [
  {
    id: 'agonizing-blast',
    name: 'Agonizing Blast',
    description: 'Add Charisma modifier to eldritch blast damage',
    shortDescription: '+Cha to eldritch blast'
  },
  {
    id: 'armor-of-shadows',
    name: 'Armor of Shadows',
    description: 'Cast mage armor at will without expending a spell slot',
    shortDescription: 'At-will mage armor'
  },
  {
    id: 'devil-sight',
    name: 'Devil\'s Sight',
    description: 'See normally in darkness, both magical and nonmagical, to 120 feet',
    shortDescription: '120ft darkvision'
  },
  {
    id: 'eldritch-sight',
    name: 'Eldritch Sight',
    description: 'Cast detect magic at will without expending a spell slot',
    shortDescription: 'At-will detect magic'
  },
  {
    id: 'fiendish-vigor',
    name: 'Fiendish Vigor',
    description: 'Cast false life on yourself at will as a 1st-level spell',
    shortDescription: 'At-will false life'
  },
  {
    id: 'mask-of-many-faces',
    name: 'Mask of Many Faces',
    description: 'Cast disguise self at will without expending a spell slot',
    shortDescription: 'At-will disguise self'
  },
  {
    id: 'repelling-blast',
    name: 'Repelling Blast',
    description: 'Push creatures hit by eldritch blast up to 10 feet away',
    shortDescription: 'Push with eldritch blast'
  },
  {
    id: 'thief-of-five-fates',
    name: 'Thief of Five Fates',
    description: 'Cast bane once per long rest without expending a spell slot',
    shortDescription: '1/long rest bane'
  }
];

// Druid Circle spells for Land Druids
const DRUID_LAND_CIRCLES: FeatureChoice[] = [
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Bonus spells: hold person, spike growth, sleet storm, freedom of movement',
    shortDescription: 'Cold/control spells'
  },
  {
    id: 'coast',
    name: 'Coast', 
    description: 'Bonus spells: mirror image, misty step, water breathing, freedom of movement',
    shortDescription: 'Water/mobility spells'
  },
  {
    id: 'desert',
    name: 'Desert',
    description: 'Bonus spells: blur, silence, create food and water, blight',
    shortDescription: 'Survival/debuff spells'
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Bonus spells: barkskin, spider climb, call lightning, freedom of movement', 
    shortDescription: 'Nature/protection spells'
  },
  {
    id: 'grassland',
    name: 'Grassland',
    description: 'Bonus spells: invisibility, pass without trace, daylight, freedom of movement',
    shortDescription: 'Stealth/light spells'
  },
  {
    id: 'mountain',
    name: 'Mountain',
    description: 'Bonus spells: spider climb, spike growth, lightning bolt, freedom of movement',
    shortDescription: 'Movement/lightning spells'
  },
  {
    id: 'swamp',
    name: 'Swamp',
    description: 'Bonus spells: darkness, melf\'s acid arrow, water walk, freedom of movement',
    shortDescription: 'Darkness/acid spells'
  },
  {
    id: 'underdark',
    name: 'Underdark',
    description: 'Bonus spells: spider climb, web, gaseous form, greater invisibility',
    shortDescription: 'Underground/stealth spells'
  }
];

export const CLASS_FEATURES_DATABASE: ClassFeature[] = [
  // FIGHTER
  {
    id: 'fighter-fighting-style-1',
    name: 'Fighting Style',
    description: 'You adopt a particular style of fighting as your specialty.',
    level: 1,
    class: 'fighter',
    type: 'choice',
    choices: FIGHTING_STYLES
  },
  {
    id: 'fighter-second-wind',
    name: 'Second Wind',
    description: 'Regain hit points as bonus action (1d10 + fighter level). Recharges on short/long rest.',
    level: 1,
    class: 'fighter',
    type: 'automatic'
  },
  {
    id: 'fighter-action-surge',
    name: 'Action Surge',
    description: 'Take additional action on your turn. Recharges on short/long rest.',
    level: 2,
    class: 'fighter',
    type: 'automatic'
  },
  {
    id: 'fighter-archetype',
    name: 'Martial Archetype',
    description: 'Choose your martial archetype (subclass).',
    level: 3,
    class: 'fighter',
    type: 'choice',
    choices: [
      { id: 'champion', name: 'Champion', description: 'Focus on raw physical power and combat prowess' },
      { id: 'battle-master', name: 'Battle Master', description: 'Tactical fighter with combat maneuvers' },
      { id: 'eldritch-knight', name: 'Eldritch Knight', description: 'Fighter with magical abilities' }
    ]
  },
  {
    id: 'fighter-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 4,
    class: 'fighter',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },
  {
    id: 'fighter-extra-attack',
    name: 'Extra Attack',
    description: 'Attack twice when taking the Attack action.',
    level: 5,
    class: 'fighter',
    type: 'automatic'
  },
  {
    id: 'fighter-asi-6',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 6,
    class: 'fighter',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },
  {
    id: 'fighter-asi-8',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 8,
    class: 'fighter',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },
  {
    id: 'fighter-indomitable',
    name: 'Indomitable',
    description: 'Reroll a saving throw once per long rest.',
    level: 9,
    class: 'fighter',
    type: 'automatic'
  },
  {
    id: 'fighter-extra-attack-2',
    name: 'Extra Attack (2)',
    description: 'Attack three times when taking the Attack action.',
    level: 11,
    class: 'fighter',
    type: 'automatic'
  },
  {
    id: 'fighter-asi-12',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 12,
    class: 'fighter',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },

  // Champion Subclass
  {
    id: 'champion-improved-critical',
    name: 'Improved Critical',
    description: 'Critical hits occur on 19-20.',
    level: 3,
    class: 'fighter',
    subclass: 'champion',
    type: 'automatic'
  },
  {
    id: 'champion-remarkable-athlete',
    name: 'Remarkable Athlete',
    description: 'Add half proficiency bonus to Strength, Dexterity, and Constitution checks.',
    level: 7,
    class: 'fighter',
    subclass: 'champion',
    type: 'automatic'
  },
  {
    id: 'champion-additional-fighting-style',
    name: 'Additional Fighting Style',
    description: 'Choose a second fighting style.',
    level: 10,
    class: 'fighter',
    subclass: 'champion',
    type: 'choice',
    choices: FIGHTING_STYLES
  },
  {
    id: 'champion-superior-critical',
    name: 'Superior Critical',
    description: 'Critical hits occur on 18-20.',
    level: 15,
    class: 'fighter',
    subclass: 'champion',
    type: 'automatic'
  },
  {
    id: 'champion-survivor',
    name: 'Survivor',
    description: 'Regain hit points at start of turn if below half HP.',
    level: 18,
    class: 'fighter',
    subclass: 'champion',
    type: 'automatic'
  },

  // Battle Master Subclass
  {
    id: 'battle-master-combat-superiority',
    name: 'Combat Superiority',
    description: 'Gain 4 superiority dice (d8) and learn 3 combat maneuvers.',
    level: 3,
    class: 'fighter',
    subclass: 'battle-master',
    type: 'choice',
    choices: BATTLE_MASTER_MANEUVERS,
    multipleSelections: true,
    maxSelections: 3
  },
  {
    id: 'battle-master-student-of-war',
    name: 'Student of War',
    description: 'Gain proficiency with one artisan tool of your choice.',
    level: 3,
    class: 'fighter',
    subclass: 'battle-master',
    type: 'choice',
    choices: [
      { id: 'alchemist-supplies', name: "Alchemist's Supplies", description: 'Create potions and identify substances' },
      { id: 'brewers-supplies', name: "Brewer's Supplies", description: 'Create alcoholic beverages' },
      { id: 'calligrapher-supplies', name: "Calligrapher's Supplies", description: 'Create documents and identify handwriting' },
      { id: 'carpenters-tools', name: "Carpenter's Tools", description: 'Construct wooden structures' },
      { id: 'cartographer-tools', name: "Cartographer's Tools", description: 'Create maps and navigate' },
      { id: 'smiths-tools', name: "Smith's Tools", description: 'Work with metal and repair weapons/armor' }
    ]
  },
  {
    id: 'battle-master-additional-maneuvers-7',
    name: 'Additional Maneuvers',
    description: 'Learn 2 additional maneuvers and gain an additional superiority die.',
    level: 7,
    class: 'fighter',
    subclass: 'battle-master',
    type: 'choice',
    choices: BATTLE_MASTER_MANEUVERS,
    multipleSelections: true,
    maxSelections: 2
  },

  // ROGUE
  {
    id: 'rogue-expertise',
    name: 'Expertise',
    description: 'Double proficiency bonus for two chosen skill proficiencies.',
    level: 1,
    class: 'rogue',
    type: 'choice',
    multipleSelections: true,
    maxSelections: 2,
    choices: SKILL_CHOICES
  },
  {
    id: 'rogue-sneak-attack',
    name: 'Sneak Attack',
    description: 'Deal extra damage once per turn when you have advantage or an ally is within 5 feet.',
    level: 1,
    class: 'rogue',
    type: 'automatic'
  },
  {
    id: 'rogue-thieves-cant',
    name: "Thieves' Cant",
    description: 'Secret language and set of cues used by rogues.',
    level: 1,
    class: 'rogue',
    type: 'automatic'
  },
  {
    id: 'rogue-cunning-action',
    name: 'Cunning Action',
    description: 'Use bonus action to Dash, Disengage, or Hide.',
    level: 2,
    class: 'rogue',
    type: 'automatic'
  },
  {
    id: 'rogue-archetype',
    name: 'Roguish Archetype',
    description: 'Choose your roguish archetype (subclass).',
    level: 3,
    class: 'rogue',
    type: 'choice',
    choices: [
      { id: 'thief', name: 'Thief', description: 'Master of stealth, infiltration, and theft' },
      { id: 'assassin', name: 'Assassin', description: 'Master of dealing death from the shadows' },
      { id: 'arcane-trickster', name: 'Arcane Trickster', description: 'Rogue with magical abilities' }
    ]
  },
  {
    id: 'rogue-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 4,
    class: 'rogue',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },
  {
    id: 'rogue-uncanny-dodge',
    name: 'Uncanny Dodge',
    description: 'Use reaction to halve damage from one attack per turn.',
    level: 5,
    class: 'rogue',
    type: 'automatic'
  },
  {
    id: 'rogue-expertise-6',
    name: 'Expertise',
    description: 'Double proficiency bonus for two more skill proficiencies.',
    level: 6,
    class: 'rogue',
    type: 'choice',
    multipleSelections: true,
    maxSelections: 2,
    choices: SKILL_CHOICES
  },
  {
    id: 'rogue-evasion',
    name: 'Evasion',
    description: 'Take no damage on successful Dex saves, half damage on failures.',
    level: 7,
    class: 'rogue',
    type: 'automatic'
  },

  // WIZARD
  {
    id: 'wizard-spellcasting',
    name: 'Spellcasting',
    description: 'Cast wizard spells using Intelligence as spellcasting ability.',
    level: 1,
    class: 'wizard',
    type: 'automatic'
  },
  {
    id: 'wizard-arcane-recovery',
    name: 'Arcane Recovery',
    description: 'Recover spell slots on short rest (once per day).',
    level: 1,
    class: 'wizard',
    type: 'automatic'
  },
  {
    id: 'wizard-arcane-tradition',
    name: 'Arcane Tradition',
    description: 'Choose your arcane tradition (subclass).',
    level: 2,
    class: 'wizard',
    type: 'choice',
    choices: [
      { id: 'abjuration', name: 'School of Abjuration', description: 'Specializes in protective and banishing magic' },
      { id: 'conjuration', name: 'School of Conjuration', description: 'Specializes in summoning and teleportation' },
      { id: 'divination', name: 'School of Divination', description: 'Specializes in information gathering and foresight' },
      { id: 'enchantment', name: 'School of Enchantment', description: 'Specializes in mind control and charm effects' },
      { id: 'evocation', name: 'School of Evocation', description: 'Specializes in damage-dealing magic' },
      { id: 'illusion', name: 'School of Illusion', description: 'Specializes in deception and misdirection' },
      { id: 'necromancy', name: 'School of Necromancy', description: 'Specializes in death, undeath, and life force' },
      { id: 'transmutation', name: 'School of Transmutation', description: 'Specializes in changing matter and energy' }
    ]
  },
  {
    id: 'wizard-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 4,
    class: 'wizard',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },

  // School of Evocation
  {
    id: 'evocation-evocation-savant',
    name: 'Evocation Savant',
    description: 'Gold and time to copy evocation spells is halved.',
    level: 2,
    class: 'wizard',
    subclass: 'evocation',
    type: 'automatic'
  },
  {
    id: 'evocation-sculpt-spells',
    name: 'Sculpt Spells',
    description: 'Protect allies from your evocation spells.',
    level: 2,
    class: 'wizard',
    subclass: 'evocation',
    type: 'automatic'
  },
  {
    id: 'evocation-potent-cantrip',
    name: 'Potent Cantrip',
    description: 'Evocation cantrips deal half damage even on successful saves.',
    level: 6,
    class: 'wizard',
    subclass: 'evocation',
    type: 'automatic'
  },

  // BARBARIAN
  {
    id: 'barbarian-rage',
    name: 'Rage',
    description: 'Advantage on Strength checks and saves, +2 damage to Strength-based melee attacks, resistance to physical damage.',
    level: 1,
    class: 'barbarian',
    type: 'automatic'
  },
  {
    id: 'barbarian-unarmored-defense',
    name: 'Unarmored Defense',
    description: 'AC equals 10 + Dex modifier + Con modifier when not wearing armor.',
    level: 1,
    class: 'barbarian',
    type: 'automatic'
  },
  {
    id: 'barbarian-reckless-attack',
    name: 'Reckless Attack',
    description: 'Gain advantage on Strength-based melee attacks, but attacks against you have advantage.',
    level: 2,
    class: 'barbarian',
    type: 'automatic'
  },
  {
    id: 'barbarian-danger-sense',
    name: 'Danger Sense',
    description: 'Advantage on Dexterity saves against effects you can see.',
    level: 2,
    class: 'barbarian',
    type: 'automatic'
  },
  {
    id: 'barbarian-primal-path',
    name: 'Primal Path',
    description: 'Choose your primal path (subclass).',
    level: 3,
    class: 'barbarian',
    type: 'choice',
    choices: [
      { id: 'berserker', name: 'Path of the Berserker', description: 'Embrace the fury of battle' },
      { id: 'totem-warrior', name: 'Path of the Totem Warrior', description: 'Draw power from animal spirits' }
    ]
  },

  // RANGER
  {
    id: 'ranger-favored-enemy',
    name: 'Favored Enemy',
    description: 'Choose a type of creature as your favored enemy.',
    level: 1,
    class: 'ranger',
    type: 'choice',
    choices: [
      { id: 'beasts', name: 'Beasts', description: 'Natural animals and monstrous beasts' },
      { id: 'fey', name: 'Fey', description: 'Creatures of the Feywild' },
      { id: 'humanoids', name: 'Humanoids', description: 'Humans and human-like creatures' },
      { id: 'monstrosities', name: 'Monstrosities', description: 'Unnatural creatures' },
      { id: 'undead', name: 'Undead', description: 'Zombies, skeletons, and other undead' }
    ]
  },
  {
    id: 'ranger-natural-explorer',
    name: 'Natural Explorer',
    description: 'Choose a favored terrain.',
    level: 1,
    class: 'ranger',
    type: 'choice',
    choices: [
      { id: 'forest', name: 'Forest', description: 'Dense woodlands and jungles' },
      { id: 'grassland', name: 'Grassland', description: 'Plains and prairies' },
      { id: 'mountain', name: 'Mountain', description: 'Rocky peaks and highland' },
      { id: 'swamp', name: 'Swamp', description: 'Marshes and wetlands' },
      { id: 'coast', name: 'Coast', description: 'Shorelines and islands' }
    ]
  },
  {
    id: 'ranger-fighting-style',
    name: 'Fighting Style',
    description: 'Choose a fighting style.',
    level: 2,
    class: 'ranger',
    type: 'choice',
    choices: [
      FIGHTING_STYLES[0], // Archery
      FIGHTING_STYLES[2], // Dueling
      FIGHTING_STYLES[5]  // Two-Weapon Fighting
    ]
  },
  {
    id: 'ranger-spellcasting',
    name: 'Spellcasting',
    description: 'Cast ranger spells using Wisdom as spellcasting ability.',
    level: 2,
    class: 'ranger',
    type: 'automatic'
  },

  // PALADIN
  {
    id: 'paladin-divine-sense',
    name: 'Divine Sense',
    description: 'Detect celestials, fiends, and undead within 60 feet.',
    level: 1,
    class: 'paladin',
    type: 'automatic'
  },
  {
    id: 'paladin-lay-on-hands',
    name: 'Lay on Hands',
    description: 'Heal hit points or cure diseases (5 × paladin level pool).',
    level: 1,
    class: 'paladin',
    type: 'automatic'
  },
  {
    id: 'paladin-fighting-style',
    name: 'Fighting Style',
    description: 'Choose a fighting style.',
    level: 2,
    class: 'paladin',
    type: 'choice',
    choices: [
      FIGHTING_STYLES[1], // Defense
      FIGHTING_STYLES[2], // Dueling
      FIGHTING_STYLES[3], // Great Weapon Fighting
      FIGHTING_STYLES[4]  // Protection
    ]
  },
  {
    id: 'paladin-spellcasting',
    name: 'Spellcasting',
    description: 'Cast paladin spells using Charisma as spellcasting ability.',
    level: 2,
    class: 'paladin',
    type: 'automatic'
  },
  {
    id: 'paladin-divine-smite',
    name: 'Divine Smite',
    description: 'Expend spell slot to deal extra radiant damage on melee weapon hit.',
    level: 2,
    class: 'paladin',
    type: 'automatic'
  },
  {
    id: 'paladin-sacred-oath',
    name: 'Sacred Oath',
    description: 'Choose your sacred oath (subclass).',
    level: 3,
    class: 'paladin',
    type: 'choice',
    choices: [
      { id: 'devotion', name: 'Oath of Devotion', description: 'Champion of justice and honor' },
      { id: 'ancients', name: 'Oath of the Ancients', description: 'Protector of nature and light' },
      { id: 'vengeance', name: 'Oath of Vengeance', description: 'Relentless hunter of evil' }
    ]
  },

  // SORCERER
  {
    id: 'sorcerer-spellcasting',
    name: 'Spellcasting',
    description: 'Cast sorcerer spells using Charisma as spellcasting ability.',
    level: 1,
    class: 'sorcerer',
    type: 'automatic'
  },
  {
    id: 'sorcerer-sorcerous-origin',
    name: 'Sorcerous Origin',
    description: 'Choose your sorcerous origin (subclass).',
    level: 1,
    class: 'sorcerer',
    type: 'choice',
    choices: [
      { id: 'draconic-bloodline', name: 'Draconic Bloodline', description: 'Magic flows from draconic heritage' },
      { id: 'wild-magic', name: 'Wild Magic', description: 'Unpredictable magical surges' }
    ]
  },
  {
    id: 'sorcerer-font-of-magic',
    name: 'Font of Magic',
    description: 'Convert spell slots to sorcery points and vice versa.',
    level: 2,
    class: 'sorcerer',
    type: 'automatic'
  },
  {
    id: 'sorcerer-metamagic',
    name: 'Metamagic',
    description: 'Choose 2 metamagic options to modify your spells.',
    level: 3,
    class: 'sorcerer',
    type: 'choice',
    multipleSelections: true,
    maxSelections: 2,
    choices: METAMAGIC_OPTIONS
  },
  {
    id: 'sorcerer-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 4,
    class: 'sorcerer',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },
  {
    id: 'sorcerer-additional-metamagic',
    name: 'Additional Metamagic',
    description: 'Choose 1 additional metamagic option.',
    level: 10,
    class: 'sorcerer',
    type: 'choice',
    choices: METAMAGIC_OPTIONS
  },

  // WARLOCK
  {
    id: 'warlock-otherworldly-patron',
    name: 'Otherworldly Patron',
    description: 'Choose your otherworldly patron (subclass).',
    level: 1,
    class: 'warlock',
    type: 'choice',
    choices: [
      { id: 'fiend', name: 'The Fiend', description: 'Pact with a fiendish being' },
      { id: 'archfey', name: 'The Archfey', description: 'Pact with a fey lord or lady' },
      { id: 'great-old-one', name: 'The Great Old One', description: 'Pact with an alien entity' }
    ]
  },
  {
    id: 'warlock-pact-magic',
    name: 'Pact Magic',
    description: 'Cast warlock spells using Charisma. All spell slots are the same level.',
    level: 1,
    class: 'warlock',
    type: 'automatic'
  },
  {
    id: 'warlock-eldritch-invocations',
    name: 'Eldritch Invocations',
    description: 'Choose 2 eldritch invocations.',
    level: 2,
    class: 'warlock',
    type: 'choice',
    multipleSelections: true,
    maxSelections: 2,
    choices: ELDRITCH_INVOCATIONS
  },
  {
    id: 'warlock-pact-boon',
    name: 'Pact Boon',
    description: 'Choose your pact boon.',
    level: 3,
    class: 'warlock',
    type: 'choice',
    choices: [
      { id: 'pact-of-the-chain', name: 'Pact of the Chain', description: 'Gain a special familiar' },
      { id: 'pact-of-the-blade', name: 'Pact of the Blade', description: 'Summon a magical weapon' },
      { id: 'pact-of-the-tome', name: 'Pact of the Tome', description: 'Gain a magical book of spells' }
    ]
  },
  {
    id: 'warlock-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 4,
    class: 'warlock',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },
  {
    id: 'warlock-additional-invocations-5',
    name: 'Additional Invocations',
    description: 'Choose 1 additional eldritch invocation.',
    level: 5,
    class: 'warlock',
    type: 'choice',
    choices: ELDRITCH_INVOCATIONS
  },

  // DRUID
  {
    id: 'druid-druidcraft',
    name: 'Druidcraft',
    description: 'Know the druidcraft cantrip.',
    level: 1,
    class: 'druid',
    type: 'automatic'
  },
  {
    id: 'druid-spellcasting',
    name: 'Spellcasting',
    description: 'Cast druid spells using Wisdom as spellcasting ability.',
    level: 1,
    class: 'druid',
    type: 'automatic'
  },
  {
    id: 'druid-wild-shape',
    name: 'Wild Shape',
    description: 'Transform into beasts. Recharges on short/long rest.',
    level: 2,
    class: 'druid',
    type: 'automatic'
  },
  {
    id: 'druid-druid-circle',
    name: 'Druid Circle',
    description: 'Choose your druid circle (subclass).',
    level: 2,
    class: 'druid',
    type: 'choice',
    choices: [
      { id: 'land', name: 'Circle of the Land', description: 'Keeper of old knowledge and magic' },
      { id: 'moon', name: 'Circle of the Moon', description: 'Fierce guardian of the wild' }
    ]
  },
  {
    id: 'druid-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 4,
    class: 'druid',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },

  // Circle of the Land
  {
    id: 'land-bonus-cantrip',
    name: 'Bonus Cantrip',
    description: 'Learn one additional druid cantrip.',
    level: 2,
    class: 'druid',
    subclass: 'land',
    type: 'automatic'
  },
  {
    id: 'land-natural-recovery',
    name: 'Natural Recovery',
    description: 'Recover spell slots during short rest once per day.',
    level: 2,
    class: 'druid',
    subclass: 'land',
    type: 'automatic'
  },
  {
    id: 'land-circle-spells',
    name: 'Circle Spells',
    description: 'Choose your land type for bonus spells.',
    level: 3,
    class: 'druid',
    subclass: 'land',
    type: 'choice',
    choices: DRUID_LAND_CIRCLES
  },

  // CLERIC
  {
    id: 'cleric-spellcasting',
    name: 'Spellcasting',
    description: 'Cast cleric spells using Wisdom as spellcasting ability.',
    level: 1,
    class: 'cleric',
    type: 'automatic'
  },
  {
    id: 'cleric-divine-domain',
    name: 'Divine Domain',
    description: 'Choose your divine domain (subclass).',
    level: 1,
    class: 'cleric',
    type: 'choice',
    choices: [
      { id: 'life', name: 'Life Domain', description: 'Focus on healing and vitality' },
      { id: 'light', name: 'Light Domain', description: 'Burn away darkness and undeath' },
      { id: 'war', name: 'War Domain', description: 'Champion of martial prowess' },
      { id: 'tempest', name: 'Tempest Domain', description: 'Command thunder and lightning' },
      { id: 'nature', name: 'Nature Domain', description: 'Bridge between civilization and wild' },
      { id: 'knowledge', name: 'Knowledge Domain', description: 'Seeker of truth and wisdom' },
      { id: 'trickery', name: 'Trickery Domain', description: 'Master of deception and stealth' }
    ]
  },
  {
    id: 'cleric-channel-divinity',
    name: 'Channel Divinity',
    description: 'Channel divine energy for various effects. Recharges on short/long rest.',
    level: 2,
    class: 'cleric',
    type: 'automatic'
  },
  {
    id: 'cleric-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 4,
    class: 'cleric',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },

  // BARD
  {
    id: 'bard-spellcasting',
    name: 'Spellcasting',
    description: 'Cast bard spells using Charisma as spellcasting ability.',
    level: 1,
    class: 'bard',
    type: 'automatic'
  },
  {
    id: 'bard-bardic-inspiration',
    name: 'Bardic Inspiration',
    description: 'Inspire allies with bonus action. Recharges on short/long rest.',
    level: 1,
    class: 'bard',
    type: 'automatic'
  },
  {
    id: 'bard-jack-of-all-trades',
    name: 'Jack of All Trades',
    description: 'Add half proficiency bonus to non-proficient ability checks.',
    level: 2,
    class: 'bard',
    type: 'automatic'
  },
  {
    id: 'bard-song-of-rest',
    name: 'Song of Rest',
    description: 'Help party recover additional hit points during short rest.',
    level: 2,
    class: 'bard',
    type: 'automatic'
  },
  {
    id: 'bard-college',
    name: 'Bard College',
    description: 'Choose your bard college (subclass).',
    level: 3,
    class: 'bard',
    type: 'choice',
    choices: [
      { id: 'lore', name: 'College of Lore', description: 'Master of knowledge and magical secrets' },
      { id: 'valor', name: 'College of Valor', description: 'Warrior-poet inspiring from the front lines' }
    ]
  },
  {
    id: 'bard-expertise',
    name: 'Expertise',
    description: 'Double proficiency bonus for two chosen skill proficiencies.',
    level: 3,
    class: 'bard',
    type: 'choice',
    multipleSelections: true,
    maxSelections: 2,
    choices: SKILL_CHOICES
  },
  {
    id: 'bard-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 4,
    class: 'bard',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  },

  // MONK
  {
    id: 'monk-unarmored-defense',
    name: 'Unarmored Defense',
    description: 'AC equals 10 + Dex modifier + Wis modifier when not wearing armor.',
    level: 1,
    class: 'monk',
    type: 'automatic'
  },
  {
    id: 'monk-martial-arts',
    name: 'Martial Arts',
    description: 'Unarmed strikes and monk weapons use Dex, deal more damage, and allow bonus unarmed strike.',
    level: 1,
    class: 'monk',
    type: 'automatic'
  },
  {
    id: 'monk-ki',
    name: 'Ki',
    description: 'Spend ki points for special abilities. Recharges on short/long rest.',
    level: 2,
    class: 'monk',
    type: 'automatic'
  },
  {
    id: 'monk-unarmored-movement',
    name: 'Unarmored Movement',
    description: 'Speed increases when not wearing armor or using a shield.',
    level: 2,
    class: 'monk',
    type: 'automatic'
  },
  {
    id: 'monk-monastic-tradition',
    name: 'Monastic Tradition',
    description: 'Choose your monastic tradition (subclass).',
    level: 3,
    class: 'monk',
    type: 'choice',
    choices: [
      { id: 'open-hand', name: 'Way of the Open Hand', description: 'Master of martial arts techniques' },
      { id: 'shadow', name: 'Way of Shadow', description: 'Use shadows and darkness as tools' },
      { id: 'four-elements', name: 'Way of the Four Elements', description: 'Channel elemental power' }
    ]
  },
  {
    id: 'monk-deflect-missiles',
    name: 'Deflect Missiles',
    description: 'Reduce ranged weapon damage and potentially throw projectile back.',
    level: 3,
    class: 'monk',
    type: 'automatic'
  },
  {
    id: 'monk-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase two ability scores by 1 each, or one ability score by 2, or take a feat.',
    level: 4,
    class: 'monk',
    type: 'improvement',
    improvements: [{ type: 'asi', points: 2 }, { type: 'feat' }]
  }
];

// Helper functions
export const getClassFeatures = (className: string, level: number, subclass?: string): ClassFeature[] => {
  return CLASS_FEATURES_DATABASE.filter(feature => {
    if (feature.class !== className.toLowerCase()) return false;
    if (feature.level > level) return false;
    if (feature.subclass && (!subclass || feature.subclass !== subclass.toLowerCase())) return false;
    return true;
  }).sort((a, b) => a.level - b.level);
};

export const getFeaturesRequiringChoices = (features: ClassFeature[]): ClassFeature[] => {
  return features.filter(feature => feature.type === 'choice' || feature.type === 'improvement');
};

export const validateFeatureSelections = (
  features: ClassFeature[], 
  selections: { [featureId: string]: any }
): { valid: boolean; missing: string[]; errors: string[] } => {
  const missing: string[] = [];
  const errors: string[] = [];

  const choiceFeatures = getFeaturesRequiringChoices(features);

  choiceFeatures.forEach(feature => {
    const selection = selections[feature.id];
    
    if (!selection || !selection.selections || selection.selections.length === 0) {
      if (feature.type === 'choice') {
        missing.push(`${feature.name} (Level ${feature.level})`);
      } else if (feature.type === 'improvement') {
        missing.push(`${feature.name} (Level ${feature.level}) - Choose ability score improvements or feat`);
      }
    } else {
      // Validate selection counts
      if (feature.multipleSelections && feature.maxSelections) {
        if (selection.selections.length > feature.maxSelections) {
          errors.push(`${feature.name}: Too many selections (${selection.selections.length}/${feature.maxSelections})`);
        }
      } else if (!feature.multipleSelections && selection.selections.length > 1) {
        errors.push(`${feature.name}: Only one selection allowed`);
      }
    }
  });

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
};
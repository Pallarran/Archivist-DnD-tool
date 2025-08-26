import type { Effect } from '../../types/effects';

// Core feats from the Player's Handbook and SRD
export const feats: Record<string, Effect> = {
  'sharpshooter': {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'You have mastered ranged weapons and can make shots that others find difficult or impossible.',
    source: { book: 'PHB', page: 170 },
    type: 'feat',
    prerequisites: ['Dexterity 13 or higher'],
    hooks: {
      onAttackRoll: (context) => {
        // -5 attack bonus, +10 damage (policy-controlled)
        if (context.weapon && 
            context.build.equipment.mainHand?.properties.includes('ranged') &&
            context.build.policies.powerAttackThresholdEV > 0) {
          return {
            toHitBonus: -5,
          };
        }
        return {};
      },
      onHit: (context) => {
        if (context.weapon && 
            context.build.equipment.mainHand?.properties.includes('ranged') &&
            context.build.policies.powerAttackThresholdEV > 0) {
          return {
            bonus: 10,
          };
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      mutuallyExclusive: ['great-weapon-master'],
      category: 'power-attack',
    },
    tags: ['combat', 'ranged', 'power-attack'],
  },

  'great-weapon-master': {
    id: 'great-weapon-master',
    name: 'Great Weapon Master',
    description: 'You have learned to put the weight of a weapon to your advantage, letting its momentum empower your strikes.',
    source: { book: 'PHB', page: 167 },
    type: 'feat',
    hooks: {
      onAttackRoll: (context) => {
        // -5 attack bonus, +10 damage (policy-controlled)
        if (context.weapon && 
            context.build.equipment.mainHand?.properties.includes('heavy') &&
            context.build.policies.powerAttackThresholdEV > 0) {
          return {
            toHitBonus: -5,
          };
        }
        return {};
      },
      onHit: (context) => {
        if (context.weapon && 
            context.build.equipment.mainHand?.properties.includes('heavy') &&
            context.build.policies.powerAttackThresholdEV > 0) {
          return {
            bonus: 10,
          };
        }
        return {};
      },
      onKill: () => {
        // Bonus action attack on kill (handled by policy system)
      },
    },
    modifiers: {},
    stacking: {
      mutuallyExclusive: ['sharpshooter'],
      category: 'power-attack',
    },
    tags: ['combat', 'melee', 'power-attack', 'bonus-action'],
  },

  'elven-accuracy': {
    id: 'elven-accuracy',
    name: 'Elven Accuracy',
    description: 'The accuracy of elves is legendary, especially that of elf archers and spellcasters.',
    source: { book: 'XGtE', page: 74 },
    type: 'feat',
    prerequisites: ['Elf or half-elf'],
    hooks: {
      onAttackRoll: (context) => {
        // Roll three dice instead of two when you have advantage
        if (context.combat.advantage === 'advantage') {
          return {
            advantageState: 'elven-accuracy',
          };
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'advantage-modifier',
    },
    tags: ['combat', 'advantage', 'elf'],
  },

  'polearm-master': {
    id: 'polearm-master',
    name: 'Polearm Master',
    description: 'You can keep your enemies at bay with reach weapons.',
    source: { book: 'PHB', page: 168 },
    type: 'feat',
    hooks: {
      onHit: (context) => {
        // Bonus action butt end attack
        if (context.weapon &&
            (context.build.equipment.mainHand?.properties.includes('reach') ||
             context.build.equipment.mainHand?.type.includes('glaive') ||
             context.build.equipment.mainHand?.type.includes('halberd') ||
             context.build.equipment.mainHand?.type.includes('pike') ||
             context.build.equipment.mainHand?.type.includes('quarterstaff') ||
             context.build.equipment.mainHand?.type.includes('spear'))) {
          return {};
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'weapon-mastery',
    },
    usage: {
      perTurn: 1, // Bonus action attack
    },
    conditions: {
      weaponTypes: ['glaive', 'halberd', 'pike', 'quarterstaff', 'spear'],
      combatPhase: 'bonus',
    },
    tags: ['combat', 'reach', 'bonus-action', 'opportunity-attack'],
  },

  'lucky': {
    id: 'lucky',
    name: 'Lucky',
    description: 'You have inexplicable luck that seems to kick in at just the right moment.',
    source: { book: 'PHB', page: 167 },
    type: 'feat',
    hooks: {
      onAttackRoll: () => {
        // Can reroll dice (limited uses)
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'luck',
    },
    usage: {
      perLongRest: 3,
    },
    tags: ['utility', 'reroll', 'luck'],
  },

  'sentinel': {
    id: 'sentinel',
    name: 'Sentinel',
    description: 'You have mastered techniques to take advantage of every drop in any enemy\'s guard.',
    source: { book: 'PHB', page: 169 },
    type: 'feat',
    hooks: {},
    modifiers: {},
    stacking: {
      category: 'opportunity-attack',
    },
    tags: ['combat', 'opportunity-attack', 'control'],
  },

  'crossbow-expert': {
    id: 'crossbow-expert',
    name: 'Crossbow Expert',
    description: 'Thanks to extensive practice with the crossbow, you gain the following benefits.',
    source: { book: 'PHB', page: 165 },
    type: 'feat',
    hooks: {
      onHit: () => {
        // Bonus action hand crossbow attack would be handled by policy system
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'ranged-mastery',
    },
    usage: {
      perTurn: 1, // Bonus action attack
    },
    conditions: {
      weaponTypes: ['hand crossbow', 'light crossbow', 'heavy crossbow'],
      combatPhase: 'bonus',
    },
    tags: ['combat', 'ranged', 'bonus-action', 'crossbow'],
  },

  'magic-initiate': {
    id: 'magic-initiate',
    name: 'Magic Initiate',
    description: 'Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You learn two cantrips of your choice from that class\'s spell list.',
    source: { book: 'PHB', page: 168 },
    type: 'feat',
    hooks: {},
    modifiers: {},
    stacking: {
      category: 'spellcasting',
    },
    tags: ['spellcasting', 'cantrips', 'utility'],
  },

  'resilient': {
    id: 'resilient',
    name: 'Resilient',
    description: 'Choose one ability score. You gain proficiency in saving throws using the chosen ability.',
    source: { book: 'PHB', page: 168 },
    type: 'feat',
    hooks: {},
    modifiers: {
      // Saving throw proficiency would be applied based on chosen ability
    },
    stacking: {
      category: 'saving-throw',
    },
    tags: ['defense', 'saving-throws', 'proficiency'],
  },

  'war-caster': {
    id: 'war-caster',
    name: 'War Caster',
    description: 'You have practiced casting spells in the midst of combat, learning techniques that grant you the following benefits.',
    source: { book: 'PHB', page: 170 },
    type: 'feat',
    prerequisites: ['Ability to cast at least one spell'],
    hooks: {},
    modifiers: {
      advantageOn: ['concentration'],
    },
    stacking: {
      category: 'spellcasting',
    },
    tags: ['spellcasting', 'concentration', 'opportunity-attack'],
  },
};
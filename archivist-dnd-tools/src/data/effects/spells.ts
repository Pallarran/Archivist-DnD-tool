import type { Effect } from '../../types/effects';

// Core spells that commonly affect combat calculations
export const spells: Record<string, Effect> = {
  'bless': {
    id: 'bless',
    name: 'Bless',
    description: 'You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw.',
    source: { book: 'PHB', page: 219 },
    type: 'spell',
    level: 1,
    hooks: {
      onAttackRoll: () => ({
        bonusDice: [{ dice: '1d4', type: 'bless' }],
      }),
      onSave: () => ({
        dcBonus: 0, // Bless affects attack rolls and saves, not spell DCs
      }),
    },
    modifiers: {},
    stacking: {
      category: 'bonus-dice',
    },
    duration: {
      minutes: 1,
      concentration: true,
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 1,
    },
    conditions: {
      targetTypes: ['ally'],
    },
    tags: ['enchantment', 'concentration', 'support', 'attack-bonus', 'save-bonus'],
  },

  'bane': {
    id: 'bane',
    name: 'Bane',
    description: 'Up to three creatures of your choice that you can see within range must make Charisma saving throws. Whenever a target that fails this saving throw makes an attack roll or a saving throw before the spell ends, the target must roll a d4 and subtract the number rolled from the attack roll or saving throw.',
    source: { book: 'PHB', page: 216 },
    type: 'spell',
    level: 1,
    hooks: {
      onAttackRoll: () => ({
        bonusDice: [{ dice: '-1d4', type: 'bane' }],
      }),
      onSave: () => ({
        dcBonus: 0, // Bane affects attack rolls and saves, not spell DCs
      }),
    },
    modifiers: {},
    stacking: {
      category: 'bonus-dice',
    },
    duration: {
      minutes: 1,
      concentration: true,
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 1,
    },
    conditions: {
      targetTypes: ['enemy'],
    },
    tags: ['enchantment', 'concentration', 'debuff', 'attack-penalty', 'save-penalty'],
  },

  'hex': {
    id: 'hex',
    name: 'Hex',
    description: 'You place a curse on a creature that you can see within range. Until the spell ends, you deal an extra 1d6 necrotic damage to the target whenever you hit it with an attack.',
    source: { book: 'PHB', page: 251 },
    type: 'spell',
    level: 1,
    hooks: {
      onHit: () => ({
        dice: '1d6',
        damageType: 'necrotic',
      }),
    },
    modifiers: {},
    stacking: {
      category: 'damage-rider',
    },
    duration: {
      hours: 1,
      concentration: true,
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 1,
    },
    conditions: {
      targetTypes: ['enemy'],
    },
    tags: ['enchantment', 'concentration', 'damage', 'necrotic', 'curse'],
  },

  'hunters-mark': {
    id: 'hunters-mark',
    name: "Hunter's Mark",
    description: 'You choose a creature you can see within range and mystically mark it as your quarry. Until the spell ends, you deal an extra 1d6 damage to the target whenever you hit it with a weapon attack.',
    source: { book: 'PHB', page: 251 },
    type: 'spell',
    level: 1,
    hooks: {
      onHit: (context) => {
        // Only applies to weapon attacks
        if (context.weapon) {
          return {
            dice: '1d6',
            damageType: 'force', // Hunter's mark damage type matches the weapon
          };
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'damage-rider',
    },
    duration: {
      hours: 1,
      concentration: true,
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 1,
    },
    conditions: {
      weaponTypes: ['all'], // Any weapon attack
      targetTypes: ['enemy'],
    },
    tags: ['divination', 'concentration', 'damage', 'weapon-only', 'ranger'],
  },

  'haste': {
    id: 'haste',
    name: 'Haste',
    description: 'Choose a willing creature that you can see within range. Until the spell ends, the target\'s speed is doubled, it gains a +2 bonus to AC, it has advantage on Dexterity saving throws, and it gains an additional action on each of its turns.',
    source: { book: 'PHB', page: 250 },
    type: 'spell',
    level: 3,
    hooks: {
      // Additional action is handled by the action economy system
    },
    modifiers: {
      ac: 2,
      speed: 2, // Multiplier
      advantageOn: ['dexterity-saves'],
    },
    stacking: {
      category: 'enhancement',
    },
    duration: {
      minutes: 1,
      concentration: true,
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 3,
    },
    conditions: {
      targetTypes: ['ally', 'self'],
    },
    tags: ['transmutation', 'concentration', 'enhancement', 'speed', 'ac', 'action'],
  },

  'shield': {
    id: 'shield',
    name: 'Shield',
    description: 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.',
    source: { book: 'PHB', page: 275 },
    type: 'spell',
    level: 1,
    hooks: {},
    modifiers: {
      ac: 5,
    },
    stacking: {
      category: 'ac-bonus',
    },
    duration: {
      rounds: 1,
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 1,
    },
    conditions: {
      combatPhase: 'reaction',
    },
    tags: ['abjuration', 'reaction', 'ac', 'defense'],
  },

  'faerie-fire': {
    id: 'faerie-fire',
    name: 'Faerie Fire',
    description: 'Each object in a 20-foot cube within range is outlined in blue, green, or violet light. Any creature in the area when the spell is cast is also outlined in light if it fails a Dexterity saving throw. For the duration, objects and affected creatures shed dim light in a 10-foot radius and can\'t benefit from being invisible, and attack rolls against them have advantage.',
    source: { book: 'PHB', page: 239 },
    type: 'spell',
    level: 1,
    hooks: {
      // Advantage on attacks against affected creatures
    },
    modifiers: {
      disadvantageOn: ['stealth'], // Can't be invisible
    },
    stacking: {
      category: 'debuff',
    },
    duration: {
      minutes: 1,
      concentration: true,
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 1,
    },
    conditions: {
      targetTypes: ['enemy'],
    },
    tags: ['evocation', 'concentration', 'debuff', 'advantage', 'area'],
  },

  'magic-weapon': {
    id: 'magic-weapon',
    name: 'Magic Weapon',
    description: 'You touch a nonmagical weapon. Until the spell ends, that weapon becomes a magic weapon with a +1 bonus to attack rolls and damage rolls.',
    source: { book: 'PHB', page: 257 },
    type: 'spell',
    level: 2,
    hooks: {
      onAttackRoll: () => ({
        toHitBonus: 1,
      }),
      onHit: () => ({
        bonus: 1,
      }),
    },
    modifiers: {},
    stacking: {
      category: 'weapon-enhancement',
    },
    duration: {
      hours: 1,
      concentration: true,
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 2,
    },
    conditions: {
      weaponTypes: ['nonmagical'],
    },
    tags: ['transmutation', 'concentration', 'weapon-enhancement', 'attack-bonus', 'damage-bonus'],
  },

  'spiritual-weapon': {
    id: 'spiritual-weapon',
    name: 'Spiritual Weapon',
    description: 'You create a floating, spectral weapon within range that lasts for the duration or until you cast this spell again. When you cast the spell, you can make a melee spell attack against a creature within 5 feet of the weapon.',
    source: { book: 'PHB', page: 278 },
    type: 'spell',
    level: 2,
    hooks: {
      // Creates a bonus action attack
    },
    modifiers: {},
    stacking: {
      category: 'bonus-action-attack',
    },
    duration: {
      minutes: 1,
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 2,
    },
    usage: {
      perTurn: 1, // Bonus action to move and attack
    },
    conditions: {
      combatPhase: 'bonus',
    },
    tags: ['evocation', 'spell-attack', 'bonus-action', 'force'],
  },

  'guidance': {
    id: 'guidance',
    name: 'Guidance',
    description: 'You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice.',
    source: { book: 'PHB', page: 248 },
    type: 'spell',
    level: 0, // Cantrip
    hooks: {},
    modifiers: {},
    stacking: {
      category: 'cantrip-utility',
    },
    duration: {
      minutes: 1,
      concentration: true,
    },
    tags: ['divination', 'concentration', 'cantrip', 'utility', 'ability-check'],
  },

  'eldritch-blast': {
    id: 'eldritch-blast',
    name: 'Eldritch Blast',
    description: 'A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 force damage.',
    source: { book: 'PHB', page: 237 },
    type: 'spell',
    level: 0, // Cantrip
    hooks: {
      // Scales with character level, multiple beams at higher levels
    },
    modifiers: {},
    stacking: {
      category: 'cantrip-damage',
    },
    conditions: {
      spellTypes: ['ranged-attack'],
    },
    tags: ['evocation', 'cantrip', 'force', 'ranged', 'warlock'],
  },
};
import type { Effect } from '../../types/effects';

// Core class features that affect combat calculations
export const features: Record<string, Effect> = {
  'sneak-attack': {
    id: 'sneak-attack',
    name: 'Sneak Attack',
    description: 'Beginning at 1st level, you know how to strike subtly and exploit a foe\'s distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll.',
    source: { book: 'PHB', page: 96 },
    type: 'feature',
    level: 1,
    hooks: {
      onHit: (context) => {
        // Only applies once per turn, requires advantage or ally within 5 feet
        if (context.isMainAction && 
            (context.combat.advantage === 'advantage' || 
             context.weapon && 
             (context.build.equipment.mainHand?.properties.includes('finesse') || 
              context.build.equipment.mainHand?.properties.includes('ranged')))) {
          
          // Calculate sneak attack dice based on rogue level
          const rogueLevel = context.build.levels
            .find(l => l.class.toLowerCase() === 'rogue')?.level || 0;
          const sneakDice = Math.ceil(rogueLevel / 2);
          
          return {
            dice: `${sneakDice}d6`,
            damageType: 'piercing', // Same as weapon
          };
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'once-per-turn-damage',
    },
    usage: {
      perTurn: 1,
    },
    conditions: {
      weaponTypes: ['finesse', 'ranged'],
    },
    tags: ['rogue', 'finesse', 'ranged', 'advantage', 'once-per-turn'],
  },

  'rage': {
    id: 'rage',
    name: 'Rage',
    description: 'In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action.',
    source: { book: 'PHB', page: 48 },
    type: 'feature',
    level: 1,
    hooks: {
      onHit: (context) => {
        // +2 damage to Strength-based melee attacks (scales with level)
        if (context.weapon && 
            !context.build.equipment.mainHand?.properties.includes('ranged') &&
            context.build.abilities.strength >= context.build.abilities.dexterity) {
          
          const barbarianLevel = context.build.levels
            .find(l => l.class.toLowerCase() === 'barbarian')?.level || 0;
          const rageDamage = barbarianLevel >= 16 ? 4 : barbarianLevel >= 9 ? 3 : 2;
          
          return {
            bonus: rageDamage,
          };
        }
        return {};
      },
    },
    modifiers: {
      advantageOn: ['strength-saves'],
    },
    stacking: {
      category: 'class-feature',
    },
    duration: {
      minutes: 1,
    },
    usage: {
      perLongRest: 3, // Varies by level
    },
    conditions: {
      weaponTypes: ['melee'],
      combatPhase: 'bonus',
    },
    tags: ['barbarian', 'melee', 'strength', 'damage-bonus'],
  },

  'divine-smite': {
    id: 'divine-smite',
    name: 'Divine Smite',
    description: 'Starting at 2nd level, when you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target, in addition to the weapon\'s damage.',
    source: { book: 'PHB', page: 85 },
    type: 'feature',
    level: 2,
    hooks: {
      onHit: (context) => {
        // Policy-controlled smite usage
        const shouldSmite = (
          context.build.policies.smitePolicy === 'optimal' ||
          (context.build.policies.smitePolicy === 'onCrit' && context.isCrit) ||
          context.build.policies.smitePolicy === 'always'
        );
        
        if (shouldSmite && context.weapon && 
            !context.build.equipment.mainHand?.properties.includes('ranged')) {
          
          // Base 2d8 + 1d8 per spell level above 1st, +1d8 vs undead/fiends
          return {
            dice: '2d8', // Assuming 1st level slot, would need resource tracking
            damageType: 'radiant',
          };
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'spell-slot-damage',
    },
    resourceCost: {
      type: 'spellSlot',
      amount: 1,
      level: 1,
    },
    conditions: {
      weaponTypes: ['melee'],
    },
    tags: ['paladin', 'melee', 'radiant', 'spell-slot', 'undead', 'fiend'],
  },

  'extra-attack': {
    id: 'extra-attack',
    name: 'Extra Attack',
    description: 'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn.',
    source: { book: 'PHB', page: 72 },
    type: 'feature',
    level: 5,
    hooks: {
      // This is handled by the attack calculation system
    },
    modifiers: {},
    stacking: {
      category: 'attack-count',
    },
    tags: ['fighter', 'paladin', 'ranger', 'barbarian', 'monk', 'attacks'],
  },

  'action-surge': {
    id: 'action-surge',
    name: 'Action Surge',
    description: 'Starting at 2nd level, you can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action.',
    source: { book: 'PHB', page: 72 },
    type: 'feature',
    level: 2,
    hooks: {
      // Additional action for one turn
    },
    modifiers: {},
    stacking: {
      category: 'action-economy',
    },
    usage: {
      perShortRest: 1, // 2 at higher levels
    },
    tags: ['fighter', 'action', 'short-rest'],
  },

  'great-weapon-fighting': {
    id: 'great-weapon-fighting',
    name: 'Great Weapon Fighting',
    description: 'When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll.',
    source: { book: 'PHB', page: 72 },
    type: 'feature',
    hooks: {
      onDamageRoll: (context) => {
        if (context.weapon && 
            context.build.equipment.mainHand?.properties.includes('two-handed')) {
          return {
            reroll: {
              condition: [1, 2],
              once: true,
            },
          };
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'fighting-style',
    },
    conditions: {
      weaponTypes: ['two-handed'],
    },
    tags: ['fighter', 'paladin', 'fighting-style', 'two-handed', 'reroll'],
  },

  'archery': {
    id: 'archery',
    name: 'Archery',
    description: 'You gain a +2 bonus to attack rolls you make with ranged weapons.',
    source: { book: 'PHB', page: 72 },
    type: 'feature',
    hooks: {
      onAttackRoll: (context) => {
        if (context.weapon && 
            context.build.equipment.mainHand?.properties.includes('ranged')) {
          return {
            toHitBonus: 2,
          };
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'fighting-style',
    },
    conditions: {
      weaponTypes: ['ranged'],
    },
    tags: ['fighter', 'paladin', 'ranger', 'fighting-style', 'ranged', 'attack-bonus'],
  },

  'colossus-slayer': {
    id: 'colossus-slayer',
    name: 'Colossus Slayer',
    description: 'Your tenacity can wear down the most potent foes. When you hit a creature with a weapon attack, the creature takes an extra 1d8 damage if it\'s below its hit point maximum.',
    source: { book: 'PHB', page: 93 },
    type: 'feature',
    level: 3,
    hooks: {
      onHit: (context) => {
        // Assumes target is below max HP (common in combat)
        if (context.weapon) {
          return {
            dice: '1d8',
            damageType: 'force', // Same as weapon
          };
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'hunter-feature',
    },
    usage: {
      perTurn: 1,
    },
    conditions: {
      weaponTypes: ['all'],
    },
    tags: ['ranger', 'hunter', 'damage', 'once-per-turn'],
  },

  'eldritch-invocation-agonizing-blast': {
    id: 'eldritch-invocation-agonizing-blast',
    name: 'Agonizing Blast',
    description: 'When you cast eldritch blast, add your Charisma modifier to the damage it deals on a hit.',
    source: { book: 'PHB', page: 110 },
    type: 'feature',
    level: 2,
    prerequisites: ['eldritch blast cantrip'],
    hooks: {
      onHit: (context) => {
        if (context.spell === 'eldritch-blast') {
          const chaMod = Math.floor((context.build.abilities.charisma - 10) / 2);
          return {
            bonus: chaMod,
          };
        }
        return {};
      },
    },
    modifiers: {},
    stacking: {
      category: 'eldritch-invocation',
    },
    conditions: {
      spellTypes: ['eldritch-blast'],
    },
    tags: ['warlock', 'invocation', 'eldritch-blast', 'charisma', 'damage-bonus'],
  },

  'superiority-dice': {
    id: 'superiority-dice',
    name: 'Superiority Dice',
    description: 'You have four superiority dice, which are d8s. A superiority die is expended when you use it.',
    source: { book: 'PHB', page: 74 },
    type: 'feature',
    level: 3,
    hooks: {
      // Various maneuver effects would be implemented here
    },
    modifiers: {},
    stacking: {
      category: 'battlemaster',
    },
    usage: {
      perShortRest: 4, // Varies by level
    },
    resourceCost: {
      type: 'superiorityDie',
      amount: 1,
    },
    tags: ['fighter', 'battlemaster', 'maneuvers', 'short-rest'],
  },

  'ki': {
    id: 'ki',
    name: 'Ki',
    description: 'Starting at 2nd level, your training allows you to harness the mystic energy of ki.',
    source: { book: 'PHB', page: 78 },
    type: 'feature',
    level: 2,
    hooks: {
      // Various ki abilities would be implemented here
    },
    modifiers: {},
    stacking: {
      category: 'monk-resource',
    },
    usage: {
      perShortRest: 2, // Equals monk level
    },
    resourceCost: {
      type: 'ki',
      amount: 1,
    },
    tags: ['monk', 'ki', 'short-rest', 'resource'],
  },
};
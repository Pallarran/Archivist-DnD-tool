/**
 * Comprehensive Effects Database for D&D 5e 2014-era Content
 * Covers Player's Handbook, Xanathar's Guide, Tasha's, and other pre-2024 content
 */

import type { Effect } from '../../types/effects';

// Class Features Database
export const CLASS_FEATURES: Record<string, Effect> = {
  // Fighter Features
  'action-surge': {
    id: 'action-surge',
    name: 'Action Surge',
    description: 'On your turn, you can take one additional action.',
    source: { book: 'Player\'s Handbook', page: 72 },
    category: 'class-feature',
    class: 'Fighter',
    level: 2,
    hooks: {
      onTurnStart: (context) => ({
        extraActions: 1,
        resourceCost: { type: 'actionSurge', amount: 1 }
      })
    },
    resourceCost: { type: 'actionSurge', amount: 1 },
    rechargeType: 'short-rest'
  },

  'extra-attack': {
    id: 'extra-attack',
    name: 'Extra Attack',
    description: 'You can attack twice, instead of once, whenever you take the Attack action.',
    source: { book: 'Player\'s Handbook', page: 72 },
    category: 'class-feature',
    class: 'Fighter',
    level: 5,
    hooks: {
      onAttackAction: (context) => ({
        extraAttacks: 1
      })
    }
  },

  'extra-attack-2': {
    id: 'extra-attack-2',
    name: 'Extra Attack (2)',
    description: 'You can attack three times whenever you take the Attack action.',
    source: { book: 'Player\'s Handbook', page: 72 },
    category: 'class-feature',
    class: 'Fighter',
    level: 11,
    hooks: {
      onAttackAction: (context) => ({
        extraAttacks: 2
      })
    }
  },

  'extra-attack-3': {
    id: 'extra-attack-3',
    name: 'Extra Attack (3)',
    description: 'You can attack four times whenever you take the Attack action.',
    source: { book: 'Player\'s Handbook', page: 72 },
    category: 'class-feature',
    class: 'Fighter',
    level: 20,
    hooks: {
      onAttackAction: (context) => ({
        extraAttacks: 3
      })
    }
  },

  // Rogue Features
  'sneak-attack': {
    id: 'sneak-attack',
    name: 'Sneak Attack',
    description: 'Once per turn, you can deal extra damage when you hit with advantage.',
    source: { book: 'Player\'s Handbook', page: 96 },
    category: 'class-feature',
    class: 'Rogue',
    level: 1,
    hooks: {
      onHit: (context) => {
        if (context.hasAdvantage || context.allyWithin5ft) {
          const level = context.characterLevel;
          const sneakDice = Math.ceil(level / 2);
          return {
            bonusDamage: `${sneakDice}d6`,
            damageType: 'piercing'
          };
        }
        return null;
      }
    },
    oncePerTurn: true
  },

  // Paladin Features
  'divine-smite': {
    id: 'divine-smite',
    name: 'Divine Smite',
    description: 'Expend a spell slot to deal extra radiant damage.',
    source: { book: 'Player\'s Handbook', page: 85 },
    category: 'class-feature',
    class: 'Paladin',
    level: 2,
    hooks: {
      onHit: (context) => {
        const spellLevel = context.resourceLevel || 1;
        const baseDamage = 2 + spellLevel;
        const critMultiplier = context.isCritical ? 2 : 1;
        const undeadFiendBonus = context.targetType === 'undead' || context.targetType === 'fiend' ? 1 : 0;
        
        return {
          bonusDamage: `${(baseDamage + undeadFiendBonus) * critMultiplier}d8`,
          damageType: 'radiant',
          resourceCost: { type: 'spellSlot', level: spellLevel, amount: 1 }
        };
      }
    },
    requiresResource: 'spellSlot'
  },

  // Barbarian Features
  'rage': {
    id: 'rage',
    name: 'Rage',
    description: 'Advantage on Strength checks and saves, +2 damage to Strength-based melee attacks.',
    source: { book: 'Player\'s Handbook', page: 48 },
    category: 'class-feature',
    class: 'Barbarian',
    level: 1,
    duration: { rounds: 10 },
    hooks: {
      onDamageRoll: (context) => {
        if (context.isStrengthBased && context.isMeleeAttack) {
          const level = context.characterLevel;
          const rageBonus = level < 9 ? 2 : level < 16 ? 3 : 4;
          return { bonusDamage: rageBonus };
        }
        return null;
      },
      onStrengthCheck: () => ({ advantage: true }),
      onStrengthSave: () => ({ advantage: true })
    },
    resourceCost: { type: 'rage', amount: 1 },
    concentration: false
  },

  'reckless-attack': {
    id: 'reckless-attack',
    name: 'Reckless Attack',
    description: 'Gain advantage on Strength-based melee attacks, but attacks against you have advantage.',
    source: { book: 'Player\'s Handbook', page: 48 },
    category: 'class-feature',
    class: 'Barbarian',
    level: 2,
    hooks: {
      onAttackRoll: (context) => {
        if (context.isStrengthBased && context.isMeleeAttack) {
          return { 
            advantage: true,
            drawback: 'attackersHaveAdvantage'
          };
        }
        return null;
      }
    }
  }
};

// Fighting Styles
export const FIGHTING_STYLES: Record<string, Effect> = {
  'archery': {
    id: 'archery',
    name: 'Archery',
    description: '+2 bonus to attack rolls with ranged weapons.',
    source: { book: 'Player\'s Handbook', page: 72 },
    category: 'fighting-style',
    hooks: {
      onAttackRoll: (context) => {
        if (context.isRangedWeapon) {
          return { toHitBonus: 2 };
        }
        return null;
      }
    }
  },

  'dueling': {
    id: 'dueling',
    name: 'Dueling',
    description: '+2 damage when wielding a one-handed weapon with no other weapons.',
    source: { book: 'Player\'s Handbook', page: 72 },
    category: 'fighting-style',
    hooks: {
      onDamageRoll: (context) => {
        if (context.isOneHanded && !context.hasOffHandWeapon) {
          return { bonusDamage: 2 };
        }
        return null;
      }
    }
  },

  'great-weapon-fighting': {
    id: 'great-weapon-fighting',
    name: 'Great Weapon Fighting',
    description: 'Reroll 1s and 2s on damage dice with two-handed weapons.',
    source: { book: 'Player\'s Handbook', page: 72 },
    category: 'fighting-style',
    hooks: {
      onDamageRoll: (context) => {
        if (context.isTwoHanded) {
          return { rerollOnes: true, rerollTwos: true };
        }
        return null;
      }
    }
  },

  'two-weapon-fighting': {
    id: 'two-weapon-fighting',
    name: 'Two-Weapon Fighting',
    description: 'Add ability modifier to off-hand attack damage.',
    source: { book: 'Player\'s Handbook', page: 72 },
    category: 'fighting-style',
    hooks: {
      onOffHandAttack: (context) => ({
        addAbilityModifier: true
      })
    }
  }
};

// Feats Database
export const FEATS: Record<string, Effect> = {
  'sharpshooter': {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Take -5 to hit for +10 damage with ranged weapons.',
    source: { book: 'Player\'s Handbook', page: 170 },
    category: 'feat',
    powerAttack: {
      penaltyToHit: -5,
      bonusDamage: 10,
      weaponTypes: ['ranged']
    },
    hooks: {
      onAttackRoll: (context) => {
        if (context.usePowerAttack && context.isRangedWeapon) {
          return { toHitPenalty: -5 };
        }
        return null;
      },
      onDamageRoll: (context) => {
        if (context.usePowerAttack && context.isRangedWeapon) {
          return { bonusDamage: 10 };
        }
        return null;
      }
    },
    additionalEffects: [
      'Ignore half and three-quarters cover',
      'No disadvantage on long range attacks'
    ]
  },

  'great-weapon-master': {
    id: 'great-weapon-master',
    name: 'Great Weapon Master',
    description: 'Take -5 to hit for +10 damage with heavy melee weapons.',
    source: { book: 'Player\'s Handbook', page: 167 },
    category: 'feat',
    powerAttack: {
      penaltyToHit: -5,
      bonusDamage: 10,
      weaponProperties: ['heavy']
    },
    hooks: {
      onAttackRoll: (context) => {
        if (context.usePowerAttack && context.weaponHasProperty('heavy')) {
          return { toHitPenalty: -5 };
        }
        return null;
      },
      onDamageRoll: (context) => {
        if (context.usePowerAttack && context.weaponHasProperty('heavy')) {
          return { bonusDamage: 10 };
        }
        return null;
      },
      onCritical: (context) => ({
        bonusAction: 'attack'
      }),
      onKill: (context) => ({
        bonusAction: 'attack'
      })
    }
  },

  'polearm-master': {
    id: 'polearm-master',
    name: 'Polearm Master',
    description: 'Bonus action attack with polearms and opportunity attacks on approach.',
    source: { book: 'Player\'s Handbook', page: 168 },
    category: 'feat',
    weaponTypes: ['glaive', 'halberd', 'pike', 'quarterstaff', 'spear'],
    hooks: {
      onAttackAction: (context) => {
        if (context.weaponType === 'polearm') {
          return { bonusAction: 'buttEnd' };
        }
        return null;
      },
      onEnemyApproach: (context) => ({
        opportunityAttack: true
      })
    }
  },

  'crossbow-expert': {
    id: 'crossbow-expert',
    name: 'Crossbow Expert',
    description: 'Ignore loading, no disadvantage in melee, bonus action hand crossbow attack.',
    source: { book: 'Player\'s Handbook', page: 165 },
    category: 'feat',
    hooks: {
      onAttackAction: (context) => {
        if (context.weaponType === 'hand crossbow') {
          return { bonusAction: 'attack' };
        }
        return null;
      },
      onRangedAttackInMelee: (context) => ({
        removeDisadvantage: true
      })
    },
    weaponProperties: ['ignoreLoading']
  },

  'elven-accuracy': {
    id: 'elven-accuracy',
    name: 'Elven Accuracy',
    description: 'Reroll one die when you have advantage on Dex, Int, Wis, or Cha attacks.',
    source: { book: 'Xanathar\'s Guide', page: 74 },
    category: 'feat',
    prerequisites: ['Elf', 'Half-elf'],
    hooks: {
      onAttackWithAdvantage: (context) => {
        if (['dexterity', 'intelligence', 'wisdom', 'charisma'].includes(context.attackAbility)) {
          return { superAdvantage: true }; // Roll 3d20, take highest
        }
        return null;
      }
    }
  }
};

// Spells Database (Extended)
export const COMPREHENSIVE_SPELLS: Record<string, Effect> = {
  // Cantrips
  'eldritch-blast': {
    id: 'eldritch-blast',
    name: 'Eldritch Blast',
    description: 'A beam of crackling energy streaks toward a creature within range.',
    source: { book: 'Player\'s Handbook', page: 237 },
    category: 'spell',
    level: 0,
    school: 'evocation',
    castingTime: 'action',
    range: 120,
    components: ['V', 'S'],
    duration: 'instantaneous',
    hooks: {
      onCast: (context) => {
        const level = context.characterLevel;
        const beams = 1 + Math.floor((level - 1) / 6); // 1 at 1st, 2 at 5th, 3 at 11th, 4 at 17th
        return {
          attacks: beams,
          damage: '1d10',
          damageType: 'force',
          attackType: 'spell'
        };
      }
    }
  },

  // Concentration Spells
  'hex': {
    id: 'hex',
    name: 'Hex',
    description: 'You place a curse on a creature that you can see within range.',
    source: { book: 'Player\'s Handbook', page: 251 },
    category: 'spell',
    level: 1,
    school: 'enchantment',
    concentration: true,
    duration: { hours: 1 },
    hooks: {
      onHit: (context) => ({
        bonusDamage: '1d6',
        damageType: 'necrotic'
      }),
      onAbilityCheck: (context) => {
        if (context.ability === context.hexedAbility) {
          return { disadvantage: true };
        }
        return null;
      }
    }
  },

  'hunters-mark': {
    id: 'hunters-mark',
    name: "Hunter's Mark",
    description: 'You choose a creature you can see within range and mystically mark it as your quarry.',
    source: { book: 'Player\'s Handbook', page: 251 },
    category: 'spell',
    level: 1,
    school: 'divination',
    concentration: true,
    duration: { hours: 1 },
    hooks: {
      onHit: (context) => ({
        bonusDamage: '1d6',
        damageType: 'force'
      }),
      onWisdomSurvival: (context) => {
        if (context.isTracking) {
          return { advantage: true };
        }
        return null;
      }
    }
  },

  'bless': {
    id: 'bless',
    name: 'Bless',
    description: 'You bless up to three creatures of your choice within range.',
    source: { book: 'Player\'s Handbook', page: 219 },
    category: 'spell',
    level: 1,
    school: 'enchantment',
    concentration: true,
    duration: { minutes: 1 },
    targets: 3,
    hooks: {
      onAttackRoll: () => ({ bonusDie: '1d4' }),
      onSavingThrow: () => ({ bonusDie: '1d4' })
    }
  },

  // Damage Spells
  'fireball': {
    id: 'fireball',
    name: 'Fireball',
    description: 'A bright flash of light streaks toward a location and explodes.',
    source: { book: 'Player\'s Handbook', page: 241 },
    category: 'spell',
    level: 3,
    school: 'evocation',
    areaOfEffect: { type: 'sphere', radius: 20 },
    hooks: {
      onCast: (context) => {
        const spellLevel = context.spellSlotLevel || 3;
        const baseDice = 8;
        const scalingDice = spellLevel - 3;
        return {
          damage: `${baseDice + scalingDice}d6`,
          damageType: 'fire',
          saveType: 'dexterity',
          saveEffect: 'half'
        };
      }
    }
  },

  'spiritual-weapon': {
    id: 'spiritual-weapon',
    name: 'Spiritual Weapon',
    description: 'You create a floating, spectral weapon that attacks enemies.',
    source: { book: 'Player\'s Handbook', page: 278 },
    category: 'spell',
    level: 2,
    school: 'evocation',
    concentration: false,
    duration: { minutes: 1 },
    hooks: {
      onCast: (context) => ({
        summon: 'spiritualWeapon',
        bonusActionAttack: true
      }),
      onBonusAction: (context) => {
        if (context.hasSpiritualWeapon) {
          const spellLevel = context.spellSlotLevel || 2;
          const damage = 1 + Math.floor((spellLevel - 2) / 2);
          return {
            attack: true,
            damage: `1d8+${damage}`,
            damageType: 'force',
            attackType: 'spell'
          };
        }
        return null;
      }
    }
  }
};

// Conditions Database
export const CONDITIONS: Record<string, Effect> = {
  'prone': {
    id: 'prone',
    name: 'Prone',
    description: 'Disadvantage on attack rolls, attacks within 5 feet have advantage.',
    source: { book: 'Player\'s Handbook', page: 292 },
    category: 'condition',
    hooks: {
      onAttackRoll: () => ({ disadvantage: true }),
      onBeingAttacked: (context) => {
        if (context.attackerWithin5Feet) {
          return { attackerHasAdvantage: true };
        } else {
          return { attackerHasDisadvantage: true };
        }
      }
    }
  },

  'restrained': {
    id: 'restrained',
    name: 'Restrained',
    description: 'Speed is 0, disadvantage on attack rolls and Dex saves, attacks have advantage.',
    source: { book: 'Player\'s Handbook', page: 292 },
    category: 'condition',
    hooks: {
      onAttackRoll: () => ({ disadvantage: true }),
      onDexteritySave: () => ({ disadvantage: true }),
      onBeingAttacked: () => ({ attackerHasAdvantage: true })
    }
  },

  'poisoned': {
    id: 'poisoned',
    name: 'Poisoned',
    description: 'Disadvantage on attack rolls and ability checks.',
    source: { book: 'Player\'s Handbook', page: 292 },
    category: 'condition',
    hooks: {
      onAttackRoll: () => ({ disadvantage: true }),
      onAbilityCheck: () => ({ disadvantage: true })
    }
  }
};

// Magic Items (SRD-safe examples)
export const MAGIC_ITEMS: Record<string, Effect> = {
  'weapon-plus-1': {
    id: 'weapon-plus-1',
    name: 'Weapon +1',
    description: 'You have a +1 bonus to attack and damage rolls made with this magic weapon.',
    source: { book: 'SRD', page: 0 },
    category: 'magic-item',
    rarity: 'uncommon',
    hooks: {
      onAttackRoll: () => ({ toHitBonus: 1 }),
      onDamageRoll: () => ({ bonusDamage: 1 })
    }
  },

  'weapon-plus-2': {
    id: 'weapon-plus-2',
    name: 'Weapon +2',
    description: 'You have a +2 bonus to attack and damage rolls made with this magic weapon.',
    source: { book: 'SRD', page: 0 },
    category: 'magic-item',
    rarity: 'rare',
    hooks: {
      onAttackRoll: () => ({ toHitBonus: 2 }),
      onDamageRoll: () => ({ bonusDamage: 2 })
    }
  },

  'armor-plus-1': {
    id: 'armor-plus-1',
    name: 'Armor +1',
    description: 'You have a +1 bonus to AC while wearing this armor.',
    source: { book: 'SRD', page: 0 },
    category: 'magic-item',
    rarity: 'rare',
    hooks: {
      onArmorClass: () => ({ acBonus: 1 })
    }
  }
};

// Combine all effects into a single comprehensive database
export const COMPREHENSIVE_EFFECTS_DATABASE = {
  ...CLASS_FEATURES,
  ...FIGHTING_STYLES,
  ...FEATS,
  ...COMPREHENSIVE_SPELLS,
  ...CONDITIONS,
  ...MAGIC_ITEMS
};

// Helper functions for effect management
export const getEffectsByCategory = (category: string): Effect[] => {
  return Object.values(COMPREHENSIVE_EFFECTS_DATABASE).filter(
    effect => effect.category === category
  );
};

export const getEffectsByClass = (className: string): Effect[] => {
  return Object.values(COMPREHENSIVE_EFFECTS_DATABASE).filter(
    effect => effect.class === className
  );
};

export const getEffectsByLevel = (level: number): Effect[] => {
  return Object.values(COMPREHENSIVE_EFFECTS_DATABASE).filter(
    effect => effect.level && effect.level <= level
  );
};

export const searchEffects = (query: string): Effect[] => {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(COMPREHENSIVE_EFFECTS_DATABASE).filter(effect =>
    effect.name.toLowerCase().includes(lowercaseQuery) ||
    effect.description.toLowerCase().includes(lowercaseQuery)
  );
};

// Effect validation and compatibility checking
export const validateEffectCombination = (effects: Effect[]): {
  valid: boolean;
  conflicts: string[];
  warnings: string[];
} => {
  const conflicts: string[] = [];
  const warnings: string[] = [];
  
  // Check for concentration conflicts
  const concentrationSpells = effects.filter(effect => effect.concentration);
  if (concentrationSpells.length > 1) {
    conflicts.push('Cannot concentrate on multiple spells simultaneously');
  }
  
  // Check for duplicate fighting styles
  const fightingStyles = effects.filter(effect => effect.category === 'fighting-style');
  if (fightingStyles.length > 1) {
    warnings.push('Multiple fighting styles may not stack as intended');
  }
  
  // Check for prerequisite requirements
  effects.forEach(effect => {
    if (effect.prerequisites) {
      // This would need to be checked against character build
      warnings.push(`${effect.name} has prerequisites that should be verified`);
    }
  });
  
  return {
    valid: conflicts.length === 0,
    conflicts,
    warnings
  };
};
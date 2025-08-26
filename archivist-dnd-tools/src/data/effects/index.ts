import type { EffectLibrary } from '../../types/effects';
import { feats } from './feats';
import { spells } from './spells';
import { features } from './features';

// Combine all effect libraries
export const effectLibrary: EffectLibrary = {
  feats,
  features,
  spells,
  items: {}, // TODO: Implement magic items
  conditions: {
    'prone': {
      id: 'prone',
      name: 'Prone',
      description: 'A prone creature\'s only movement option is to crawl, unless it stands up and thereby ends the condition.',
      source: { book: 'PHB', page: 292 },
      type: 'condition',
      hooks: {},
      modifiers: {
        disadvantageOn: ['attack-rolls'],
        advantageOn: ['melee-attacks-against'], // Attacks against prone creatures
      },
      stacking: { category: 'condition' },
      tags: ['condition', 'movement', 'advantage', 'disadvantage'],
    },
    
    'restrained': {
      id: 'restrained',
      name: 'Restrained',
      description: 'A restrained creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed.',
      source: { book: 'PHB', page: 292 },
      type: 'condition',
      hooks: {},
      modifiers: {
        speed: 0,
        disadvantageOn: ['attack-rolls', 'dexterity-saves'],
        advantageOn: ['attacks-against'], // All attacks against restrained creatures
      },
      stacking: { category: 'condition' },
      tags: ['condition', 'movement', 'advantage', 'disadvantage'],
    },
    
    'poisoned': {
      id: 'poisoned',
      name: 'Poisoned',
      description: 'A poisoned creature has disadvantage on attack rolls and ability checks.',
      source: { book: 'PHB', page: 292 },
      type: 'condition',
      hooks: {},
      modifiers: {
        disadvantageOn: ['attack-rolls', 'ability-checks'],
      },
      stacking: { category: 'condition' },
      tags: ['condition', 'disadvantage', 'poison'],
    },
    
    'frightened': {
      id: 'frightened',
      name: 'Frightened',
      description: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.',
      source: { book: 'PHB', page: 290 },
      type: 'condition',
      hooks: {},
      modifiers: {
        disadvantageOn: ['attack-rolls', 'ability-checks'],
      },
      stacking: { category: 'condition' },
      tags: ['condition', 'disadvantage', 'fear'],
    },
  },
};

// Helper functions for working with effects
export const getEffect = (id: string): any => {
  return (
    effectLibrary.feats[id] ||
    effectLibrary.features[id] ||
    effectLibrary.spells[id] ||
    effectLibrary.items[id] ||
    effectLibrary.conditions[id]
  );
};

export const getEffectsByType = (type: 'feat' | 'feature' | 'spell' | 'item' | 'condition') => {
  return effectLibrary[`${type}s` as keyof EffectLibrary];
};

export const searchEffects = (query: string, tags?: string[]) => {
  const allEffects = [
    ...Object.values(effectLibrary.feats),
    ...Object.values(effectLibrary.features),
    ...Object.values(effectLibrary.spells),
    ...Object.values(effectLibrary.items),
    ...Object.values(effectLibrary.conditions),
  ];
  
  return allEffects.filter(effect => {
    const matchesQuery = query === '' || 
      effect.name.toLowerCase().includes(query.toLowerCase()) ||
      effect.description.toLowerCase().includes(query.toLowerCase());
    
    const matchesTags = !tags || tags.length === 0 ||
      tags.some(tag => effect.tags?.includes(tag));
    
    return matchesQuery && matchesTags;
  });
};

export const getEffectsBySource = (book: string) => {
  const allEffects = [
    ...Object.values(effectLibrary.feats),
    ...Object.values(effectLibrary.features),
    ...Object.values(effectLibrary.spells),
    ...Object.values(effectLibrary.items),
    ...Object.values(effectLibrary.conditions),
  ];
  
  return allEffects.filter(effect => effect.source.book === book);
};

// Common effect tags for filtering
export const EFFECT_TAGS = {
  // Combat types
  COMBAT: 'combat',
  DAMAGE: 'damage',
  HEALING: 'healing',
  CONTROL: 'control',
  UTILITY: 'utility',
  
  // Damage types
  ACID: 'acid',
  COLD: 'cold',
  FIRE: 'fire',
  FORCE: 'force',
  LIGHTNING: 'lightning',
  NECROTIC: 'necrotic',
  POISON: 'poison',
  PSYCHIC: 'psychic',
  RADIANT: 'radiant',
  THUNDER: 'thunder',
  
  // Physical damage types
  BLUDGEONING: 'bludgeoning',
  PIERCING: 'piercing',
  SLASHING: 'slashing',
  
  // Combat mechanics
  ADVANTAGE: 'advantage',
  DISADVANTAGE: 'disadvantage',
  ATTACK_BONUS: 'attack-bonus',
  DAMAGE_BONUS: 'damage-bonus',
  AC: 'ac',
  SAVING_THROWS: 'saving-throws',
  
  // Action economy
  ACTION: 'action',
  BONUS_ACTION: 'bonus-action',
  REACTION: 'reaction',
  OPPORTUNITY_ATTACK: 'opportunity-attack',
  
  // Resources
  SPELL_SLOT: 'spell-slot',
  SHORT_REST: 'short-rest',
  LONG_REST: 'long-rest',
  CONCENTRATION: 'concentration',
  
  // Classes
  BARBARIAN: 'barbarian',
  BARD: 'bard',
  CLERIC: 'cleric',
  DRUID: 'druid',
  FIGHTER: 'fighter',
  MONK: 'monk',
  PALADIN: 'paladin',
  RANGER: 'ranger',
  ROGUE: 'rogue',
  SORCERER: 'sorcerer',
  WARLOCK: 'warlock',
  WIZARD: 'wizard',
  
  // Weapon types
  MELEE: 'melee',
  RANGED: 'ranged',
  FINESSE: 'finesse',
  HEAVY: 'heavy',
  LIGHT: 'light',
  REACH: 'reach',
  TWO_HANDED: 'two-handed',
  VERSATILE: 'versatile',
} as const;

export type EffectTag = typeof EFFECT_TAGS[keyof typeof EFFECT_TAGS];
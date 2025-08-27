/**
 * Preset Encounter Packs and Enemy Templates
 * Common combat scenarios for DPR analysis
 */

import type { Target } from '../../types/build';
import type { CombatScenario } from '../../engine/monteCarlo';

// Enemy Template Interface
export interface EnemyTemplate extends Target {
  challenge: number;
  hitDie: string;
  averageHitPoints: number;
  speed: number;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  savingThrows: {
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
  };
  skills?: Record<string, number>;
  damageThreshold?: number;
  traits: string[];
  actions: Array<{
    name: string;
    description: string;
    attackBonus?: number;
    damage?: string;
    reach?: number;
    recharge?: string;
  }>;
  legendaryActions?: number;
  reactions?: Array<{
    name: string;
    description: string;
    trigger: string;
  }>;
}

// Common Enemy Templates (SRD-safe)
export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = {
  // CR 1/4 - 1
  'goblin': {
    name: 'Goblin',
    challenge: 0.25,
    hitPoints: 7,
    averageHitPoints: 7,
    maxHP: 7,
    armorClass: 15,
    speed: 30,
    size: 'small',
    type: 'humanoid',
    hitDie: '2d6',
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 10,
      intelligence: 10,
      wisdom: 8,
      charisma: 8
    },
    savingThrows: {},
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    traits: ['Nimble Escape'],
    actions: [
      {
        name: 'Scimitar',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target.',
        attackBonus: 4,
        damage: '1d6+2',
        reach: 5
      },
      {
        name: 'Shortbow',
        description: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target.',
        attackBonus: 4,
        damage: '1d6+2'
      }
    ]
  },

  'orc': {
    name: 'Orc',
    challenge: 1,
    hitPoints: 15,
    averageHitPoints: 15,
    maxHP: 15,
    armorClass: 13,
    speed: 30,
    size: 'medium',
    type: 'humanoid',
    hitDie: '2d8+2',
    abilityScores: {
      strength: 16,
      dexterity: 12,
      constitution: 13,
      intelligence: 7,
      wisdom: 11,
      charisma: 10
    },
    savingThrows: {},
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    traits: ['Aggressive'],
    actions: [
      {
        name: 'Greataxe',
        description: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target.',
        attackBonus: 5,
        damage: '1d12+3',
        reach: 5
      },
      {
        name: 'Javelin',
        description: 'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target.',
        attackBonus: 5,
        damage: '1d6+3'
      }
    ]
  },

  // CR 2-5
  'ogre': {
    name: 'Ogre',
    challenge: 2,
    hitPoints: 59,
    averageHitPoints: 59,
    maxHP: 59,
    armorClass: 11,
    speed: 40,
    size: 'large',
    type: 'giant',
    hitDie: '7d10+21',
    abilityScores: {
      strength: 19,
      dexterity: 8,
      constitution: 16,
      intelligence: 5,
      wisdom: 7,
      charisma: 7
    },
    savingThrows: {},
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    traits: [],
    actions: [
      {
        name: 'Greatclub',
        description: 'Melee Weapon Attack: +6 to hit, reach 5 ft., one target.',
        attackBonus: 6,
        damage: '2d8+4',
        reach: 5
      },
      {
        name: 'Javelin',
        description: 'Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 30/120 ft., one target.',
        attackBonus: 6,
        damage: '2d6+4'
      }
    ]
  },

  'owlbear': {
    name: 'Owlbear',
    challenge: 3,
    hitPoints: 59,
    averageHitPoints: 59,
    maxHP: 59,
    armorClass: 13,
    speed: 40,
    size: 'large',
    type: 'monstrosity',
    hitDie: '7d10+14',
    abilityScores: {
      strength: 20,
      dexterity: 12,
      constitution: 15,
      intelligence: 3,
      wisdom: 12,
      charisma: 7
    },
    savingThrows: {},
    skills: { perception: 3 },
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    traits: ['Keen Sight and Smell'],
    actions: [
      {
        name: 'Multiattack',
        description: 'The owlbear makes two attacks: one with its beak and one with its claws.'
      },
      {
        name: 'Beak',
        description: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one creature.',
        attackBonus: 7,
        damage: '1d10+5',
        reach: 5
      },
      {
        name: 'Claws',
        description: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target.',
        attackBonus: 7,
        damage: '2d8+5',
        reach: 5
      }
    ]
  },

  // CR 6-10
  'hill-giant': {
    name: 'Hill Giant',
    challenge: 5,
    hitPoints: 105,
    averageHitPoints: 105,
    maxHP: 105,
    armorClass: 13,
    speed: 40,
    size: 'huge',
    type: 'giant',
    hitDie: '10d12+20',
    abilityScores: {
      strength: 21,
      dexterity: 8,
      constitution: 15,
      intelligence: 5,
      wisdom: 9,
      charisma: 6
    },
    savingThrows: {},
    skills: { perception: -1 },
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    traits: [],
    actions: [
      {
        name: 'Multiattack',
        description: 'The giant makes two greatclub attacks.'
      },
      {
        name: 'Greatclub',
        description: 'Melee Weapon Attack: +8 to hit, reach 10 ft., one target.',
        attackBonus: 8,
        damage: '3d8+5',
        reach: 10
      },
      {
        name: 'Rock',
        description: 'Ranged Weapon Attack: +8 to hit, range 60/240 ft., one target.',
        attackBonus: 8,
        damage: '3d10+5'
      }
    ]
  },

  // High-level enemies
  'adult-dragon': {
    name: 'Adult Dragon',
    challenge: 17,
    hitPoints: 256,
    averageHitPoints: 256,
    maxHP: 256,
    armorClass: 19,
    speed: 40,
    size: 'huge',
    type: 'dragon',
    hitDie: '19d12+133',
    abilityScores: {
      strength: 27,
      dexterity: 14,
      constitution: 25,
      intelligence: 16,
      wisdom: 13,
      charisma: 21
    },
    savingThrows: {
      dexterity: 8,
      constitution: 13,
      wisdom: 7,
      charisma: 11
    },
    skills: { perception: 13, stealth: 8 },
    resistances: [],
    immunities: ['fire'],
    vulnerabilities: [],
    traits: ['Legendary Resistance (3/Day)', 'Frightful Presence'],
    actions: [
      {
        name: 'Multiattack',
        description: 'The dragon can use its Frightful Presence and then makes three attacks.'
      },
      {
        name: 'Bite',
        description: 'Melee Weapon Attack: +14 to hit, reach 10 ft., one target.',
        attackBonus: 14,
        damage: '2d10+8',
        reach: 10
      },
      {
        name: 'Claw',
        description: 'Melee Weapon Attack: +14 to hit, reach 5 ft., one target.',
        attackBonus: 14,
        damage: '2d6+8',
        reach: 5
      },
      {
        name: 'Fire Breath',
        description: 'The dragon exhales fire in a 60-foot cone.',
        damage: '18d6',
        recharge: '5-6'
      }
    ],
    legendaryActions: 3,
    reactions: [
      {
        name: 'Wing Attack',
        description: 'The dragon beats its wings.',
        trigger: 'End of another creature\'s turn'
      }
    ]
  }
};

// AC Benchmark Enemies (for quick testing)
export const AC_BENCHMARKS: Record<string, Partial<EnemyTemplate>> = {
  'low-ac': {
    name: 'Low AC Target',
    armorClass: 11,
    hitPoints: 50,
    challenge: 1,
    traits: ['Unarmored humanoid or beast']
  },
  'medium-ac': {
    name: 'Medium AC Target',
    armorClass: 15,
    hitPoints: 75,
    challenge: 3,
    traits: ['Chain mail or natural armor']
  },
  'high-ac': {
    name: 'High AC Target',
    armorClass: 18,
    hitPoints: 100,
    challenge: 5,
    traits: ['Plate armor or heavy natural armor']
  },
  'very-high-ac': {
    name: 'Very High AC Target',
    armorClass: 22,
    hitPoints: 150,
    challenge: 10,
    traits: ['Magical armor or ancient creature']
  }
};

// Encounter Packs
export interface EncounterPack {
  id: string;
  name: string;
  description: string;
  category: 'level-appropriate' | 'boss-fight' | 'minion-swarm' | 'mixed-encounter' | 'benchmark';
  recommendedLevels: [number, number]; // [min, max]
  scenarios: CombatScenario[];
  enemies: EnemyTemplate[];
  tacticalNotes: string[];
}

export const ENCOUNTER_PACKS: Record<string, EncounterPack> = {
  'early-game-humanoids': {
    id: 'early-game-humanoids',
    name: 'Early Game Humanoids',
    description: 'Common low-level encounters against bandits, goblins, and guards.',
    category: 'level-appropriate',
    recommendedLevels: [1, 5],
    scenarios: [
      {
        rounds: 5,
        encounters: 1,
        restType: 'none',
        enemyActions: [
          {
            name: 'Basic Attack',
            probability: 0.8,
            effect: (state) => {}
          },
          {
            name: 'Take Cover',
            probability: 0.2,
            effect: (state) => {
              state.resources.conditions.push('partial-cover');
            }
          }
        ],
        environmental: {
          lighting: 'bright',
          terrain: 'normal',
          cover: 'partial'
        }
      }
    ],
    enemies: [
      ENEMY_TEMPLATES['goblin'],
      ENEMY_TEMPLATES['orc']
    ],
    tacticalNotes: [
      'Enemies may use hit-and-run tactics',
      'Consider positioning to avoid ranged attacks',
      'Low HP means burst damage is effective'
    ]
  },

  'mid-tier-beasts': {
    id: 'mid-tier-beasts',
    name: 'Mid-Tier Beasts & Monstrosities',
    description: 'Medium-level encounters against dangerous creatures.',
    category: 'level-appropriate',
    recommendedLevels: [6, 10],
    scenarios: [
      {
        rounds: 4,
        encounters: 1,
        restType: 'short',
        enemyActions: [
          {
            name: 'Multiattack',
            probability: 0.9,
            effect: (state) => {}
          },
          {
            name: 'Special Ability',
            probability: 0.3,
            effect: (state) => {}
          }
        ],
        environmental: {
          lighting: 'dim',
          terrain: 'difficult',
          cover: 'none'
        }
      }
    ],
    enemies: [
      ENEMY_TEMPLATES['owlbear'],
      ENEMY_TEMPLATES['hill-giant']
    ],
    tacticalNotes: [
      'High damage multiattacks require positioning',
      'Consider control spells to limit actions',
      'Difficult terrain affects movement'
    ]
  },

  'boss-encounters': {
    id: 'boss-encounters',
    name: 'Boss Encounters',
    description: 'Single powerful enemies with legendary actions.',
    category: 'boss-fight',
    recommendedLevels: [11, 20],
    scenarios: [
      {
        rounds: 8,
        encounters: 1,
        restType: 'long',
        enemyActions: [
          {
            name: 'Legendary Action',
            probability: 1.0,
            effect: (state) => {}
          },
          {
            name: 'Breath Weapon',
            probability: 0.4,
            effect: (state) => {}
          },
          {
            name: 'Frightful Presence',
            probability: 0.6,
            effect: (state) => {
              if (!state.resources.conditions.includes('frightened')) {
                state.resources.conditions.push('frightened');
              }
            }
          }
        ],
        environmental: {
          lighting: 'dim',
          terrain: 'hazardous',
          cover: 'none'
        }
      }
    ],
    enemies: [
      ENEMY_TEMPLATES['adult-dragon']
    ],
    tacticalNotes: [
      'Legendary actions make action economy crucial',
      'Breath weapons require positioning',
      'Fear effects may limit tactical options',
      'Long encounters test resource management'
    ]
  },

  'ac-testing': {
    id: 'ac-testing',
    name: 'AC Benchmark Testing',
    description: 'Standard AC values for build optimization testing.',
    category: 'benchmark',
    recommendedLevels: [1, 20],
    scenarios: [
      {
        rounds: 3,
        encounters: 1,
        restType: 'none',
        enemyActions: [
          {
            name: 'Stand Still',
            probability: 1.0,
            effect: (state) => {} // Target dummy behavior
          }
        ],
        environmental: {
          lighting: 'bright',
          terrain: 'normal',
          cover: 'none'
        }
      }
    ],
    enemies: Object.values(AC_BENCHMARKS) as EnemyTemplate[],
    tacticalNotes: [
      'Pure DPR testing against static AC values',
      'No environmental factors',
      'Ideal for feat and build optimization'
    ]
  },

  'mixed-encounter': {
    id: 'mixed-encounter',
    name: 'Mixed Threat Levels',
    description: 'Encounters with multiple enemy types and threat levels.',
    category: 'mixed-encounter',
    recommendedLevels: [5, 15],
    scenarios: [
      {
        rounds: 6,
        encounters: 1,
        restType: 'short',
        enemyActions: [
          {
            name: 'Coordinated Attack',
            probability: 0.7,
            effect: (state) => {}
          },
          {
            name: 'Minion Swarm',
            probability: 0.4,
            effect: (state) => {}
          }
        ],
        environmental: {
          lighting: 'bright',
          terrain: 'normal',
          cover: 'partial'
        }
      }
    ],
    enemies: [
      ENEMY_TEMPLATES['goblin'],
      ENEMY_TEMPLATES['orc'],
      ENEMY_TEMPLATES['ogre']
    ],
    tacticalNotes: [
      'Target prioritization is crucial',
      'AoE effects are highly valuable',
      'Mixed AC values test versatility'
    ]
  }
};

// Helper functions for encounter management
export const getEncountersByLevel = (level: number): EncounterPack[] => {
  return Object.values(ENCOUNTER_PACKS).filter(pack => 
    level >= pack.recommendedLevels[0] && level <= pack.recommendedLevels[1]
  );
};

export const getEncountersByCategory = (category: string): EncounterPack[] => {
  return Object.values(ENCOUNTER_PACKS).filter(pack => pack.category === category);
};

export const createCustomTarget = (ac: number, hp: number = 100): Partial<EnemyTemplate> => {
  return {
    name: `Custom Target (AC ${ac})`,
    armorClass: ac,
    hitPoints: hp,
    averageHitPoints: hp,
    maxHP: hp,
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    traits: ['Custom target for testing']
  };
};

// Encounter scaling utilities
export const scaleEnemyForLevel = (enemy: EnemyTemplate, targetLevel: number): EnemyTemplate => {
  const levelScaling = Math.max(1, targetLevel / 10);
  
  return {
    ...enemy,
    hitPoints: Math.round(enemy.hitPoints * levelScaling),
    averageHitPoints: Math.round(enemy.averageHitPoints * levelScaling),
    maxHP: Math.round((enemy.maxHP || enemy.hitPoints) * levelScaling),
    armorClass: enemy.armorClass + Math.floor(levelScaling - 1),
    actions: enemy.actions.map(action => ({
      ...action,
      attackBonus: action.attackBonus ? action.attackBonus + Math.floor(levelScaling - 1) : action.attackBonus
    }))
  };
};

export const generateEncounterSummary = (pack: EncounterPack): string => {
  const enemyCount = pack.enemies.length;
  const avgAC = Math.round(pack.enemies.reduce((sum, enemy) => sum + enemy.armorClass, 0) / enemyCount);
  const avgHP = Math.round(pack.enemies.reduce((sum, enemy) => sum + enemy.hitPoints, 0) / enemyCount);
  const avgCR = pack.enemies.reduce((sum, enemy) => sum + enemy.challenge, 0) / enemyCount;
  
  return `${enemyCount} enemies, Avg AC: ${avgAC}, Avg HP: ${avgHP}, Avg CR: ${avgCR.toFixed(1)}`;
};
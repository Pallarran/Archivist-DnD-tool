/**
 * Class Feature Display Component with Choice Selection
 * Shows class/subclass features as they're gained and manages feature choices
 */

import React, { useState, useEffect } from 'react';
import type { ClassLevel } from '../../../types/build';

// Class feature definition
export interface ClassFeature {
  id: string;
  name: string;
  description: string;
  level: number;
  class: string;
  subclass?: string;
  type: 'automatic' | 'choice' | 'improvement';
  choices?: FeatureChoice[];
  improvements?: FeatureImprovement[];
  multipleSelections?: boolean;
  maxSelections?: number;
  prerequisite?: string;
}

// Feature choice options
export interface FeatureChoice {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  category?: string;
  prerequisites?: string[];
  mutuallyExclusive?: string[];
}

// Feature improvement (like ASI/Feat choice)
export interface FeatureImprovement {
  type: 'asi' | 'feat' | 'cantrip' | 'spell' | 'invocation';
  points?: number;
  options?: FeatureChoice[];
}

// Selected feature choices tracking
export interface SelectedFeatures {
  [featureId: string]: {
    featureId: string;
    selections: string[];
    improvements?: {
      type: string;
      selections: string[];
      customData?: any;
    }[];
  };
}

interface ClassFeatureDisplayProps {
  classLevels: ClassLevel[];
  selectedFeatures: SelectedFeatures;
  onChange: (selectedFeatures: SelectedFeatures) => void;
  abilityScores?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

// Comprehensive class feature database
const CLASS_FEATURES_DATABASE: ClassFeature[] = [
  // Fighter Features
  {
    id: 'fighter-fighting-style-1',
    name: 'Fighting Style',
    description: 'You adopt a particular style of fighting as your specialty.',
    level: 1,
    class: 'fighter',
    type: 'choice',
    choices: [
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
    ]
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
      {
        id: 'champion',
        name: 'Champion',
        description: 'Focus on raw physical power and combat prowess'
      },
      {
        id: 'battle-master',
        name: 'Battle Master',
        description: 'Tactical fighter with combat maneuvers'
      },
      {
        id: 'eldritch-knight',
        name: 'Eldritch Knight',
        description: 'Fighter with magical abilities'
      }
    ]
  },
  {
    id: 'fighter-asi-4',
    name: 'Ability Score Improvement',
    description: 'Increase ability scores or take a feat.',
    level: 4,
    class: 'fighter',
    type: 'improvement',
    improvements: [
      {
        type: 'asi',
        points: 2
      },
      {
        type: 'feat',
        options: [] // Would be populated with available feats
      }
    ]
  },
  {
    id: 'fighter-extra-attack',
    name: 'Extra Attack',
    description: 'Attack twice when taking the Attack action.',
    level: 5,
    class: 'fighter',
    type: 'automatic'
  },

  // Champion Subclass Features
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

  // Battle Master Subclass Features
  {
    id: 'battle-master-combat-superiority',
    name: 'Combat Superiority',
    description: 'Gain superiority dice and combat maneuvers.',
    level: 3,
    class: 'fighter',
    subclass: 'battle-master',
    type: 'choice',
    choices: [
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
    ],
    multipleSelections: true,
    maxSelections: 3
  },

  // Rogue Features
  {
    id: 'rogue-expertise',
    name: 'Expertise',
    description: 'Double proficiency bonus for two chosen skill proficiencies.',
    level: 1,
    class: 'rogue',
    type: 'choice',
    multipleSelections: true,
    maxSelections: 2,
    choices: [
      { id: 'acrobatics', name: 'Acrobatics', description: 'Dexterity-based skill' },
      { id: 'deception', name: 'Deception', description: 'Charisma-based skill' },
      { id: 'insight', name: 'Insight', description: 'Wisdom-based skill' },
      { id: 'intimidation', name: 'Intimidation', description: 'Charisma-based skill' },
      { id: 'investigation', name: 'Investigation', description: 'Intelligence-based skill' },
      { id: 'perception', name: 'Perception', description: 'Wisdom-based skill' },
      { id: 'persuasion', name: 'Persuasion', description: 'Charisma-based skill' },
      { id: 'sleight-of-hand', name: 'Sleight of Hand', description: 'Dexterity-based skill' },
      { id: 'stealth', name: 'Stealth', description: 'Dexterity-based skill' }
    ]
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

  // Wizard Features
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
      {
        id: 'abjuration',
        name: 'School of Abjuration',
        description: 'Specializes in protective and banishing magic'
      },
      {
        id: 'conjuration',
        name: 'School of Conjuration',
        description: 'Specializes in summoning and teleportation'
      },
      {
        id: 'divination',
        name: 'School of Divination',
        description: 'Specializes in information gathering and foresight'
      },
      {
        id: 'enchantment',
        name: 'School of Enchantment',
        description: 'Specializes in mind control and charm effects'
      },
      {
        id: 'evocation',
        name: 'School of Evocation',
        description: 'Specializes in damage-dealing magic'
      },
      {
        id: 'illusion',
        name: 'School of Illusion',
        description: 'Specializes in deception and misdirection'
      },
      {
        id: 'necromancy',
        name: 'School of Necromancy',
        description: 'Specializes in death, undeath, and life force'
      },
      {
        id: 'transmutation',
        name: 'School of Transmutation',
        description: 'Specializes in changing matter and energy'
      }
    ]
  },

  // Add more classes as needed...
];

export const ClassFeatureDisplay: React.FC<ClassFeatureDisplayProps> = ({
  classLevels,
  selectedFeatures,
  onChange,
  abilityScores
}) => {
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

  // Get features for current class levels
  const getAvailableFeatures = (): ClassFeature[] => {
    const features: ClassFeature[] = [];

    classLevels.forEach(({ class: className, level, subclass }) => {
      for (let lvl = 1; lvl <= level; lvl++) {
        // Get class features
        const classFeatures = CLASS_FEATURES_DATABASE.filter(
          feature => 
            feature.class === className.toLowerCase() && 
            feature.level === lvl &&
            !feature.subclass
        );
        features.push(...classFeatures);

        // Get subclass features if subclass is selected
        if (subclass) {
          const subclassFeatures = CLASS_FEATURES_DATABASE.filter(
            feature => 
              feature.class === className.toLowerCase() && 
              feature.level === lvl &&
              feature.subclass === subclass.toLowerCase()
          );
          features.push(...subclassFeatures);
        }
      }
    });

    // Remove duplicates and sort by level
    const uniqueFeatures = features.filter((feature, index, self) => 
      index === self.findIndex(f => f.id === feature.id)
    );

    return uniqueFeatures.sort((a, b) => a.level - b.level || a.class.localeCompare(b.class));
  };

  // Handle feature choice selection
  const handleFeatureChoice = (featureId: string, choiceId: string, selected: boolean) => {
    const feature = CLASS_FEATURES_DATABASE.find(f => f.id === featureId);
    if (!feature) return;

    const currentSelection = selectedFeatures[featureId] || { featureId, selections: [] };
    let newSelections = [...currentSelection.selections];

    if (feature.multipleSelections) {
      if (selected) {
        if (!newSelections.includes(choiceId)) {
          if (!feature.maxSelections || newSelections.length < feature.maxSelections) {
            newSelections.push(choiceId);
          }
        }
      } else {
        newSelections = newSelections.filter(id => id !== choiceId);
      }
    } else {
      newSelections = selected ? [choiceId] : [];
    }

    onChange({
      ...selectedFeatures,
      [featureId]: {
        ...currentSelection,
        selections: newSelections
      }
    });
  };

  // Handle ability score improvements
  const handleASIChange = (featureId: string, ability: string, change: number) => {
    const currentSelection = selectedFeatures[featureId] || { featureId, selections: [], improvements: [] };
    const improvements = currentSelection.improvements || [];
    
    let asiImprovement = improvements.find(imp => imp.type === 'asi');
    if (!asiImprovement) {
      asiImprovement = { type: 'asi', selections: [], customData: {} };
      improvements.push(asiImprovement);
    }

    const currentData = asiImprovement.customData || {};
    const newValue = (currentData[ability] || 0) + change;
    
    // Calculate total points used
    const totalUsed = Object.values({ ...currentData, [ability]: newValue }).reduce((sum: number, val: any) => sum + val, 0);
    
    if (newValue >= 0 && totalUsed <= 2) {
      onChange({
        ...selectedFeatures,
        [featureId]: {
          ...currentSelection,
          improvements: improvements.map(imp => 
            imp.type === 'asi' 
              ? { ...imp, customData: { ...currentData, [ability]: newValue } }
              : imp
          )
        }
      });
    }
  };

  // Toggle feature expansion
  const toggleFeatureExpansion = (featureId: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
    }
    setExpandedFeatures(newExpanded);
  };

  const availableFeatures = getAvailableFeatures();

  if (availableFeatures.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        Select class levels to see available features
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Class Features ({availableFeatures.length})
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedFeatures && Object.keys(selectedFeatures).length} features configured
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-3">
        {availableFeatures.map((feature) => {
          const isExpanded = expandedFeatures.has(feature.id);
          const selection = selectedFeatures[feature.id];
          const hasChoices = feature.type !== 'automatic';
          const isComplete = !hasChoices || (selection && selection.selections.length > 0) || 
                            (feature.type === 'improvement' && selection?.improvements?.length);

          return (
            <div 
              key={feature.id} 
              className={`border rounded-lg p-4 transition-colors ${
                isComplete 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : hasChoices
                  ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/20'
              }`}
            >
              {/* Feature Header */}
              <div 
                className={`flex items-center justify-between ${hasChoices ? 'cursor-pointer' : ''}`}
                onClick={hasChoices ? () => toggleFeatureExpansion(feature.id) : undefined}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    isComplete ? 'bg-green-500' : hasChoices ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {feature.name}
                    </h4>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Level {feature.level} • {feature.class.charAt(0).toUpperCase() + feature.class.slice(1)}
                      {feature.subclass && ` (${feature.subclass.charAt(0).toUpperCase() + feature.subclass.slice(1)})`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {hasChoices && !isComplete && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded">
                      Choice Required
                    </span>
                  )}
                  {isComplete && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded">
                      ✓ Complete
                    </span>
                  )}
                  {hasChoices && (
                    <span className="text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  )}
                </div>
              </div>

              {/* Feature Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {feature.description}
              </p>

              {/* Show selected choices summary when collapsed */}
              {!isExpanded && selection && selection.selections.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Selected: {selection.selections.map(selId => {
                    const choice = feature.choices?.find(c => c.id === selId);
                    return choice?.name || selId;
                  }).join(', ')}
                </div>
              )}

              {/* Expanded Feature Choices */}
              {isExpanded && feature.type === 'choice' && feature.choices && (
                <div className="mt-4 space-y-3">
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                    Choose {feature.multipleSelections 
                      ? `${feature.maxSelections || 'multiple'} option${(feature.maxSelections || 2) !== 1 ? 's' : ''}` 
                      : 'one option'
                    }:
                  </h5>
                  <div className="space-y-2">
                    {feature.choices.map((choice) => {
                      const isSelected = selection?.selections.includes(choice.id) || false;
                      const canSelect = !selection || 
                                      !feature.maxSelections || 
                                      selection.selections.length < feature.maxSelections ||
                                      isSelected;

                      return (
                        <label 
                          key={choice.id}
                          className={`flex items-start space-x-3 p-3 border rounded-md cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                              : canSelect
                              ? 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                              : 'border-gray-200 opacity-50 cursor-not-allowed dark:border-gray-600'
                          }`}
                        >
                          <input
                            type={feature.multipleSelections ? 'checkbox' : 'radio'}
                            name={feature.id}
                            value={choice.id}
                            checked={isSelected}
                            onChange={(e) => handleFeatureChoice(feature.id, choice.id, e.target.checked)}
                            disabled={!canSelect}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">
                              {choice.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                              {choice.shortDescription || choice.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ability Score Improvement */}
              {isExpanded && feature.type === 'improvement' && feature.improvements && (
                <div className="mt-4 space-y-4">
                  {feature.improvements.map((improvement, index) => {
                    if (improvement.type === 'asi') {
                      const asiData = selection?.improvements?.find(imp => imp.type === 'asi')?.customData || {};
                      const totalUsed = Object.values(asiData).reduce((sum: number, val: any) => sum + val, 0);

                      return (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-md p-3">
                          <h6 className="font-medium text-sm text-gray-900 dark:text-white mb-3">
                            Ability Score Improvement ({totalUsed}/{improvement.points || 2} points used)
                          </h6>
                          <div className="grid grid-cols-2 gap-3">
                            {abilityScores && Object.entries(abilityScores).map(([ability, score]) => {
                              const currentBonus = asiData[ability] || 0;
                              const newScore = score + currentBonus;
                              const canIncrease = totalUsed < (improvement.points || 2) && newScore < 20;
                              const canDecrease = currentBonus > 0;

                              return (
                                <div key={ability} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                                      {ability.slice(0, 3).toUpperCase()}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {score} → {newScore}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => handleASIChange(feature.id, ability, -1)}
                                      disabled={!canDecrease}
                                      className="w-6 h-6 text-xs bg-red-100 text-red-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-200"
                                    >
                                      -
                                    </button>
                                    <span className="w-6 text-center text-sm font-medium">
                                      {currentBonus > 0 ? `+${currentBonus}` : '0'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleASIChange(feature.id, ability, 1)}
                                      disabled={!canIncrease}
                                      className="w-6 h-6 text-xs bg-green-100 text-green-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {availableFeatures.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Feature Summary</h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <div>Total Features: {availableFeatures.length}</div>
            <div>Automatic: {availableFeatures.filter(f => f.type === 'automatic').length}</div>
            <div>Choice Features: {availableFeatures.filter(f => f.type === 'choice').length}</div>
            <div>Improvements: {availableFeatures.filter(f => f.type === 'improvement').length}</div>
          </div>
        </div>
      )}
    </div>
  );
};
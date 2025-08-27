/**
 * Inline Class Features Component
 * Shows class features directly within the class selection boxes
 */

import React, { useState } from 'react';
import type { ClassLevel } from '../../types/build';
import { getClassFeatures } from '../../data/classFeatures';
import type { FeatureSelection } from './ClassFeatureDisplay';

// Common D&D 5e feats for selection
interface FeatDefinition {
  id: string;
  name: string;
  description: string;
  abilityOptions?: string[]; // For half-feats that allow choice of ability score
  fixedAbility?: string; // For half-feats with fixed ability score
  isHalfFeat: boolean;
}

const COMMON_FEATS: FeatDefinition[] = [
  { id: 'alert', name: 'Alert', description: '+5 initiative, no surprised, no sneak attacks', isHalfFeat: false },
  { id: 'athlete', name: 'Athlete', description: 'Climb bonuses, standing jump bonuses', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true },
  { id: 'charger', name: 'Charger', description: 'Bonus after dash or charge attacks', isHalfFeat: false },
  { id: 'crossbow-expert', name: 'Crossbow Expert', description: 'Ignore loading, no disadvantage in melee, bonus hand crossbow attack', isHalfFeat: false },
  { id: 'dual-wielder', name: 'Dual Wielder', description: '+1 AC while dual wielding, use non-light weapons', isHalfFeat: false },
  { id: 'durable', name: 'Durable', description: 'Minimum healing on hit dice', fixedAbility: 'constitution', isHalfFeat: true },
  { id: 'elven-accuracy', name: 'Elven Accuracy', description: 'Reroll one die with advantage', abilityOptions: ['dexterity', 'intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'fey-touched', name: 'Fey Touched', description: 'Learn misty step + 1st level spell', abilityOptions: ['intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'great-weapon-master', name: 'Great Weapon Master', description: 'Bonus attack on crit/kill, -5/+10 power attack', isHalfFeat: false },
  { id: 'heavy-armor-master', name: 'Heavy Armor Master', description: 'Reduce physical damage by 3', fixedAbility: 'strength', isHalfFeat: true },
  { id: 'inspiring-leader', name: 'Inspiring Leader', description: 'Give temporary HP to allies (Cha mod + level)', fixedAbility: 'charisma', isHalfFeat: true },
  { id: 'keen-mind', name: 'Keen Mind', description: 'Perfect memory, always know time/direction', fixedAbility: 'intelligence', isHalfFeat: true },
  { id: 'lucky', name: 'Lucky', description: 'Reroll 3 dice per long rest', isHalfFeat: false },
  { id: 'magic-initiate', name: 'Magic Initiate', description: 'Learn 2 cantrips and 1 1st-level spell', isHalfFeat: false },
  { id: 'martial-adept', name: 'Martial Adept', description: 'Learn 2 maneuvers and gain superiority die', isHalfFeat: false },
  { id: 'metamagic-adept', name: 'Metamagic Adept', description: 'Learn 2 metamagic options, gain sorcery points', isHalfFeat: false },
  { id: 'mobile', name: 'Mobile', description: '+10 speed, avoid opportunity attacks after attacking', isHalfFeat: false },
  { id: 'moderately-armored', name: 'Moderately Armored', description: 'Gain medium armor and shield proficiency', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true },
  { id: 'observant', name: 'Observant', description: '+5 to passive Perception and Investigation', abilityOptions: ['intelligence', 'wisdom'], isHalfFeat: true },
  { id: 'piercer', name: 'Piercer', description: 'Reroll piercing damage die, crit adds damage die', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true },
  { id: 'polearm-master', name: 'Polearm Master', description: 'Bonus attack with polearm butt, opportunity attacks on approach', isHalfFeat: false },
  { id: 'resilient', name: 'Resilient', description: 'Gain proficiency in chosen save', abilityOptions: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'ritual-caster', name: 'Ritual Caster', description: 'Learn ritual spells from chosen class', isHalfFeat: false },
  { id: 'savage-attacker', name: 'Savage Attacker', description: 'Reroll damage dice once per turn', isHalfFeat: false },
  { id: 'sentinel', name: 'Sentinel', description: 'Stop movement on opportunity attacks, attack when allies hit', isHalfFeat: false },
  { id: 'shadow-touched', name: 'Shadow Touched', description: 'Learn invisibility + 1st level spell', abilityOptions: ['intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'sharpshooter', name: 'Sharpshooter', description: 'Ignore cover/range, -5/+10 power shot', isHalfFeat: false },
  { id: 'shield-master', name: 'Shield Master', description: 'Shield bash, evasion with shield, bonus to Dex saves', isHalfFeat: false },
  { id: 'skill-expert', name: 'Skill Expert', description: 'Gain proficiency + expertise in one skill', abilityOptions: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'skilled', name: 'Skilled', description: 'Gain 3 skill proficiencies', isHalfFeat: false },
  { id: 'slasher', name: 'Slasher', description: 'Reduce speed on slashing hit, crit imposes disadvantage', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true },
  { id: 'spell-sniper', name: 'Spell Sniper', description: 'Double spell range, ignore cover, learn cantrip', isHalfFeat: false },
  { id: 'telekinetic', name: 'Telekinetic', description: 'Bonus action shove, misty step reactions', abilityOptions: ['intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'telepathic', name: 'Telepathic', description: 'Detect thoughts, telepathic communication', abilityOptions: ['intelligence', 'wisdom', 'charisma'], isHalfFeat: true },
  { id: 'tough', name: 'Tough', description: '+2 hit points per level', isHalfFeat: false },
  { id: 'war-caster', name: 'War Caster', description: 'Advantage on concentration, cast with hands full, opportunity spell attacks', isHalfFeat: false },
  { id: 'weapon-master', name: 'Weapon Master', description: 'Gain 4 weapon proficiencies', abilityOptions: ['strength', 'dexterity'], isHalfFeat: true }
];

interface InlineClassFeaturesProps {
  classLevel: ClassLevel;
  selections: { [featureId: string]: FeatureSelection };
  onSelectionChange: (featureId: string, selection: FeatureSelection) => void;
}

export const InlineClassFeatures: React.FC<InlineClassFeaturesProps> = ({
  classLevel,
  selections,
  onSelectionChange,
}) => {
  const features = getClassFeatures(classLevel.class, classLevel.level, classLevel.subclass);

  if (features.length === 0) {
    return null;
  }

  const featuresRequiringChoices = features.filter(f => f.type === 'choice' || f.type === 'improvement');
  const automaticFeatures = features.filter(f => f.type === 'automatic');

  const handleFeatureSelection = (featureId: string, choiceId: string) => {
    const existingSelection = selections[featureId] || { featureId, selections: [], improvements: {} };
    const newSelection = {
      ...existingSelection,
      selections: [choiceId] // Simple single selection for inline display
    };
    onSelectionChange(featureId, newSelection);
  };

  const handleImprovementSelection = (featureId: string, type: 'asi' | 'feat', data: any) => {
    const existingSelection = selections[featureId] || { featureId, selections: [], improvements: {} };
    const newSelection = {
      ...existingSelection,
      improvements: {
        ...existingSelection.improvements,
        [type]: data
      }
    };
    onSelectionChange(featureId, newSelection);
  };

  const AbilityScoreSelector = ({ featureId, currentASI }: { featureId: string; currentASI?: any }) => {
    const [abilityScores, setAbilityScores] = useState(currentASI || {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0
    });

    const totalPoints = Object.values(abilityScores).reduce((sum: number, val: number) => sum + val, 0);
    const maxPoints = 2;

    const updateAbilityScore = (ability: string, change: number) => {
      const newScores = { ...abilityScores };
      const currentValue = newScores[ability as keyof typeof abilityScores] || 0;
      const newValue = Math.max(0, Math.min(2, currentValue + change));
      
      // Check if we would exceed the point limit
      if (change > 0 && totalPoints >= maxPoints) return;
      
      newScores[ability as keyof typeof abilityScores] = newValue;
      setAbilityScores(newScores);
      handleImprovementSelection(featureId, 'asi', newScores);
    };

    const abilities = [
      { key: 'strength', label: 'STR' },
      { key: 'dexterity', label: 'DEX' },
      { key: 'constitution', label: 'CON' },
      { key: 'intelligence', label: 'INT' },
      { key: 'wisdom', label: 'WIS' },
      { key: 'charisma', label: 'CHA' }
    ];

    return (
      <div className="space-y-1">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Points used: {totalPoints}/{maxPoints}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {abilities.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-1 py-0.5">
              <span className="text-xs font-medium">{label}</span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => updateAbilityScore(key, -1)}
                  className="w-4 h-4 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={abilityScores[key as keyof typeof abilityScores] === 0}
                >
                  -
                </button>
                <span className="w-4 text-center text-xs">
                  {abilityScores[key as keyof typeof abilityScores] || 0}
                </span>
                <button
                  type="button"
                  onClick={() => updateAbilityScore(key, 1)}
                  className="w-4 h-4 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  disabled={totalPoints >= maxPoints || abilityScores[key as keyof typeof abilityScores] >= 2}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Automatic Features */}
      {automaticFeatures.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Features Gained:
          </h5>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {automaticFeatures.map((feature) => (
              <div key={feature.id} className="flex items-start">
                <span className="font-medium mr-1">Level {feature.level}:</span>
                <span>{feature.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Requiring Choices */}
      {featuresRequiringChoices.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Choices Required:
          </h5>
          <div className="space-y-2">
            {featuresRequiringChoices.map((feature) => {
              const currentSelection = selections[feature.id];
              const hasSelection = currentSelection && currentSelection.selections.length > 0;

              return (
                <div key={feature.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Level {feature.level}: {feature.name}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      hasSelection 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {hasSelection ? '✓' : '!'}
                    </span>
                  </div>
                  
                  {feature.type === 'choice' && feature.choices && (
                    <select
                      value={currentSelection?.selections[0] || ''}
                      onChange={(e) => handleFeatureSelection(feature.id, e.target.value)}
                      className="w-full text-xs rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Choose {feature.name}...</option>
                      {feature.choices.map((choice) => (
                        <option key={choice.id} value={choice.id}>
                          {choice.name}
                          {choice.shortDescription && ` - ${choice.shortDescription}`}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {feature.type === 'improvement' && (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`${feature.id}-type`}
                            value="asi"
                            checked={currentSelection?.improvements?.type === 'asi' || !currentSelection?.improvements}
                            onChange={() => {
                              const newSelection = selections[feature.id] || { featureId: feature.id, selections: [], improvements: {} };
                              newSelection.improvements = { type: 'asi' };
                              onSelectionChange(feature.id, newSelection);
                            }}
                            className="mr-1"
                          />
                          <span className="text-xs">ASI</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`${feature.id}-type`}
                            value="feat"
                            checked={currentSelection?.improvements?.type === 'feat'}
                            onChange={() => {
                              const newSelection = selections[feature.id] || { featureId: feature.id, selections: [], improvements: {} };
                              newSelection.improvements = { type: 'feat' };
                              onSelectionChange(feature.id, newSelection);
                            }}
                            className="mr-1"
                          />
                          <span className="text-xs">Feat</span>
                        </label>
                      </div>
                      
                      {(currentSelection?.improvements?.type === 'asi' || !currentSelection?.improvements) && (
                        <AbilityScoreSelector 
                          featureId={feature.id} 
                          currentASI={currentSelection?.improvements?.asi}
                        />
                      )}
                      
                      {currentSelection?.improvements?.type === 'feat' && (
                        <div className="space-y-2">
                          <select
                            value={currentSelection?.improvements?.feat || ''}
                            onChange={(e) => handleImprovementSelection(feature.id, 'feat', e.target.value)}
                            className="w-full text-xs rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Choose a feat...</option>
                            {COMMON_FEATS.map((feat) => (
                              <option key={feat.id} value={feat.id}>
                                {feat.name}{feat.isHalfFeat ? ' (+1 ability)' : ''} - {feat.description}
                              </option>
                            ))}
                          </select>
                          
                          {/* Half-feat ability score choice */}
                          {(() => {
                            const selectedFeat = COMMON_FEATS.find(f => f.id === currentSelection?.improvements?.feat);
                            if (selectedFeat?.isHalfFeat && selectedFeat.abilityOptions) {
                              return (
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Choose ability to increase:
                                  </label>
                                  <select
                                    value={currentSelection?.improvements?.featAbility || ''}
                                    onChange={(e) => {
                                      const newSelection = selections[feature.id] || { featureId: feature.id, selections: [], improvements: {} };
                                      if (!newSelection.improvements) newSelection.improvements = {};
                                      newSelection.improvements.featAbility = e.target.value;
                                      onSelectionChange(feature.id, newSelection);
                                    }}
                                    className="w-full text-xs rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  >
                                    <option value="">Choose ability...</option>
                                    {selectedFeat.abilityOptions.map(ability => (
                                      <option key={ability} value={ability}>
                                        {ability.charAt(0).toUpperCase() + ability.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            } else if (selectedFeat?.isHalfFeat && selectedFeat.fixedAbility) {
                              return (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  +1 {selectedFeat.fixedAbility.charAt(0).toUpperCase() + selectedFeat.fixedAbility.slice(1)}
                                </div>
                              );
                            }
                            return null;
                          })()} 
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
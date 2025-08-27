/**
 * Class and level selection form component
 */

import React, { useState } from 'react';
import { InlineClassFeatures } from './InlineClassFeatures';
import type { FeatureSelection } from './ClassFeatureDisplay';

interface ClassLevel {
  class: string;
  level: number;
  hitDie?: number;
  subclass?: string;
}

interface ClassLevelFormProps {
  levels: ClassLevel[];
  onChange: (levels: ClassLevel[]) => void;
  error?: string;
  // Optional feature selection props
  featureSelections?: { [featureId: string]: FeatureSelection };
  onFeatureSelectionChange?: (featureId: string, selection: FeatureSelection) => void;
}

const D5E_CLASSES = [
  { value: 'artificer', label: 'Artificer', hitDie: 8, primaryAbility: ['Intelligence'] },
  { value: 'barbarian', label: 'Barbarian', hitDie: 12, primaryAbility: ['Strength'] },
  { value: 'bard', label: 'Bard', hitDie: 8, primaryAbility: ['Charisma'] },
  { value: 'cleric', label: 'Cleric', hitDie: 8, primaryAbility: ['Wisdom'] },
  { value: 'druid', label: 'Druid', hitDie: 8, primaryAbility: ['Wisdom'] },
  { value: 'fighter', label: 'Fighter', hitDie: 10, primaryAbility: ['Strength', 'Dexterity'] },
  { value: 'monk', label: 'Monk', hitDie: 8, primaryAbility: ['Dexterity', 'Wisdom'] },
  { value: 'paladin', label: 'Paladin', hitDie: 10, primaryAbility: ['Strength', 'Charisma'] },
  { value: 'ranger', label: 'Ranger', hitDie: 10, primaryAbility: ['Dexterity', 'Wisdom'] },
  { value: 'rogue', label: 'Rogue', hitDie: 8, primaryAbility: ['Dexterity'] },
  { value: 'sorcerer', label: 'Sorcerer', hitDie: 6, primaryAbility: ['Charisma'] },
  { value: 'warlock', label: 'Warlock', hitDie: 8, primaryAbility: ['Charisma'] },
  { value: 'wizard', label: 'Wizard', hitDie: 6, primaryAbility: ['Intelligence'] },
] as const;

export const ClassLevelForm: React.FC<ClassLevelFormProps> = ({
  levels,
  onChange,
  error,
  featureSelections = {},
  onFeatureSelectionChange,
}) => {
  // const [showAddClass, setShowAddClass] = useState(false);

  const totalLevel = levels.reduce((sum, level) => sum + level.level, 0);
  const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;

  const addClassLevel = () => {
    const newLevel: ClassLevel = {
      class: 'fighter',
      level: 1,
      hitDie: 10,
      subclass: '',
    };
    onChange([...levels, newLevel]);
  };

  const updateClassLevel = (index: number, updates: Partial<ClassLevel>) => {
    const newLevels = levels.map((level, i) => 
      i === index ? { ...level, ...updates } : level
    );
    onChange(newLevels);
  };

  const removeClassLevel = (index: number) => {
    const newLevels = levels.filter((_, i) => i !== index);
    onChange(newLevels);
  };

  const getAvailableClasses = () => {
    const usedClasses = levels.map(level => level.class);
    return D5E_CLASSES.filter(cls => !usedClasses.includes(cls.value));
  };

  // Auto-detect subclass from feature selections
  const getSubclassFromFeatures = (className: string): string => {
    if (!featureSelections) return '';
    
    const subclassMapping: { [key: string]: { [selectionId: string]: string } } = {
      fighter: {
        'champion': 'champion',
        'battle-master': 'battle-master', 
        'eldritch-knight': 'eldritch-knight',
        'arcane-archer': 'arcane-archer',
        'cavalier': 'cavalier',
        'samurai': 'samurai'
      },
      rogue: {
        'thief': 'thief',
        'assassin': 'assassin',
        'arcane-trickster': 'arcane-trickster',
        'inquisitive': 'inquisitive',
        'mastermind': 'mastermind',
        'scout': 'scout',
        'swashbuckler': 'swashbuckler'
      },
      wizard: {
        'abjuration': 'abjuration',
        'conjuration': 'conjuration',
        'divination': 'divination',
        'enchantment': 'enchantment',
        'evocation': 'evocation',
        'illusion': 'illusion',
        'necromancy': 'necromancy',
        'transmutation': 'transmutation'
      },
      barbarian: {
        'berserker': 'berserker',
        'totem-warrior': 'totem-warrior'
      },
      ranger: {
        'hunter': 'hunter',
        'beast-master': 'beast-master'
      },
      paladin: {
        'devotion': 'devotion',
        'ancients': 'ancients',
        'vengeance': 'vengeance'
      }
    };

    const classMapping = subclassMapping[className.toLowerCase()];
    if (!classMapping) return '';

    // Check all feature selections for subclass choices
    for (const selection of Object.values(featureSelections)) {
      if (selection.selections) {
        for (const selectionId of selection.selections) {
          if (classMapping[selectionId]) {
            return classMapping[selectionId];
          }
        }
      }
    }
    
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Classes & Levels</h3>
        <div className="text-sm text-gray-600">
          Total Level: <span className="font-medium">{totalLevel}</span> | 
          Proficiency: <span className="font-medium">+{proficiencyBonus}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Current Classes */}
      <div className="space-y-4">
        {levels.map((classLevel, index) => {
          const classInfo = D5E_CLASSES.find(c => c.value === classLevel.class);
          const autoDetectedSubclass = getSubclassFromFeatures(classLevel.class);
          
          // Auto-update the subclass if it's different from what's detected
          if (autoDetectedSubclass && autoDetectedSubclass !== classLevel.subclass) {
            updateClassLevel(index, { subclass: autoDetectedSubclass });
          }
          
          return (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Class #{index + 1}</h4>
                {levels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeClassLevel(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={classLevel.class}
                    onChange={(e) => {
                      const selectedClass = D5E_CLASSES.find(c => c.value === e.target.value);
                      updateClassLevel(index, {
                        class: e.target.value as any,
                        hitDie: selectedClass?.hitDie || 8,
                        subclass: '', // Reset subclass when class changes
                      });
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {/* Include current class even if it would be filtered out */}
                    {!D5E_CLASSES.find(c => c.value === classLevel.class && getAvailableClasses().includes(c)) && (
                      <option value={classLevel.class}>
                        {D5E_CLASSES.find(c => c.value === classLevel.class)?.label || classLevel.class}
                      </option>
                    )}
                    {getAvailableClasses().map(cls => (
                      <option key={cls.value} value={cls.value}>
                        {cls.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={classLevel.level}
                    onChange={(e) => updateClassLevel(index, { level: parseInt(e.target.value) || 1 })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {classInfo && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Hit Die:</span> d{classInfo.hitDie} | 
                  <span className="font-medium ml-2">Primary:</span> {classInfo.primaryAbility.join(' or ')}
                  {autoDetectedSubclass && (
                    <>
                      {' | '}
                      <span className="font-medium">Subclass:</span> {autoDetectedSubclass.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </>
                  )}
                </div>
              )}

              {/* Inline Class Features */}
              {onFeatureSelectionChange && (
                <InlineClassFeatures
                  classLevel={classLevel}
                  selections={featureSelections}
                  onSelectionChange={onFeatureSelectionChange}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Add Class Button */}
      {levels.length < 3 && getAvailableClasses().length > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={addClassLevel}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
          >
            + Add Multiclass
          </button>
        </div>
      )}

      {/* Level Distribution Helper */}
      {totalLevel > 0 && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Level Breakdown</h4>
          <div className="space-y-1 text-sm text-gray-600">
            {levels.map((classLevel, index) => (
              <div key={index} className="flex justify-between">
                <span>{D5E_CLASSES.find(c => c.value === classLevel.class)?.label || classLevel.class}</span>
                <span>{classLevel.level} levels</span>
              </div>
            ))}
            <div className="border-t pt-1 font-medium">
              <div className="flex justify-between">
                <span>Total</span>
                <span>{totalLevel} levels</span>
              </div>
            </div>
          </div>

          {totalLevel > 20 && (
            <div className="mt-2 text-sm text-red-600">
              ⚠️ Total level exceeds 20 (Epic levels not fully supported)
            </div>
          )}
        </div>
      )}

      {/* Multiclass Requirements Info */}
      {levels.length > 1 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">Multiclass Requirements</h4>
          <p className="text-sm text-yellow-700">
            Remember to check that your ability scores meet multiclassing requirements. 
            Most classes require 13+ in their primary ability score.
          </p>
        </div>
      )}
    </div>
  );
};
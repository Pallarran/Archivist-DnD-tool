/**
 * Ability score input form component
 */

import React, { useState } from 'react';
import type { Build } from '../../types';

interface AbilityScoreFormProps {
  abilities: Build['abilities'];
  onChange: (abilities: Build['abilities']) => void;
}

export const AbilityScoreForm: React.FC<AbilityScoreFormProps> = ({
  abilities,
  onChange,
}) => {
  const [pointBuyMode, setPointBuyMode] = useState(false);
  const [pointsRemaining, setPointsRemaining] = useState(27);

  const abilityInfo = [
    { key: 'strength', label: 'Strength', description: 'Physical power, melee attacks and damage' },
    { key: 'dexterity', label: 'Dexterity', description: 'Agility, AC, ranged attacks, initiative' },
    { key: 'constitution', label: 'Constitution', description: 'Health, concentration saves' },
    { key: 'intelligence', label: 'Intelligence', description: 'Reasoning, investigation, wizard spells' },
    { key: 'wisdom', label: 'Wisdom', description: 'Awareness, insight, cleric/druid spells' },
    { key: 'charisma', label: 'Charisma', description: 'Force of personality, sorcerer/warlock spells' },
  ] as const;

  // Point buy cost table
  const pointCosts: Record<number, number> = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
  };

  const handleAbilityChange = (ability: keyof Build['abilities'], value: number) => {
    const newAbilities = { ...abilities, [ability]: value };
    onChange(newAbilities);

    if (pointBuyMode) {
      // Calculate remaining points
      const totalCost = Object.values(newAbilities).reduce((sum, score) => {
        return sum + (pointCosts[score] || 0);
      }, 0);
      setPointsRemaining(27 - totalCost);
    }
  };

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const formatModifier = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const togglePointBuyMode = () => {
    if (!pointBuyMode) {
      // Switching to point buy - reset to standard array
      const standardArray = {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      };
      onChange(standardArray);
      setPointsRemaining(0);
    }
    setPointBuyMode(!pointBuyMode);
  };

  const applyStandardArray = () => {
    const standardArray = {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    };
    onChange(standardArray);
  };

  const applyEliteArray = () => {
    const eliteArray = {
      strength: 15,
      dexterity: 15,
      constitution: 15,
      intelligence: 15,
      wisdom: 15,
      charisma: 15,
    };
    onChange(eliteArray);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Ability Scores</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              id="point-buy-mode"
              type="checkbox"
              checked={pointBuyMode}
              onChange={togglePointBuyMode}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="point-buy-mode" className="ml-2 text-sm text-gray-700">
              Point Buy Mode
            </label>
          </div>
          
          {pointBuyMode && (
            <div className="text-sm text-gray-600">
              Points Remaining: <span className={`font-medium ${pointsRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {pointsRemaining}
              </span>
            </div>
          )}
        </div>
      </div>

      {!pointBuyMode && (
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={applyStandardArray}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Standard Array
          </button>
          <button
            type="button"
            onClick={applyEliteArray}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            Elite Array (15s)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {abilityInfo.map(({ key, label, description }) => {
          const score = abilities[key];
          const modifier = getAbilityModifier(score);
          const isInvalid = pointBuyMode && (score < 8 || score > 15);

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <div className="text-sm text-gray-500">
                  Modifier: <span className={`font-medium ${modifier >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatModifier(modifier)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {pointBuyMode ? (
                  <select
                    value={score}
                    onChange={(e) => handleAbilityChange(key, parseInt(e.target.value))}
                    className={`block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      isInvalid ? 'border-red-300' : ''
                    }`}
                  >
                    {[8, 9, 10, 11, 12, 13, 14, 15].map(value => {
                      const cost = pointCosts[value] || 0;
                      const canAfford = (pointsRemaining + (pointCosts[score] || 0)) >= cost;
                      return (
                        <option key={value} value={value} disabled={!canAfford}>
                          {value} ({cost} pts)
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={score}
                    onChange={(e) => handleAbilityChange(key, parseInt(e.target.value) || 10)}
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                )}
                
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
              </div>

              {/* Ability score breakdown */}
              <div className="text-xs text-gray-400 space-y-1">
                <div>Base: {score}</div>
                {/* TODO: Add racial bonuses, magic items, etc. */}
              </div>
            </div>
          );
        })}
      </div>

      {pointBuyMode && pointsRemaining < 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            You have exceeded the point buy limit. Please reduce some ability scores.
          </p>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Ability Score Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="font-medium">Melee Attack:</span>
            <div className="text-gray-600">
              STR: {formatModifier(getAbilityModifier(abilities.strength))} or DEX: {formatModifier(getAbilityModifier(abilities.dexterity))}
            </div>
          </div>
          <div>
            <span className="font-medium">Ranged Attack:</span>
            <div className="text-gray-600">DEX: {formatModifier(getAbilityModifier(abilities.dexterity))}</div>
          </div>
          <div>
            <span className="font-medium">AC Bonus:</span>
            <div className="text-gray-600">DEX: {formatModifier(getAbilityModifier(abilities.dexterity))}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
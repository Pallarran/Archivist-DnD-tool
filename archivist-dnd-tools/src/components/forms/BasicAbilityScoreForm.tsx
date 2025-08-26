/**
 * Basic Ability Score Form with point buy, standard array, and manual entry
 * This is a simplified version that integrates with our simple store
 */

import React, { useState, useEffect } from 'react';

// Ability score interfaces
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface BasicAbilityScoreFormProps {
  scores: AbilityScores;
  onChange: (scores: AbilityScores) => void;
  className?: string;
}

type AbilityKey = keyof AbilityScores;
type GenerationMethod = 'pointBuy' | 'standardArray' | 'manual';

// Standard arrays and point buy constants
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_BUY_BASE = 8;
const POINT_BUY_MAX = 15;
const POINT_BUY_TOTAL = 27;

// Point costs for point buy
const getPointCost = (score: number): number => {
  if (score <= 8) return 0;
  if (score <= 13) return score - 8;
  if (score === 14) return 7;
  if (score === 15) return 9;
  return 0; // Invalid
};

const getTotalPointCost = (scores: AbilityScores): number => {
  return Object.values(scores).reduce((total, score) => total + getPointCost(score), 0);
};

export const BasicAbilityScoreForm: React.FC<BasicAbilityScoreFormProps> = ({
  scores,
  onChange,
  className = '',
}) => {
  const [method, setMethod] = useState<GenerationMethod>('pointBuy');
  const [standardArrayAssignment, setStandardArrayAssignment] = useState<Record<AbilityKey, number>>({
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  });

  // Ability names and descriptions
  const abilities: { key: AbilityKey; name: string; short: string; description: string }[] = [
    { key: 'strength', name: 'Strength', short: 'STR', description: 'Physical power, melee attacks' },
    { key: 'dexterity', name: 'Dexterity', short: 'DEX', description: 'Agility, AC, ranged attacks' },
    { key: 'constitution', name: 'Constitution', short: 'CON', description: 'Health, hit points' },
    { key: 'intelligence', name: 'Intelligence', short: 'INT', description: 'Reasoning, memory' },
    { key: 'wisdom', name: 'Wisdom', short: 'WIS', description: 'Perception, insight' },
    { key: 'charisma', name: 'Charisma', short: 'CHA', description: 'Force of personality' },
  ];

  // Calculate ability modifier
  const getModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  // Format modifier for display
  const formatModifier = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  // Update scores based on method
  const updateScores = (newScores: Partial<AbilityScores>) => {
    onChange({ ...scores, ...newScores });
  };

  // Handle point buy changes
  const handlePointBuyChange = (ability: AbilityKey, value: number) => {
    const newScores = { ...scores, [ability]: Math.max(POINT_BUY_BASE, Math.min(POINT_BUY_MAX, value)) };
    updateScores(newScores);
  };

  // Handle manual entry changes
  const handleManualChange = (ability: AbilityKey, value: number) => {
    const newScores = { ...scores, [ability]: Math.max(1, Math.min(20, value)) };
    updateScores(newScores);
  };

  // Apply standard array
  const applyStandardArray = () => {
    updateScores(standardArrayAssignment);
  };

  // Reset to default point buy
  const resetToPointBuy = () => {
    const defaultScores: AbilityScores = {
      strength: 13,
      dexterity: 14,
      constitution: 15,
      intelligence: 8,
      wisdom: 12,
      charisma: 10,
    };
    updateScores(defaultScores);
  };

  // Apply method change
  useEffect(() => {
    if (method === 'standardArray') {
      applyStandardArray();
    } else if (method === 'pointBuy') {
      resetToPointBuy();
    }
  }, [method]);

  // Calculate point buy status
  const totalPointsUsed = method === 'pointBuy' ? getTotalPointCost(scores) : 0;
  const pointsRemaining = POINT_BUY_TOTAL - totalPointsUsed;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Method Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ability Score Generation</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMethod('pointBuy')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              method === 'pointBuy'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
            }`}
          >
            Point Buy
          </button>
          <button
            type="button"
            onClick={() => setMethod('standardArray')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              method === 'standardArray'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
            }`}
          >
            Standard Array
          </button>
          <button
            type="button"
            onClick={() => setMethod('manual')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              method === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
            }`}
          >
            Manual Entry
          </button>
        </div>

        {/* Point Buy Status */}
        {method === 'pointBuy' && (
          <div className={`p-3 rounded-lg ${
            pointsRemaining < 0
              ? 'bg-red-50 border border-red-200 text-red-800'
              : pointsRemaining === 0
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-medium">
                Points Used: {totalPointsUsed} / {POINT_BUY_TOTAL}
              </span>
              <span className={`font-medium ${pointsRemaining < 0 ? 'text-red-600' : ''}`}>
                Remaining: {pointsRemaining}
              </span>
            </div>
            {pointsRemaining < 0 && (
              <p className="text-sm mt-1">You've exceeded the point buy limit!</p>
            )}
          </div>
        )}

        {/* Standard Array Instructions */}
        {method === 'standardArray' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Standard Array:</strong> Assign the values [15, 14, 13, 12, 10, 8] to your abilities.
              You can change the assignments below.
            </p>
          </div>
        )}
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {abilities.map(({ key, name, short, description }) => (
          <div key={key} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
              </div>
              <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{short}</span>
            </div>

            <div className="space-y-2">
              {/* Score Input */}
              {method === 'pointBuy' && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handlePointBuyChange(key, scores[key] - 1)}
                    disabled={scores[key] <= POINT_BUY_BASE}
                    className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:hover:bg-gray-500"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={POINT_BUY_BASE}
                    max={POINT_BUY_MAX}
                    value={scores[key]}
                    onChange={(e) => handlePointBuyChange(key, parseInt(e.target.value) || POINT_BUY_BASE)}
                    className="w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handlePointBuyChange(key, scores[key] + 1)}
                    disabled={scores[key] >= POINT_BUY_MAX || pointsRemaining <= 0}
                    className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:hover:bg-gray-500"
                  >
                    +
                  </button>
                </div>
              )}

              {method === 'standardArray' && (
                <select
                  value={standardArrayAssignment[key]}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    setStandardArrayAssignment(prev => ({ ...prev, [key]: newValue }));
                    updateScores({ [key]: newValue });
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {STANDARD_ARRAY.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              )}

              {method === 'manual' && (
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={scores[key]}
                  onChange={(e) => handleManualChange(key, parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              )}

              {/* Score Display and Modifier */}
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {scores[key]}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${
                    getModifier(scores[key]) >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatModifier(getModifier(scores[key]))}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Modifier</div>
                </div>
              </div>

              {/* Point cost for point buy */}
              {method === 'pointBuy' && (
                <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Cost: {getPointCost(scores[key])} points
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Ability Score Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
          {abilities.map(({ key, short }) => (
            <div key={key} className="text-center">
              <div className="font-mono text-gray-600 dark:text-gray-400">{short}</div>
              <div className="font-bold text-gray-900 dark:text-white">
                {scores[key]} ({formatModifier(getModifier(scores[key]))})
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
          <p><strong>Total Modifier Sum:</strong> {Object.values(scores).reduce((sum, score) => sum + getModifier(score), 0)}</p>
          {method === 'pointBuy' && (
            <p><strong>Point Buy:</strong> {totalPointsUsed}/{POINT_BUY_TOTAL} points used</p>
          )}
        </div>
      </div>
    </div>
  );
};
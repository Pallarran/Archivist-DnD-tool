/**
 * Basic DPR Simulator without store dependencies
 */

import React, { useState } from 'react';

export const BasicDPRSimulator: React.FC = () => {
  const [targetAC, setTargetAC] = useState<number>(15);
  const [attackBonus, setAttackBonus] = useState<number>(5);
  const [damage, setDamage] = useState<string>('1d8+3');
  const [result, setResult] = useState<{ dpr: number; hitChance: number } | null>(null);

  const calculateSimpleDPR = () => {
    // Basic hit chance calculation
    const hitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - attackBonus)) / 20));
    
    // Simple damage parsing (just handle basic cases like "1d8+3")
    let averageDamage = 8; // Default
    try {
      if (damage.includes('d')) {
        const match = damage.match(/(\d+)d(\d+)(?:\+(\d+))?/);
        if (match) {
          const [, numDice, dieSize, bonus] = match;
          const diceAverage = parseInt(numDice) * (parseInt(dieSize) + 1) / 2;
          averageDamage = diceAverage + (parseInt(bonus) || 0);
        }
      } else {
        averageDamage = parseFloat(damage) || 8;
      }
    } catch (e) {
      averageDamage = 8;
    }
    
    const dpr = hitChance * averageDamage;
    setResult({ dpr, hitChance });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DPR Calculator</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Calculate damage per round for D&D 5e attacks
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attack Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attack Bonus
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={attackBonus}
              onChange={(e) => setAttackBonus(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target AC
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={targetAC}
              onChange={(e) => setTargetAC(parseInt(e.target.value) || 15)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Damage (e.g., 1d8+3)
            </label>
            <input
              type="text"
              value={damage}
              onChange={(e) => setDamage(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="1d8+3"
            />
          </div>
        </div>

        <button
          onClick={calculateSimpleDPR}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Calculate DPR
        </button>
      </div>

      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Results</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {result.dpr.toFixed(2)}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-300">Damage Per Round</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(result.hitChance * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-green-800 dark:text-green-300">Hit Chance</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Calculation Details</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>Attack Bonus: +{attackBonus}</li>
              <li>Target AC: {targetAC}</li>
              <li>Need to roll: {Math.max(1, targetAC - attackBonus)} or higher on d20</li>
              <li>Hit Chance: {(result.hitChance * 100).toFixed(1)}%</li>
              <li>Average Damage: {(result.dpr / result.hitChance).toFixed(1)}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
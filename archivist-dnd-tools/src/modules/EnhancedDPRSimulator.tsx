/**
 * Enhanced DPR Simulator with store integration and build management
 */

import React, { useState, useEffect } from 'react';
import { useSimpleStore } from '../store/simpleStore';

export const EnhancedDPRSimulator: React.FC = () => {
  // Store hooks
  const builds = useSimpleStore((state) => state.builds);
  const selectedBuild = useSimpleStore((state) => state.getSelectedBuild());
  const { addBuild, updateBuild, selectBuild, addNotification } = useSimpleStore();

  // Local state
  const [targetAC, setTargetAC] = useState<number>(15);
  const [result, setResult] = useState<{ dpr: number; hitChance: number } | null>(null);
  const [showBuildCreator, setShowBuildCreator] = useState<boolean>(false);

  // Build creator state
  const [newBuildName, setNewBuildName] = useState<string>('');
  const [newBuildLevel, setNewBuildLevel] = useState<number>(1);
  const [newBuildAttackBonus, setNewBuildAttackBonus] = useState<number>(3);
  const [newBuildDamage, setNewBuildDamage] = useState<string>('1d8+1');

  // Calculate DPR based on current build or form values
  const calculateDPR = () => {
    let attackBonus: number;
    let damage: string;
    let buildName: string;

    if (selectedBuild) {
      attackBonus = selectedBuild.attackBonus;
      damage = selectedBuild.damage;
      buildName = selectedBuild.name;
    } else {
      // Use form values if no build is selected
      attackBonus = newBuildAttackBonus;
      damage = newBuildDamage;
      buildName = 'Current Configuration';
    }

    // Calculate hit chance
    const hitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - attackBonus)) / 20));
    
    // Parse damage
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

    addNotification({
      type: 'success',
      message: `DPR calculated for ${buildName}: ${dpr.toFixed(2)}`,
    });
  };

  // Create new build
  const handleCreateBuild = () => {
    if (!newBuildName.trim()) {
      addNotification({
        type: 'error',
        message: 'Build name is required',
      });
      return;
    }

    addBuild({
      name: newBuildName.trim(),
      level: newBuildLevel,
      attackBonus: newBuildAttackBonus,
      damage: newBuildDamage,
      notes: `Level ${newBuildLevel} character`,
    });

    // Reset form
    setNewBuildName('');
    setNewBuildLevel(1);
    setNewBuildAttackBonus(3);
    setNewBuildDamage('1d8+1');
    setShowBuildCreator(false);
  };

  // Auto-calculate when build selection changes
  useEffect(() => {
    if (selectedBuild) {
      calculateDPR();
    }
  }, [selectedBuild, targetAC]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DPR Calculator</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Calculate damage per round for D&D 5e attacks with build management
        </p>
      </div>

      {/* Build Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Character Builds</h2>
          <button
            onClick={() => setShowBuildCreator(!showBuildCreator)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            {showBuildCreator ? 'Cancel' : 'New Build'}
          </button>
        </div>

        {/* Build Creator */}
        {showBuildCreator && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Create New Build</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Build Name
                </label>
                <input
                  type="text"
                  value={newBuildName}
                  onChange={(e) => setNewBuildName(e.target.value)}
                  placeholder="e.g., Human Fighter"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Level
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newBuildLevel}
                  onChange={(e) => setNewBuildLevel(parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attack Bonus
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={newBuildAttackBonus}
                  onChange={(e) => setNewBuildAttackBonus(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Damage
                </label>
                <input
                  type="text"
                  value={newBuildDamage}
                  onChange={(e) => setNewBuildDamage(e.target.value)}
                  placeholder="1d8+3"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleCreateBuild}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Create Build
              </button>
            </div>
          </div>
        )}

        {/* Build List */}
        {builds.length > 0 ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Build ({builds.length} available)
            </label>
            <select
              value={selectedBuild?.id || ''}
              onChange={(e) => selectBuild(e.target.value || null)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            >
              <option value="">Manual Configuration</option>
              {builds.map((build) => (
                <option key={build.id} value={build.id}>
                  {build.name} (Level {build.level}, +{build.attackBonus} attack, {build.damage})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p>No builds created yet. Create your first build to get started!</p>
          </div>
        )}
      </div>

      {/* Attack Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attack Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {!selectedBuild && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attack Bonus
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={newBuildAttackBonus}
                  onChange={(e) => setNewBuildAttackBonus(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Damage
                </label>
                <input
                  type="text"
                  value={newBuildDamage}
                  onChange={(e) => setNewBuildDamage(e.target.value)}
                  placeholder="1d8+3"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </>
          )}
          
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
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
          </div>
        </div>

        {selectedBuild && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Using Build: {selectedBuild.name}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Level {selectedBuild.level} • +{selectedBuild.attackBonus} attack • {selectedBuild.damage} damage
            </p>
          </div>
        )}

        <button
          onClick={calculateDPR}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Calculate DPR
        </button>
      </div>

      {/* Results */}
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
              <li>Attack Bonus: +{selectedBuild?.attackBonus || newBuildAttackBonus}</li>
              <li>Target AC: {targetAC}</li>
              <li>Need to roll: {Math.max(1, targetAC - (selectedBuild?.attackBonus || newBuildAttackBonus))} or higher on d20</li>
              <li>Hit Chance: {(result.hitChance * 100).toFixed(1)}%</li>
              <li>Average Damage: {(result.dpr / result.hitChance).toFixed(1)}</li>
              <li>Damage Formula: {selectedBuild?.damage || newBuildDamage}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Build List Summary */}
      {builds.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Builds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {builds.map((build) => (
              <div
                key={build.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedBuild?.id === build.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => selectBuild(build.id)}
              >
                <h3 className="font-medium text-gray-900 dark:text-white">{build.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Level {build.level} • +{build.attackBonus} • {build.damage}
                </p>
                {build.notes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{build.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
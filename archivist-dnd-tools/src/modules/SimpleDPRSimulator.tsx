/**
 * Simplified DPR Simulator for initial testing
 */

import React, { useState } from 'react';
import { useBuildStore, useUIStore } from '../store';

export const SimpleDPRSimulator: React.FC = () => {
  const { builds } = useBuildStore();
  const { addNotification } = useUIStore();
  const [selectedBuildId, setSelectedBuildId] = useState<string>('');
  const [targetAC, setTargetAC] = useState<number>(15);
  const [result, setResult] = useState<{ dpr: number; hitChance: number } | null>(null);

  const calculateSimpleDPR = () => {
    if (!selectedBuildId) {
      addNotification({
        type: 'warning',
        message: 'Please select a build',
      });
      return;
    }

    const build = builds.find(b => b.id === selectedBuildId);
    if (!build) {
      addNotification({
        type: 'error',
        message: 'Build not found',
      });
      return;
    }

    // Simple calculation
    const attackBonus = build.proficiencyBonus + 3; // Assume +3 ability mod
    const hitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - attackBonus)) / 20));
    const averageDamage = 8; // Simple assumption
    const dpr = hitChance * averageDamage;

    setResult({ dpr, hitChance });
    
    addNotification({
      type: 'success',
      message: `DPR calculated: ${dpr.toFixed(1)}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simple DPR Calculator</h1>
          <p className="text-gray-600">Basic damage per round calculation</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Build
              </label>
              {builds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No builds found. Please create a build first.</p>
                  <button
                    onClick={() => window.location.href = '#/build-lab'}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Create Build
                  </button>
                </div>
              ) : (
                <select
                  value={selectedBuildId}
                  onChange={(e) => setSelectedBuildId(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Choose a build...</option>
                  {builds.map((build) => (
                    <option key={build.id} value={build.id}>
                      {build.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target AC
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={targetAC}
                onChange={(e) => setTargetAC(parseInt(e.target.value) || 15)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={calculateSimpleDPR}
              disabled={!selectedBuildId}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Calculate DPR
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {result.dpr.toFixed(1)}
                </div>
                <div className="text-sm text-blue-800">Damage Per Round</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {(result.hitChance * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-green-800">Hit Chance</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
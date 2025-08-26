/**
 * Main DPR Simulator module - integrates all components and systems
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useBuildStore, useUIStore } from '../store';
import type { Build, Target, CombatContext } from '../types';
import type { DPRCalculationResult } from '../components/results/DPRResults';
import { BuildForm } from '../components/forms/BuildForm';
import { TargetForm } from '../components/forms/TargetForm';
import { CombatContextForm } from '../components/forms/CombatContextForm';
import { DPRResults } from '../components/results/DPRResults';
import { PowerAttackAdvisor } from '../components/advisors/PowerAttackAdvisor';
import { AdvantageStateSweep } from '../components/analysis/AdvantageStateSweep';
import { calculateDPR } from '../engine/dpr';

export const DPRSimulator: React.FC = () => {
  const { builds } = useBuildStore();
  const { addNotification } = useUIStore();
  const [activeView, setActiveView] = useState<'simulator' | 'advisor' | 'analysis'>('simulator');
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [target, setTarget] = useState<Target>({
    name: 'Generic Enemy',
    armorClass: 15,
    hitPoints: 50,
    maxHP: 50,
    currentHP: 50,
    size: 'medium',
    type: 'humanoid',
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    conditions: [],
  });
  
  const [combat, setCombat] = useState<CombatContext>({
    advantage: 'normal',
    cover: 'none',
    range: 'normal',
    lighting: 'bright',
    flanking: false,
    hidden: false,
    recklessAttack: false,
    allyWithin5ft: false,
    targetActions: [],
    targetConditions: [],
  });

  const [simulationResults, setSimulationResults] = useState<DPRCalculationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const selectedBuild = useMemo(() => {
    return selectedBuildId ? builds.find(b => b.id === selectedBuildId) || null : null;
  }, [selectedBuildId, builds]);

  const handleRunSimulation = useCallback(async () => {
    if (!selectedBuild) {
      addNotification({
        type: 'warning',
        message: 'Please select a build to simulate',
      });
      return;
    }

    setIsCalculating(true);

    try {
      // Calculate DPR using our engine
      const result = await calculateDPR({
        build: selectedBuild,
        target,
        combat,
        rounds: 10,
      });

      const dprResult: DPRCalculationResult = {
        build: selectedBuild,
        target,
        combat,
        dpr: result.dpr,
        hitChances: result.hitChances,
        critChances: result.critChances,
        powerAttack: result.powerAttack,
        oncePerTurnAnalysis: result.oncePerTurnAnalysis,
        resourceUsage: result.resourceUsage,
        timestamp: new Date().toISOString(),
      };

      // Update or add to results
      const existingIndex = simulationResults.findIndex(r => r.build.id === selectedBuild.id);
      if (existingIndex >= 0) {
        const newResults = [...simulationResults];
        newResults[existingIndex] = dprResult;
        setSimulationResults(newResults);
      } else {
        setSimulationResults(prev => [...prev, dprResult]);
      }

      addNotification({
        type: 'success',
        message: `DPR calculation completed: ${result.dpr.total.toFixed(1)} damage per round`,
      });

    } catch (error) {
      console.error('DPR calculation error:', error);
      addNotification({
        type: 'error',
        message: 'Failed to calculate DPR. Please check your build configuration.',
      });
    } finally {
      setIsCalculating(false);
    }
  }, [selectedBuild, target, combat, simulationResults, addNotification]);

  const handleBuildSelect = useCallback((buildId: string | null) => {
    setSelectedBuildId(buildId);
  }, []);

  const views = [
    { id: 'simulator', label: 'DPR Simulator', icon: '🎯' },
    { id: 'advisor', label: 'Power Attack Advisor', icon: '⚡' },
    { id: 'analysis', label: 'Advantage Analysis', icon: '📊' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DPR Simulator</h1>
          <p className="text-gray-600">
            Calculate damage per round with detailed tactical analysis
          </p>
        </div>

        {/* View Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{view.icon}</span>
                  {view.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        {activeView === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Build Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Select Build</h2>
                
                {builds.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg mb-2">No builds found</div>
                    <div className="text-sm text-gray-500 mb-4">
                      Create a build first to run DPR simulations
                    </div>
                    <button
                      onClick={() => window.location.href = '/build-lab'}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Create Build
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedBuildId || ''}
                      onChange={(e) => handleBuildSelect(e.target.value || null)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Choose a build...</option>
                      {builds.map((build) => (
                        <option key={build.id} value={build.id}>
                          {build.name} (Level {build.levels.reduce((sum, l) => sum + l.level, 0)})
                        </option>
                      ))}
                    </select>

                    {selectedBuild && (
                      <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                        <div className="font-medium">{selectedBuild.name}</div>
                        <div>
                          {selectedBuild.levels.map(l => `${l.class} ${l.level}`).join(' / ')}
                        </div>
                        <div className="mt-1">{selectedBuild.description}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Target Configuration */}
              <TargetForm
                target={target}
                onChange={setTarget}
              />

              {/* Combat Context */}
              <CombatContextForm
                combat={combat}
                onChange={setCombat}
              />

              {/* Calculate Button */}
              <button
                onClick={handleRunSimulation}
                disabled={!selectedBuild || isCalculating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calculating...
                  </div>
                ) : (
                  'Calculate DPR'
                )}
              </button>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2">
              <DPRResults
                results={simulationResults}
                selectedBuild={selectedBuildId}
                onBuildSelect={handleBuildSelect}
                showComparison={simulationResults.length > 1}
              />
            </div>
          </div>
        )}

        {/* Power Attack Advisor */}
        {activeView === 'advisor' && selectedBuild && (
          <PowerAttackAdvisor
            build={selectedBuild}
            target={target}
            combat={combat}
            onRecommendationApply={(recommendation) => {
              addNotification({
                type: 'info',
                message: `Applied recommendation: ${recommendation}`,
              });
            }}
          />
        )}

        {/* Advantage Analysis */}
        {activeView === 'analysis' && selectedBuild && (
          <AdvantageStateSweep
            build={selectedBuild}
            target={target}
            combat={combat}
            acRange={[10, 25]}
            onResultSelect={(ac, state) => {
              setTarget(prev => ({ ...prev, armorClass: ac }));
              setCombat(prev => ({ ...prev, advantage: state === 'elven-accuracy' ? 'advantage' : state }));
              addNotification({
                type: 'info',
                message: `Updated target AC to ${ac} and advantage state to ${state}`,
              });
            }}
          />
        )}

        {/* Prompts for missing build */}
        {(activeView === 'advisor' || activeView === 'analysis') && !selectedBuild && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-lg mb-2">No Build Selected</div>
            <div className="text-sm text-gray-500 mb-4">
              Please select a build in the Simulator tab to use this analysis tool
            </div>
            <button
              onClick={() => setActiveView('simulator')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Simulator
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
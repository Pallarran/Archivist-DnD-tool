/**
 * DPR calculation results display component
 */

import React, { useState } from 'react';
import type { Build, Target, CombatContext } from '../../types';
import { DPRBreakdown } from './DPRBreakdown';
import { TacticalAdvice } from './TacticalAdvice';
import { ComparisonChart } from './ComparisonChart';

export interface DPRCalculationResult {
  build: Build;
  target: Target;
  combat: CombatContext;
  dpr: {
    total: number;
    byRound: number[];
    breakdown: {
      weaponDamage: number;
      oncePerTurn: number;
      spellDamage: number;
      otherSources: number;
    };
    conditions: {
      normal: number;
      advantage: number;
      disadvantage: number;
      elvenAccuracy?: number;
    };
  };
  hitChances: {
    normal: number;
    advantage: number;
    disadvantage: number;
    elvenAccuracy?: number;
  };
  critChances: {
    normal: number;
    advantage: number;
    disadvantage: number;
    elvenAccuracy?: number;
  };
  powerAttack?: {
    recommended: boolean;
    breakEvenAC: number;
    normalDPR: number;
    powerAttackDPR: number;
  };
  oncePerTurnAnalysis?: {
    selectedEffect: string;
    reasoning: string;
    alternatives: Array<{
      name: string;
      damage: number;
      conditions: string;
    }>;
  };
  resourceUsage: {
    spellSlots: Record<string, number>;
    features: Record<string, number>;
  };
  timestamp: string;
}

interface DPRResultsProps {
  results: DPRCalculationResult[];
  selectedBuild?: string;
  onBuildSelect?: (buildId: string) => void;
  showComparison?: boolean;
}

export const DPRResults: React.FC<DPRResultsProps> = ({
  results,
  selectedBuild,
  onBuildSelect,
  showComparison = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'tactical' | 'comparison'>('overview');
  const [selectedAC, setSelectedAC] = useState<number>(15);
  
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg mb-2">No results yet</div>
        <div className="text-sm">Configure a build and target to see DPR calculations</div>
      </div>
    );
  }

  const currentResult = selectedBuild 
    ? results.find(r => r.build.id === selectedBuild) || results[0]
    : results[0];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'breakdown', label: 'Breakdown', icon: '🔍' },
    { id: 'tactical', label: 'Tactical', icon: '⚔️' },
    ...(showComparison ? [{ id: 'comparison', label: 'Compare', icon: '📈' }] : []),
  ] as const;

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">DPR Results</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Target AC: 
              <select 
                value={selectedAC}
                onChange={(e) => setSelectedAC(parseInt(e.target.value))}
                className="ml-2 rounded border-gray-300 text-sm"
              >
                {Array.from({length: 16}, (_, i) => i + 10).map(ac => (
                  <option key={ac} value={ac}>{ac}</option>
                ))}
              </select>
            </div>
            {results.length > 1 && onBuildSelect && (
              <select
                value={selectedBuild || ''}
                onChange={(e) => onBuildSelect(e.target.value)}
                className="rounded border-gray-300 text-sm"
              >
                {results.map(result => (
                  <option key={result.build.id} value={result.build.id}>
                    {result.build.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <DPROverview result={currentResult} targetAC={selectedAC} />
        )}
        
        {activeTab === 'breakdown' && (
          <DPRBreakdown result={currentResult} />
        )}
        
        {activeTab === 'tactical' && (
          <TacticalAdvice result={currentResult} />
        )}
        
        {activeTab === 'comparison' && showComparison && (
          <ComparisonChart results={results} targetAC={selectedAC} />
        )}
      </div>
    </div>
  );
};

// Overview tab component
const DPROverview: React.FC<{ result: DPRCalculationResult; targetAC: number }> = ({ 
  result, 
  targetAC 
}) => {
  const { dpr, hitChances, critChances, powerAttack } = result;
  
  return (
    <div className="space-y-6">
      {/* Main DPR Display */}
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {dpr.total.toFixed(1)}
        </div>
        <div className="text-lg text-gray-600">Damage Per Round</div>
        <div className="text-sm text-gray-500 mt-1">
          vs AC {targetAC} • {result.combat.advantage === 'advantage' ? 'With Advantage' : 
                               result.combat.advantage === 'disadvantage' ? 'With Disadvantage' : 'Normal'}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">
            {(hitChances.normal * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Hit Chance</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">
            {(critChances.normal * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Crit Chance</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">
            {dpr.byRound.length}
          </div>
          <div className="text-sm text-gray-600">Rounds Analyzed</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">
            {Object.values(result.resourceUsage.spellSlots).reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-sm text-gray-600">Spell Slots Used</div>
        </div>
      </div>

      {/* Damage Breakdown */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Damage Sources</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Weapon Attacks</span>
            <span className="font-medium">{dpr.breakdown.weaponDamage.toFixed(1)}</span>
          </div>
          {dpr.breakdown.oncePerTurn > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Once per Turn</span>
              <span className="font-medium">{dpr.breakdown.oncePerTurn.toFixed(1)}</span>
            </div>
          )}
          {dpr.breakdown.spellDamage > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Spells</span>
              <span className="font-medium">{dpr.breakdown.spellDamage.toFixed(1)}</span>
            </div>
          )}
          {dpr.breakdown.otherSources > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Other</span>
              <span className="font-medium">{dpr.breakdown.otherSources.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Power Attack Recommendation */}
      {powerAttack && (
        <div className={`p-4 rounded-lg border ${
          powerAttack.recommended 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <span className="text-lg mr-2">
              {powerAttack.recommended ? '✅' : '❌'}
            </span>
            <div>
              <div className="font-medium">
                {powerAttack.recommended ? 'Use Power Attack' : 'Don\'t Use Power Attack'}
              </div>
              <div className="text-sm mt-1">
                Normal: {powerAttack.normalDPR.toFixed(1)} DPR • 
                Power Attack: {powerAttack.powerAttackDPR.toFixed(1)} DPR • 
                Break-even AC: {powerAttack.breakEvenAC}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advantage State Comparison */}
      {dpr.conditions.advantage !== dpr.conditions.normal && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-xl font-bold text-red-700">
              {dpr.conditions.disadvantage.toFixed(1)}
            </div>
            <div className="text-sm text-red-600">Disadvantage</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-700">
              {dpr.conditions.normal.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Normal</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-700">
              {dpr.conditions.advantage.toFixed(1)}
            </div>
            <div className="text-sm text-green-600">Advantage</div>
          </div>
        </div>
      )}
    </div>
  );
};
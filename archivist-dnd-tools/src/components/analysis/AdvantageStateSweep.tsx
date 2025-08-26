/**
 * Advantage state sweep analysis component
 */

import React, { useState, useMemo } from 'react';
import type { Build, Target, CombatContext } from '../../types';
import { advantageStateSweep, type AdvantageContext, type AdvantageState } from '../../engine/advantageStates';

interface AdvantageStateSweepProps {
  build: Build;
  target: Target;
  combat: CombatContext;
  acRange?: [number, number];
  onResultSelect?: (ac: number, state: AdvantageState) => void;
}

export const AdvantageStateSweep: React.FC<AdvantageStateSweepProps> = ({
  build,
  target,
  combat,
  acRange = [10, 25],
  onResultSelect,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [selectedMetric, setSelectedMetric] = useState<'hit' | 'crit' | 'advantage'>('hit');
  
  const context: AdvantageContext = useMemo(() => ({
    build,
    target,
    combat,
    attackType: build.equipment.mainHand?.type === 'ranged' ? 'ranged' : 'melee',
    weapon: build.equipment.mainHand?.name,
  }), [build, target, combat]);

  const sweepResults = useMemo(() => {
    return advantageStateSweep(context, acRange);
  }, [context, acRange]);

  const advantageStates: AdvantageState[] = ['normal', 'advantage', 'disadvantage', 'elven-accuracy'];
  const stateColors = {
    normal: 'bg-gray-100 text-gray-800',
    advantage: 'bg-green-100 text-green-800',
    disadvantage: 'bg-red-100 text-red-800',
    'elven-accuracy': 'bg-purple-100 text-purple-800',
  };

  const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;
  
  const getBestState = (ac: number): AdvantageState => {
    const result = sweepResults.find(r => r.ac === ac);
    if (!result) return 'normal';
    
    let bestState: AdvantageState = 'normal';
    let bestValue = result.states.normal.hitProbability;
    
    advantageStates.forEach(state => {
      const stateData = result.states[state];
      if (stateData && stateData.hitProbability > bestValue) {
        bestValue = stateData.hitProbability;
        bestState = state;
      }
    });
    
    return bestState;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Advantage State Analysis</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Metric:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="rounded border-gray-300 text-sm"
            >
              <option value="hit">Hit Probability</option>
              <option value="crit">Crit Probability</option>
              <option value="advantage">Advantage Benefit</option>
            </select>
          </div>
          <div className="flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm border border-gray-300 rounded-l-md ${
                viewMode === 'table' 
                  ? 'bg-blue-50 text-blue-700 border-blue-300' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📊 Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 text-sm border border-gray-300 rounded-r-md border-l-0 ${
                viewMode === 'chart' 
                  ? 'bg-blue-50 text-blue-700 border-blue-300' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📈 Chart
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target AC
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Normal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advantage
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disadvantage
                  </th>
                  {build.features.includes('Elven Accuracy') && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Elven Accuracy
                    </th>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best State
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sweepResults.map(({ ac, states }) => {
                  const bestState = getBestState(ac);
                  
                  return (
                    <tr 
                      key={ac} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onResultSelect?.(ac, bestState)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ac}
                      </td>
                      
                      {advantageStates.map(state => {
                        const stateData = states[state];
                        if (!stateData || (state === 'elven-accuracy' && !build.features.includes('Elven Accuracy'))) {
                          if (state !== 'elven-accuracy') {
                            return (
                              <td key={state} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                N/A
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        const value = selectedMetric === 'hit' 
                          ? stateData.hitProbability
                          : selectedMetric === 'crit'
                          ? stateData.critProbability
                          : stateData.advantage;
                        
                        const isPositive = selectedMetric === 'advantage' && value > 0;
                        const isNegative = selectedMetric === 'advantage' && value < 0;
                        const isBest = state === bestState;
                        
                        return (
                          <td key={state} className="px-4 py-3 whitespace-nowrap text-center text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              isBest 
                                ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                                : isPositive
                                ? 'text-green-600'
                                : isNegative
                                ? 'text-red-600'
                                : 'text-gray-900'
                            }`}>
                              {formatPercent(value)}
                              {isBest && <span className="ml-1">👑</span>}
                            </span>
                          </td>
                        );
                      })}
                      
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${stateColors[bestState]}`}>
                          {bestState === 'elven-accuracy' ? 'Elven Acc.' : 
                           bestState.charAt(0).toUpperCase() + bestState.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'chart' && (
        <AdvantageChart 
          sweepResults={sweepResults}
          selectedMetric={selectedMetric}
          build={build}
          onPointClick={onResultSelect}
        />
      )}

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Key Insight</h4>
          <div className="text-sm text-blue-800">
            {getKeyInsight(sweepResults, acRange)}
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 mb-2">🎯 Sweet Spot</h4>
          <div className="text-sm text-green-800">
            {getSweetSpot(sweepResults)}
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Watch Out</h4>
          <div className="text-sm text-yellow-800">
            {getWarning(sweepResults)}
          </div>
        </div>
      </div>

      {/* Advantage Recommendations */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">📋 Tactical Recommendations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Prioritize Advantage When
            </h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Target AC is {getAdvantageThreshold(sweepResults)} or higher</li>
              <li>• You have reliable advantage sources</li>
              <li>• Critical hits provide significant benefit</li>
              <li>• You need to land important spell attacks</li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Avoid Disadvantage By
            </h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Maintaining proper positioning</li>
              <li>• Using ranged attacks at proper range</li>
              <li>• Having light sources in darkness</li>
              <li>• Removing conditions like poisoned</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvantageChart: React.FC<{
  sweepResults: any[];
  selectedMetric: 'hit' | 'crit' | 'advantage';
  build: Build;
  onPointClick?: (ac: number, state: AdvantageState) => void;
}> = ({ sweepResults, selectedMetric, build, onPointClick }) => {
  const advantageStates: AdvantageState[] = ['normal', 'advantage', 'disadvantage'];
  if (build.features.includes('Elven Accuracy')) {
    advantageStates.push('elven-accuracy');
  }
  
  const colors = {
    normal: '#6B7280',
    advantage: '#10B981',
    disadvantage: '#EF4444',
    'elven-accuracy': '#8B5CF6',
  };
  
  const maxValue = Math.max(
    ...sweepResults.flatMap(r => 
      advantageStates.map(state => {
        const stateData = r.states[state];
        if (!stateData) return 0;
        return selectedMetric === 'hit' 
          ? stateData.hitProbability
          : selectedMetric === 'crit'
          ? stateData.critProbability
          : Math.abs(stateData.advantage);
      })
    )
  );
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium text-gray-900">
          {selectedMetric === 'hit' ? 'Hit Probability' :
           selectedMetric === 'crit' ? 'Critical Hit Probability' :
           'Advantage Benefit'} by AC
        </h4>
        
        {/* Legend */}
        <div className="flex space-x-4">
          {advantageStates.map(state => (
            <div key={state} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: colors[state] }}
              ></div>
              <span className="text-xs text-gray-600 capitalize">
                {state === 'elven-accuracy' ? 'Elven Acc.' : state}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chart area */}
      <div className="relative bg-gray-50 rounded" style={{ height: '300px' }}>
        <svg className="w-full h-full">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map(fraction => (
            <line
              key={fraction}
              x1="10%"
              y1={`${100 - fraction * 80}%`}
              x2="90%"
              y2={`${100 - fraction * 80}%`}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Lines for each advantage state */}
          {advantageStates.map(state => (
            <g key={state}>
              <polyline
                fill="none"
                stroke={colors[state]}
                strokeWidth="2"
                points={sweepResults.map((result, index) => {
                  const stateData = result.states[state];
                  if (!stateData) return null;
                  
                  const value = selectedMetric === 'hit' 
                    ? stateData.hitProbability
                    : selectedMetric === 'crit'
                    ? stateData.critProbability
                    : Math.max(0, stateData.advantage);
                  
                  const x = 10 + (index / (sweepResults.length - 1)) * 80;
                  const y = 100 - 20 - (value / maxValue) * 60;
                  
                  return `${x}%,${y}%`;
                }).filter(Boolean).join(' ')}
              />
              
              {/* Data points */}
              {sweepResults.map((result, index) => {
                const stateData = result.states[state];
                if (!stateData) return null;
                
                const value = selectedMetric === 'hit' 
                  ? stateData.hitProbability
                  : selectedMetric === 'crit'
                  ? stateData.critProbability
                  : Math.max(0, stateData.advantage);
                
                const x = 10 + (index / (sweepResults.length - 1)) * 80;
                const y = 100 - 20 - (value / maxValue) * 60;
                
                return (
                  <circle
                    key={`${state}-${index}`}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill={colors[state]}
                    className="cursor-pointer hover:r-4"
                    onClick={() => onPointClick?.(result.ac, state)}
                  />
                );
              })}
            </g>
          ))}
          
          {/* X-axis labels */}
          {sweepResults.filter((_, i) => i % 3 === 0).map((result, index, filtered) => (
            <text
              key={result.ac}
              x={`${10 + (sweepResults.indexOf(result) / (sweepResults.length - 1)) * 80}%`}
              y="95%"
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {result.ac}
            </text>
          ))}
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1.0].map(fraction => (
            <text
              key={fraction}
              x="5%"
              y={`${100 - fraction * 80}%`}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-gray-500"
            >
              {(fraction * 100).toFixed(0)}%
            </text>
          ))}
        </svg>
      </div>
      
      {/* Chart footer */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Armor Class (X-axis) vs {selectedMetric === 'hit' ? 'Hit Chance' : 
                                  selectedMetric === 'crit' ? 'Crit Chance' : 
                                  'Advantage Benefit'} (Y-axis)
      </div>
    </div>
  );
};

// Helper functions for insights
const getKeyInsight = (results: any[], acRange: [number, number]): string => {
  const advantageAlwaysBetter = results.every(r => 
    r.states.advantage.hitProbability > r.states.normal.hitProbability
  );
  
  if (advantageAlwaysBetter) {
    const avgImprovement = results.reduce((sum, r) => 
      sum + (r.states.advantage.hitProbability - r.states.normal.hitProbability), 0
    ) / results.length;
    
    return `Advantage improves hit chance by ${(avgImprovement * 100).toFixed(1)}% on average across AC ${acRange[0]}-${acRange[1]}.`;
  }
  
  return "Advantage provides diminishing returns against very high AC targets.";
};

const getSweetSpot = (results: any[]): string => {
  // Find AC where advantage provides the most benefit
  let bestAC = results[0].ac;
  let bestBenefit = 0;
  
  results.forEach(r => {
    const benefit = r.states.advantage.advantage;
    if (benefit > bestBenefit) {
      bestBenefit = benefit;
      bestAC = r.ac;
    }
  });
  
  return `Advantage is most valuable against AC ${bestAC} (+${(bestBenefit * 100).toFixed(1)}% hit chance).`;
};

const getWarning = (results: any[]): string => {
  const veryHighACResults = results.filter(r => r.ac >= 20);
  if (veryHighACResults.length > 0) {
    const avgHitChance = veryHighACResults.reduce((sum, r) => 
      sum + r.states.advantage.hitProbability, 0) / veryHighACResults.length;
    
    if (avgHitChance < 0.3) {
      return `Even with advantage, hit chance drops below 30% against AC 20+. Consider buffs or different tactics.`;
    }
  }
  
  return "Disadvantage can severely impact performance. Avoid when possible.";
};

const getAdvantageThreshold = (results: any[]): number => {
  // Find the AC where advantage starts providing significant benefit
  const significantBenefit = 0.15; // 15% improvement
  
  const thresholdResult = results.find(r => 
    r.states.advantage.advantage >= significantBenefit
  );
  
  return thresholdResult?.ac || results[0]?.ac || 10;
};
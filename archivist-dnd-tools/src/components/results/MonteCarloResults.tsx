/**
 * Monte Carlo Results Display Component
 * Shows detailed statistical analysis from Monte Carlo simulations
 */

import React, { useState } from 'react';
import type { MonteCarloResults } from '../../engine/monteCarlo';

interface MonteCarloResultsProps {
  results: MonteCarloResults;
  buildName: string;
  onClose: () => void;
}

export const MonteCarloResultsComponent: React.FC<MonteCarloResultsProps> = ({
  results,
  buildName,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rounds' | 'insights' | 'distribution'>('overview');

  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatNumber(results.damage.mean)}
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-300">Mean DPR</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            ±{formatNumber(results.damage.confidenceInterval.margin)} (95% CI)
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatNumber(results.accuracy.hitRate * 100, 1)}%
          </div>
          <div className="text-sm text-green-800 dark:text-green-300">Hit Rate</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {formatNumber(results.accuracy.critRate * 100, 1)}% crit rate
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {results.runs.toLocaleString()}
          </div>
          <div className="text-sm text-purple-800 dark:text-purple-300">Simulations</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Seed: {results.seed}
          </div>
        </div>
      </div>

      {/* Damage Distribution Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Damage Distribution
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          {Object.entries(results.damage.percentiles).map(([percentile, value]) => (
            <div key={percentile} className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatNumber(value)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {percentile}th %
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Interval Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          95% Confidence Interval
        </h4>
        <div className="relative">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {formatNumber(results.damage.confidenceInterval.lower)}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-3 relative">
              {/* Confidence interval bar */}
              <div 
                className="bg-blue-500 h-3 rounded-full relative"
                style={{ 
                  marginLeft: '25%',
                  width: '50%'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
              </div>
              {/* Mean marker */}
              <div 
                className="absolute top-0 w-1 h-3 bg-red-500"
                style={{ left: '50%', marginLeft: '-2px' }}
              ></div>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              {formatNumber(results.damage.confidenceInterval.upper)}
            </span>
          </div>
          <div className="text-center mt-1">
            <span className="text-xs text-red-600 dark:text-red-400">
              Mean: {formatNumber(results.damage.mean)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoundsTab = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Round-by-Round Analysis
        </h4>
        
        <div className="space-y-3">
          {results.damage.byRound.mean.map((meanDamage, index) => {
            const ci = results.damage.byRound.confidenceInterval[index];
            const roundNum = index + 1;
            
            return (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Round {roundNum}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatNumber(meanDamage)} damage
                  </span>
                </div>
                
                <div className="relative">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500 w-12">
                      {formatNumber(ci.lower)}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 relative">
                      <div 
                        className={`h-2 rounded-full ${
                          roundNum === 1 ? 'bg-green-500' :
                          roundNum <= 3 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (meanDamage / Math.max(...results.damage.byRound.mean)) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-gray-500 w-12">
                      {formatNumber(ci.upper)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-4">
      {/* Tactical Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tactical Insights
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Optimal Rounds */}
          <div>
            <h5 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center">
              <span className="mr-2">🎯</span> Strongest Rounds
            </h5>
            <div className="space-y-1 text-sm">
              {results.insights.optimalRounds.map(round => (
                <div key={round} className="text-gray-700 dark:text-gray-300">
                  Round {round}
                </div>
              ))}
            </div>
          </div>
          
          {/* Weak Rounds */}
          <div>
            <h5 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center">
              <span className="mr-2">⚠️</span> Weakest Rounds
            </h5>
            <div className="space-y-1 text-sm">
              {results.insights.weakestRounds.map(round => (
                <div key={round} className="text-gray-700 dark:text-gray-300">
                  Round {round}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Strategy Recommendations
        </h4>
        
        <div className="space-y-3">
          {results.insights.bestStrategies.map((strategy, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-green-600 dark:text-green-400">✅</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{strategy}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Risk Factors
        </h4>
        
        <div className="space-y-3">
          {results.insights.riskFactors.map((risk, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{risk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDistributionTab = () => (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Statistical Summary
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Central Tendency</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Mean:</span>
                <span className="font-mono">{formatNumber(results.damage.mean)}</span>
              </div>
              <div className="flex justify-between">
                <span>Median:</span>
                <span className="font-mono">{formatNumber(results.damage.median)}</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Dev:</span>
                <span className="font-mono">{formatNumber(results.damage.standardDeviation)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Confidence</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Lower 95%:</span>
                <span className="font-mono">{formatNumber(results.damage.confidenceInterval.lower)}</span>
              </div>
              <div className="flex justify-between">
                <span>Upper 95%:</span>
                <span className="font-mono">{formatNumber(results.damage.confidenceInterval.upper)}</span>
              </div>
              <div className="flex justify-between">
                <span>Margin:</span>
                <span className="font-mono">±{formatNumber(results.damage.confidenceInterval.margin)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Monte Carlo Analysis
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              {buildName} • {results.scenario.rounds} rounds • {results.runs.toLocaleString()} simulations
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'rounds', label: 'Round Analysis' },
            { id: 'insights', label: 'Insights' },
            { id: 'distribution', label: 'Statistics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'rounds' && renderRoundsTab()}
          {activeTab === 'insights' && renderInsightsTab()}
          {activeTab === 'distribution' && renderDistributionTab()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Simulation completed in deterministic mode with seed {results.seed}
          </div>
          <div className="space-x-3">
            <button
              onClick={() => {
                // Export results to CSV
                console.log('Export Monte Carlo results:', results);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
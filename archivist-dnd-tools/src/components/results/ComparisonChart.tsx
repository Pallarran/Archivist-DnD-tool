/**
 * Comparison chart component for multiple builds or scenarios
 */

import React, { useState } from 'react';
import type { DPRCalculationResult } from './DPRResults';

interface ComparisonChartProps {
  results: DPRCalculationResult[];
  targetAC: number;
}

type ComparisonType = 'dpr' | 'accuracy' | 'resource-efficiency' | 'ac-sweep';

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  results,
  targetAC,
}) => {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('dpr');
  const [acRange, setACRange] = useState<[number, number]>([10, 25]);

  if (results.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg mb-2">Need Multiple Results</div>
        <div className="text-sm">Add more builds or scenarios to compare</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Build Comparison</h3>
        <div className="flex items-center space-x-4">
          <select
            value={comparisonType}
            onChange={(e) => setComparisonType(e.target.value as ComparisonType)}
            className="rounded border-gray-300 text-sm"
          >
            <option value="dpr">DPR Comparison</option>
            <option value="accuracy">Hit Chance Analysis</option>
            <option value="resource-efficiency">Resource Efficiency</option>
            <option value="ac-sweep">AC Sweep Analysis</option>
          </select>
        </div>
      </div>

      {comparisonType === 'dpr' && (
        <DPRComparison results={results} targetAC={targetAC} />
      )}

      {comparisonType === 'accuracy' && (
        <AccuracyComparison results={results} targetAC={targetAC} />
      )}

      {comparisonType === 'resource-efficiency' && (
        <ResourceEfficiencyComparison results={results} />
      )}

      {comparisonType === 'ac-sweep' && (
        <ACSweepComparison results={results} acRange={acRange} />
      )}
    </div>
  );
};

const DPRComparison: React.FC<{ results: DPRCalculationResult[]; targetAC: number }> = ({
  results,
  targetAC,
}) => {
  const maxDPR = Math.max(...results.map(r => r.dpr.total));
  
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Damage per round against AC {targetAC}
      </div>
      
      {results.map((result, index) => {
        const dprPercent = (result.dpr.total / maxDPR) * 100;
        const isTop = result.dpr.total === maxDPR;
        
        return (
          <div key={result.build.id || index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`font-medium ${isTop ? 'text-green-600' : 'text-gray-900'}`}>
                  {result.build.name}
                </span>
                {isTop && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">BEST</span>}
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${isTop ? 'text-green-600' : 'text-gray-900'}`}>
                  {result.dpr.total.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">DPR</div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${isTop ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${dprPercent}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>{(result.hitChances.normal * 100).toFixed(0)}% hit chance</span>
              <span>
                {result.dpr.breakdown.weaponDamage.toFixed(1)} weapon + 
                {result.dpr.breakdown.oncePerTurn.toFixed(1)} features
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AccuracyComparison: React.FC<{ results: DPRCalculationResult[]; targetAC: number }> = ({
  results,
  targetAC,
}) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Attack accuracy against AC {targetAC}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Normal Attacks</h4>
          {results.map((result, index) => (
            <div key={index} className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{result.build.name}</span>
              <span className="font-medium">{(result.hitChances.normal * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">With Advantage</h4>
          {results.map((result, index) => (
            <div key={index} className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{result.build.name}</span>
              <span className="font-medium">{(result.hitChances.advantage * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">With Disadvantage</h4>
          {results.map((result, index) => (
            <div key={index} className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{result.build.name}</span>
              <span className="font-medium">{(result.hitChances.disadvantage * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Critical Hit Comparison */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Critical Hit Chances</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['normal', 'advantage', 'disadvantage'].map(state => (
            <div key={state}>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </div>
              {results.map((result, index) => (
                <div key={index} className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{result.build.name}</span>
                  <span>{(result.critChances[state as keyof typeof result.critChances] * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResourceEfficiencyComparison: React.FC<{ results: DPRCalculationResult[] }> = ({
  results,
}) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        DPR per resource spent (higher is better)
      </div>
      
      {results.map((result, index) => {
        const totalSpellSlots = Object.values(result.resourceUsage.spellSlots)
          .reduce((sum, count) => sum + count, 0);
        
        const dprPerSpellSlot = totalSpellSlots > 0 
          ? result.dpr.total / totalSpellSlots 
          : result.dpr.total;
        
        const baseDPR = result.dpr.breakdown.weaponDamage;
        const resourceDPR = result.dpr.total - baseDPR;
        
        return (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{result.build.name}</h4>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {dprPerSpellSlot.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">DPR/Resource</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Base DPR (no resources)</div>
                <div className="font-medium">{baseDPR.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-gray-500">Resource DPR</div>
                <div className="font-medium">{resourceDPR.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-gray-500">Spell Slots/Round</div>
                <div className="font-medium">{totalSpellSlots.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-gray-500">Resource Dependency</div>
                <div className="font-medium">
                  {totalSpellSlots > 0 
                    ? `${((resourceDPR / result.dpr.total) * 100).toFixed(0)}%`
                    : '0%'}
                </div>
              </div>
            </div>
            
            {totalSpellSlots > 0 && (
              <div className="mt-3 text-xs text-gray-600">
                Spell slot usage: {Object.entries(result.resourceUsage.spellSlots)
                  .filter(([_, count]) => count > 0)
                  .map(([level, count]) => `${count}×L${level}`)
                  .join(', ')
                }
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ACSweepComparison: React.FC<{ 
  results: DPRCalculationResult[]; 
  acRange: [number, number];
}> = ({ results, acRange }) => {
  const [minAC, maxAC] = acRange;
  const acValues = Array.from({ length: maxAC - minAC + 1 }, (_, i) => minAC + i);
  
  // Generate DPR data for each AC value (simplified - would use actual calculations)
  const chartData = acValues.map(ac => {
    const dataPoint: any = { ac };
    results.forEach((result, index) => {
      // Simplified calculation - would use proper DPR calculation for each AC
      const hitChanceAdjustment = Math.max(0.05, Math.min(0.95, 
        (21 - (ac - (result.build.proficiencyBonus + 5))) / 20
      ));
      dataPoint[`build${index}`] = result.dpr.total * (hitChanceAdjustment / result.hitChances.normal);
    });
    return dataPoint;
  });
  
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          DPR performance across armor class range
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <label>Range:</label>
          <input
            type="number"
            value={minAC}
            onChange={(e) => setACRange([parseInt(e.target.value), maxAC])}
            className="w-16 rounded border-gray-300 text-sm"
            min="1"
            max="30"
          />
          <span>to</span>
          <input
            type="number"
            value={maxAC}
            onChange={(e) => setACRange([minAC, parseInt(e.target.value)])}
            className="w-16 rounded border-gray-300 text-sm"
            min="1"
            max="30"
          />
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {results.map((result, index) => (
          <div key={index} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span className="text-sm text-gray-700">{result.build.name}</span>
          </div>
        ))}
      </div>
      
      {/* Simple chart visualization */}
      <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <div className="relative" style={{ minWidth: '600px', height: '300px' }}>
          {/* Chart grid */}
          <div className="absolute inset-0">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
              <span>High DPR</span>
              <span>Medium</span>
              <span>Low DPR</span>
            </div>
            
            {/* X-axis */}
            <div className="absolute bottom-0 left-8 right-0 h-px bg-gray-300"></div>
            <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500">
              {acValues.filter((_, i) => i % 3 === 0).map(ac => (
                <span key={ac}>AC {ac}</span>
              ))}
            </div>
            
            {/* Data visualization - simplified */}
            <div className="absolute bottom-4 left-8 right-0 top-4">
              {results.map((result, index) => (
                <div key={index} className="absolute inset-0">
                  <svg className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke={colors[index % colors.length]}
                      strokeWidth="2"
                      points={chartData.map((point, i) => {
                        const x = (i / (chartData.length - 1)) * 100;
                        const y = 100 - ((point[`build${index}`] || 0) / Math.max(...results.map(r => r.dpr.total)) * 80);
                        return `${x}%,${y}%`;
                      }).join(' ')}
                    />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Key insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Best Against Low AC</h4>
          <div className="text-sm text-blue-800">
            {results.reduce((best, current) => 
              chartData[0][`build${results.indexOf(current)}`] > 
              chartData[0][`build${results.indexOf(best)}`] ? current : best
            ).build.name}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <h4 className="text-sm font-medium text-green-900 mb-1">Best Against High AC</h4>
          <div className="text-sm text-green-800">
            {results.reduce((best, current) => 
              chartData[chartData.length - 1][`build${results.indexOf(current)}`] > 
              chartData[chartData.length - 1][`build${results.indexOf(best)}`] ? current : best
            ).build.name}
          </div>
        </div>
      </div>
    </div>
  );
};
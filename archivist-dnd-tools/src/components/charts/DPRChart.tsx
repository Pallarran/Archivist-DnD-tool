/**
 * DPR Chart Components
 * Visualizes DPR curves by AC and level progression
 */

import React, { useMemo } from 'react';
import type { SimpleBuild } from '../../store/simpleStore';
import { DPRAnalysisEngine, type DPRCurve, type LevelDPRProgression } from '../../utils/dprAnalysis';

interface DPRByACChartProps {
  builds: Array<{ build: SimpleBuild; name: string; color: string }>;
  acRange: { min: number; max: number };
  showAdvantage?: boolean;
  showDisadvantage?: boolean;
  className?: string;
}

interface LevelProgressionChartProps {
  build: SimpleBuild;
  buildName: string;
  targetAC?: number;
  maxLevel?: number;
  className?: string;
}

/**
 * DPR by AC Chart Component
 */
export const DPRByACChart: React.FC<DPRByACChartProps> = ({
  builds,
  acRange,
  showAdvantage = true,
  showDisadvantage = true,
  className = ''
}) => {
  const chartData = useMemo(() => {
    return builds.map(({ build, name, color }) => {
      const curve = DPRAnalysisEngine.generateDPRCurve(build, acRange);
      return { name, color, curve };
    });
  }, [builds, acRange]);

  const maxDPR = useMemo(() => {
    let max = 0;
    chartData.forEach(({ curve }) => {
      curve.normal.forEach(point => max = Math.max(max, point.dpr));
      if (showAdvantage) curve.advantage.forEach(point => max = Math.max(max, point.dpr));
      if (showDisadvantage) curve.disadvantage.forEach(point => max = Math.max(max, point.dpr));
    });
    return Math.ceil(max * 1.1); // Add 10% padding
  }, [chartData, showAdvantage, showDisadvantage]);

  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 20, right: 100, bottom: 60, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Scale functions
  const scaleAC = (ac: number) => ((ac - acRange.min) / (acRange.max - acRange.min)) * plotWidth;
  const scaleDPR = (dpr: number) => plotHeight - (dpr / maxDPR) * plotHeight;

  // Generate grid lines
  const acTicks = [];
  for (let ac = acRange.min; ac <= acRange.max; ac += 2) {
    acTicks.push(ac);
  }
  
  const dprTicks = [];
  for (let dpr = 0; dpr <= maxDPR; dpr += Math.ceil(maxDPR / 8)) {
    dprTicks.push(dpr);
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        DPR by Armor Class
      </h3>
      
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="border rounded">
          {/* Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            className="stroke-gray-200 dark:stroke-gray-600"
          />
          
          {/* Grid lines */}
          {acTicks.map(ac => (
            <line
              key={`ac-${ac}`}
              x1={padding.left + scaleAC(ac)}
              y1={padding.top}
              x2={padding.left + scaleAC(ac)}
              y2={padding.top + plotHeight}
              className="stroke-gray-200 dark:stroke-gray-600"
              strokeWidth="0.5"
            />
          ))}
          
          {dprTicks.map(dpr => (
            <line
              key={`dpr-${dpr}`}
              x1={padding.left}
              y1={padding.top + scaleDPR(dpr)}
              x2={padding.left + plotWidth}
              y2={padding.top + scaleDPR(dpr)}
              className="stroke-gray-200 dark:stroke-gray-600"
              strokeWidth="0.5"
            />
          ))}
          
          {/* DPR Curves */}
          {chartData.map(({ name, color, curve }, buildIndex) => {
            // Generate path strings
            const normalPath = `M ${curve.normal.map(point => 
              `${padding.left + scaleAC(point.ac)},${padding.top + scaleDPR(point.dpr)}`
            ).join(' L ')}`;
            
            const advantagePath = showAdvantage ? `M ${curve.advantage.map(point => 
              `${padding.left + scaleAC(point.ac)},${padding.top + scaleDPR(point.dpr)}`
            ).join(' L ')}` : '';
            
            const disadvantagePath = showDisadvantage ? `M ${curve.disadvantage.map(point => 
              `${padding.left + scaleAC(point.ac)},${padding.top + scaleDPR(point.dpr)}`
            ).join(' L ')}` : '';

            return (
              <g key={name}>
                {/* Normal attack line */}
                <path
                  d={normalPath}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  className="opacity-90"
                />
                
                {/* Advantage line */}
                {showAdvantage && (
                  <path
                    d={advantagePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    className="opacity-70"
                  />
                )}
                
                {/* Disadvantage line */}
                {showDisadvantage && (
                  <path
                    d={disadvantagePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="2,2"
                    className="opacity-50"
                  />
                )}
              </g>
            );
          })}
          
          {/* Axes labels */}
          {acTicks.map(ac => (
            <text
              key={`ac-label-${ac}`}
              x={padding.left + scaleAC(ac)}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              className="fill-gray-600 dark:fill-gray-400 text-sm"
            >
              {ac}
            </text>
          ))}
          
          {dprTicks.map(dpr => (
            <text
              key={`dpr-label-${dpr}`}
              x={padding.left - 10}
              y={padding.top + scaleDPR(dpr) + 4}
              textAnchor="end"
              className="fill-gray-600 dark:fill-gray-400 text-sm"
            >
              {dpr}
            </text>
          ))}
          
          {/* Axis titles */}
          <text
            x={padding.left + plotWidth / 2}
            y={chartHeight - 10}
            textAnchor="middle"
            className="fill-gray-700 dark:fill-gray-300 font-medium"
          >
            Armor Class
          </text>
          
          <text
            x={15}
            y={padding.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${padding.top + plotHeight / 2})`}
            className="fill-gray-700 dark:fill-gray-300 font-medium"
          >
            Damage Per Round
          </text>
          
          {/* Legend */}
          <g transform={`translate(${chartWidth - padding.right + 10}, ${padding.top})`}>
            {chartData.map(({ name, color }, index) => (
              <g key={name} transform={`translate(0, ${index * 60})`}>
                <text className="fill-gray-900 dark:fill-white font-medium text-sm" y="0">
                  {name}
                </text>
                
                {/* Normal line */}
                <line x1="0" y1="10" x2="30" y2="10" stroke={color} strokeWidth="2" />
                <text className="fill-gray-600 dark:fill-gray-400 text-xs" x="35" y="14">
                  Normal
                </text>
                
                {/* Advantage line */}
                {showAdvantage && (
                  <>
                    <line x1="0" y1="25" x2="30" y2="25" stroke={color} strokeWidth="2" strokeDasharray="5,5" />
                    <text className="fill-gray-600 dark:fill-gray-400 text-xs" x="35" y="29">
                      Advantage
                    </text>
                  </>
                )}
                
                {/* Disadvantage line */}
                {showDisadvantage && (
                  <>
                    <line x1="0" y1="40" x2="30" y2="40" stroke={color} strokeWidth="2" strokeDasharray="2,2" />
                    <text className="fill-gray-600 dark:fill-gray-400 text-xs" x="35" y="44">
                      Disadvantage
                    </text>
                  </>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

/**
 * Level Progression Chart Component
 */
export const LevelProgressionChart: React.FC<LevelProgressionChartProps> = ({
  build,
  buildName,
  targetAC = 15,
  maxLevel = 20,
  className = ''
}) => {
  const progression = useMemo(() => {
    return DPRAnalysisEngine.analyzeLevelProgression(build, targetAC);
  }, [build, targetAC]);

  const chartData = progression.filter(p => p.level <= maxLevel);
  const maxDPR = Math.max(...chartData.flatMap(p => [
    p.dprCurve.normal.find(point => point.ac === targetAC)?.dpr || 0,
    p.dprCurve.advantage.find(point => point.ac === targetAC)?.dpr || 0,
    p.dprCurve.disadvantage.find(point => point.ac === targetAC)?.dpr || 0
  ]));

  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 20, right: 50, bottom: 80, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const scaleLevel = (level: number) => ((level - 1) / (maxLevel - 1)) * plotWidth;
  const scaleDPR = (dpr: number) => plotHeight - (dpr / (maxDPR * 1.1)) * plotHeight;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Level Progression - {buildName} (vs AC {targetAC})
      </h3>
      
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="border rounded">
          {/* Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            className="stroke-gray-200 dark:stroke-gray-600"
          />
          
          {/* Grid lines */}
          {[1, 5, 10, 15, 20].filter(l => l <= maxLevel).map(level => (
            <line
              key={`level-${level}`}
              x1={padding.left + scaleLevel(level)}
              y1={padding.top}
              x2={padding.left + scaleLevel(level)}
              y2={padding.top + plotHeight}
              className="stroke-gray-200 dark:stroke-gray-600"
              strokeWidth="0.5"
            />
          ))}
          
          {/* DPR progression lines */}
          {['normal', 'advantage', 'disadvantage'].map((state, index) => {
            const points = chartData.map(p => {
              const dprPoint = p.dprCurve[state as keyof typeof p.dprCurve].find(point => point.ac === targetAC);
              return {
                level: p.level,
                dpr: dprPoint?.dpr || 0
              };
            });
            
            const pathData = `M ${points.map(point => 
              `${padding.left + scaleLevel(point.level)},${padding.top + scaleDPR(point.dpr)}`
            ).join(' L ')}`;
            
            const colors = ['#3b82f6', '#10b981', '#ef4444']; // blue, green, red
            const strokeDashArray = ['none', '5,5', '2,2'];
            
            return (
              <path
                key={state}
                d={pathData}
                fill="none"
                stroke={colors[index]}
                strokeWidth="2"
                strokeDasharray={strokeDashArray[index]}
                className="opacity-80"
              />
            );
          })}
          
          {/* Breakpoint markers */}
          {chartData.map(p => {
            if (!p.breakpoints.majorImprovement) return null;
            
            return (
              <g key={`breakpoint-${p.level}`}>
                <circle
                  cx={padding.left + scaleLevel(p.level)}
                  cy={padding.top + scaleDPR(p.dprCurve.normal.find(point => point.ac === targetAC)?.dpr || 0)}
                  r="4"
                  fill="#f59e0b"
                  className="opacity-80"
                />
                <text
                  x={padding.left + scaleLevel(p.level)}
                  y={padding.top + plotHeight + 20}
                  textAnchor="middle"
                  className="fill-orange-600 dark:fill-orange-400 text-xs font-medium"
                >
                  {p.level}
                </text>
              </g>
            );
          })}
          
          {/* Axes */}
          {[1, 5, 10, 15, 20].filter(l => l <= maxLevel).map(level => (
            <text
              key={`level-label-${level}`}
              x={padding.left + scaleLevel(level)}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              className="fill-gray-600 dark:fill-gray-400 text-sm"
            >
              {level}
            </text>
          ))}
          
          <text
            x={padding.left + plotWidth / 2}
            y={chartHeight - 10}
            textAnchor="middle"
            className="fill-gray-700 dark:fill-gray-300 font-medium"
          >
            Character Level
          </text>
          
          <text
            x={15}
            y={padding.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${padding.top + plotHeight / 2})`}
            className="fill-gray-700 dark:fill-gray-300 font-medium"
          >
            DPR vs AC {targetAC}
          </text>
          
          {/* Legend */}
          <g transform={`translate(${chartWidth - 120}, ${padding.top + 10})`}>
            <text className="fill-gray-900 dark:fill-white text-sm font-medium">Attack States</text>
            <line x1="0" y1="20" x2="20" y2="20" stroke="#3b82f6" strokeWidth="2" />
            <text className="fill-gray-600 dark:fill-gray-400 text-xs" x="25" y="24">Normal</text>
            
            <line x1="0" y1="35" x2="20" y2="35" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
            <text className="fill-gray-600 dark:fill-gray-400 text-xs" x="25" y="39">Advantage</text>
            
            <line x1="0" y1="50" x2="20" y2="50" stroke="#ef4444" strokeWidth="2" strokeDasharray="2,2" />
            <text className="fill-gray-600 dark:fill-gray-400 text-xs" x="25" y="54">Disadvantage</text>
            
            <circle cx="10" cy="70" r="3" fill="#f59e0b" />
            <text className="fill-gray-600 dark:fill-gray-400 text-xs" x="20" y="74">Major Features</text>
          </g>
        </svg>
      </div>
      
      {/* Key Features Table */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Progression Milestones</h4>
        <div className="max-h-40 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-1 font-medium text-gray-700 dark:text-gray-300">Level</th>
                <th className="text-left py-1 font-medium text-gray-700 dark:text-gray-300">Features</th>
                <th className="text-right py-1 font-medium text-gray-700 dark:text-gray-300">DPR</th>
              </tr>
            </thead>
            <tbody>
              {chartData.filter(p => p.breakpoints.majorImprovement).map(p => (
                <tr key={p.level} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1 text-gray-900 dark:text-white font-medium">{p.level}</td>
                  <td className="py-1 text-gray-600 dark:text-gray-400">
                    {p.keyFeatures.slice(0, 2).join(', ')}
                  </td>
                  <td className="py-1 text-right text-gray-900 dark:text-white">
                    {(p.dprCurve.normal.find(point => point.ac === targetAC)?.dpr || 0).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
/**
 * Enhanced DPR Simulator with 3-column comparison and Target Panel
 * Matches product spec requirements for comprehensive DPR analysis
 */

import React, { useState, useEffect } from 'react';
import { useSimpleStore } from '../store/simpleStore';

// Combat target interface
interface Target {
  ac: number;
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  saves: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  magicResistance: boolean;
  evasion: boolean;
  legendaryResistances: number;
}

// DPR result for a single build
interface BuildResult {
  buildId: string | null;
  buildName: string;
  round1: number;
  round2: number;
  round3: number;
  totalDPR: number;
  sustainedDPR: number;
  hitChance: number;
  critChance: number;
  advantageStates: {
    normal: number;
    advantage: number;
    disadvantage: number;
  };
  powerAttack?: {
    normalDPR: number;
    powerAttackDPR: number;
    breakEvenAC: number;
    recommendation: 'use' | 'avoid' | 'neutral';
  };
}

export const EnhancedDPRSimulator: React.FC = () => {
  // Store hooks
  const builds = useSimpleStore((state) => state.builds);
  const { addNotification } = useSimpleStore();

  // Target Panel state
  const [target, setTarget] = useState<Target>({
    ac: 15,
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    saves: {
      strength: 0,
      dexterity: 2,
      constitution: 1,
      intelligence: -2,
      wisdom: 0,
      charisma: -1,
    },
    magicResistance: false,
    evasion: false,
    legendaryResistances: 0,
  });

  // Selected builds for comparison (up to 3)
  const [selectedBuilds, setSelectedBuilds] = useState<(string | null)[]>([null, null, null]);
  const [results, setResults] = useState<BuildResult[]>([]);
  
  // UI state
  const [showAdvantageStates, setShowAdvantageStates] = useState<boolean>(true);
  const [showBreakdowns, setShowBreakdowns] = useState<boolean>(false);
  const [activeColumn, setActiveColumn] = useState<number>(0);
  const [showPowerAttackAdvisor, setShowPowerAttackAdvisor] = useState<boolean>(true);

  // Calculate comprehensive DPR analysis for all selected builds
  const calculateAllDPR = () => {
    const newResults: BuildResult[] = [];

    selectedBuilds.forEach((buildId, index) => {
      if (!buildId && builds.length === 0) return;

      const build = builds.find(b => b.id === buildId);
      if (!build && buildId) return;

      const buildName = build ? build.name : `Build ${index + 1}`;
      const attackBonus = build ? build.attackBonus : 5;
      const damage = build ? build.damage : '1d8+3';

      // Calculate hit chances for all advantage states
      const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - attackBonus)) / 20));
      const advantageHitChance = 1 - Math.pow(1 - normalHitChance, 2);
      const disadvantageHitChance = Math.pow(normalHitChance, 2);

      // Parse damage
      let averageDamage = parseDamage(damage);
      
      // Calculate DPR for each advantage state
      const normalDPR = normalHitChance * averageDamage;
      const advantageDPR = advantageHitChance * averageDamage;
      const disadvantageDPR = disadvantageHitChance * averageDamage;

      // Simulate 3-round combat (simplified)
      const round1DPR = normalDPR; // First round
      const round2DPR = normalDPR; // Sustained
      const round3DPR = normalDPR; // Sustained
      const totalDPR = round1DPR + round2DPR + round3DPR;
      const sustainedDPR = normalDPR;

      // Calculate power attack analysis if build exists
      let powerAttackData;
      if (build) {
        const powerAttackAnalysis = getPowerAttackRecommendation(build);
        const powerAttackHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - (attackBonus - 5))) / 20));
        powerAttackData = {
          normalDPR: normalDPR,
          powerAttackDPR: powerAttackHitChance * (averageDamage + 10),
          breakEvenAC: powerAttackAnalysis.breakEvenAC,
          recommendation: powerAttackAnalysis.recommendation,
        };
      }

      newResults.push({
        buildId: buildId,
        buildName,
        round1: round1DPR,
        round2: round2DPR,
        round3: round3DPR,
        totalDPR,
        sustainedDPR,
        hitChance: normalHitChance,
        critChance: 0.05, // Standard 5% crit chance
        advantageStates: {
          normal: normalDPR,
          advantage: advantageDPR,
          disadvantage: disadvantageDPR,
        },
        powerAttack: powerAttackData,
      });
    });

    setResults(newResults);

    if (newResults.length > 0) {
      addNotification({
        type: 'success',
        message: `DPR calculated for ${newResults.length} build(s)`,
      });
    }
  };

  // Parse damage string into average damage
  const parseDamage = (damage: string): number => {
    try {
      if (damage.includes('d')) {
        const match = damage.match(/(\d+)d(\d+)(?:\+(\d+))?(?:\-(\d+))?/);
        if (match) {
          const [, numDice, dieSize, bonus, penalty] = match;
          const diceAverage = parseInt(numDice) * (parseInt(dieSize) + 1) / 2;
          const totalBonus = (parseInt(bonus) || 0) - (parseInt(penalty) || 0);
          return diceAverage + totalBonus;
        }
      } else {
        return parseFloat(damage) || 0;
      }
    } catch (e) {
      return 8; // Default
    }
    return 8;
  };

  // Calculate Sharpshooter/GWM break-even AC for a build
  const calculatePowerAttackBreakEven = (build: any): number => {
    if (!build) return 0;
    
    const attackBonus = build.attackBonus || 5;
    const damage = parseDamage(build.damage || '1d8+3');
    const powerAttackDamage = damage + 10; // +10 damage from Sharpshooter/GWM
    
    // Break-even occurs when: normalHit * damage = powerAttackHit * powerAttackDamage
    // Where powerAttackHit = normalHit with -5 penalty
    // Solving: (21 - (AC - attackBonus))/20 * damage = (21 - (AC - (attackBonus - 5)))/20 * (damage + 10)
    // Simplified break-even AC calculation
    const breakEvenAC = attackBonus + 11 - (10 * damage) / (damage + 10);
    return Math.max(1, Math.min(30, Math.round(breakEvenAC)));
  };

  // Get power attack recommendation for current target AC
  const getPowerAttackRecommendation = (build: any): { recommendation: 'use' | 'avoid' | 'neutral'; difference: number; breakEvenAC: number } => {
    if (!build) return { recommendation: 'neutral', difference: 0, breakEvenAC: 0 };
    
    const attackBonus = build.attackBonus || 5;
    const damage = parseDamage(build.damage || '1d8+3');
    const normalHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - attackBonus)) / 20));
    const powerAttackHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - (attackBonus - 5))) / 20));
    
    const normalDPR = normalHitChance * damage;
    const powerAttackDPR = powerAttackHitChance * (damage + 10);
    const difference = powerAttackDPR - normalDPR;
    const breakEvenAC = calculatePowerAttackBreakEven(build);
    
    const recommendation = difference > 0.5 ? 'use' : difference < -0.5 ? 'avoid' : 'neutral';
    
    return { recommendation, difference, breakEvenAC };
  };

  // Handle build selection for a column
  const handleBuildSelection = (columnIndex: number, buildId: string | null) => {
    const newSelectedBuilds = [...selectedBuilds];
    newSelectedBuilds[columnIndex] = buildId;
    setSelectedBuilds(newSelectedBuilds);
  };

  // Auto-calculate when builds or target changes
  useEffect(() => {
    if (selectedBuilds.some(id => id !== null) || builds.length > 0) {
      calculateAllDPR();
    }
  }, [selectedBuilds, target, builds]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DPR Simulator</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Side-by-side comparison of up to 3 builds with comprehensive combat analysis
            </p>
          </div>
        </div>
      </div>

      {/* Target Panel - Sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target AC
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="10"
                  max="25"
                  value={target.ac}
                  onChange={(e) => setTarget({...target, ac: parseInt(e.target.value)})}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="10"
                  max="25"
                  value={target.ac}
                  onChange={(e) => setTarget({...target, ac: parseInt(e.target.value) || 10})}
                  className="w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Magic Resistance
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={target.magicResistance}
                  onChange={(e) => setTarget({...target, magicResistance: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Advantage on saves</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Legendary Resistances
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={target.legendaryResistances}
                onChange={(e) => setTarget({...target, legendaryResistances: parseInt(e.target.value) || 0})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={calculateAllDPR}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Calculate DPR
              </button>
              <button
                onClick={() => setShowAdvantageStates(!showAdvantageStates)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                {showAdvantageStates ? 'Hide' : 'Show'} Advantage States
              </button>
              <button
                onClick={() => setShowPowerAttackAdvisor(!showPowerAttackAdvisor)}
                className="px-3 py-2 bg-purple-200 text-purple-700 rounded-md hover:bg-purple-300 text-sm"
              >
                {showPowerAttackAdvisor ? 'Hide' : 'Show'} Power Attack
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Power Attack Advisor - Sharpshooter/GWM */}
      {showPowerAttackAdvisor && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Power Attack Advisor (Sharpshooter/GWM)
              </h3>
              <button
                onClick={() => setShowPowerAttackAdvisor(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedBuilds.map((buildId, index) => {
                const build = builds.find(b => b.id === buildId);
                if (!build) return (
                  <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-gray-400 text-sm">No build selected</div>
                  </div>
                );
                
                const powerAttackAnalysis = getPowerAttackRecommendation(build);
                const recommendationColor = powerAttackAnalysis.recommendation === 'use' 
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                  : powerAttackAnalysis.recommendation === 'avoid'
                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                  : 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
                
                return (
                  <div key={index} className="space-y-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {build.name}
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${recommendationColor}`}>
                        {powerAttackAnalysis.recommendation === 'use' ? '✅ Use Power Attack' :
                         powerAttackAnalysis.recommendation === 'avoid' ? '❌ Avoid Power Attack' :
                         '⚖️ Marginal Benefit'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {powerAttackAnalysis.breakEvenAC}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">Break-even AC</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className={`font-semibold ${powerAttackAnalysis.difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {powerAttackAnalysis.difference > 0 ? '+' : ''}{powerAttackAnalysis.difference.toFixed(2)}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">DPR Diff</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      {target.ac < powerAttackAnalysis.breakEvenAC 
                        ? `Target AC ${target.ac} < ${powerAttackAnalysis.breakEvenAC} (favorable)`
                        : target.ac > powerAttackAnalysis.breakEvenAC
                        ? `Target AC ${target.ac} > ${powerAttackAnalysis.breakEvenAC} (unfavorable)`
                        : `Target AC ${target.ac} = ${powerAttackAnalysis.breakEvenAC} (break-even)`
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - 3-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Build Column A */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Build A</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Build
                </label>
                <select
                  value={selectedBuilds[0] || ''}
                  onChange={(e) => handleBuildSelection(0, e.target.value || null)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">No build selected</option>
                  {builds.map((build) => (
                    <option key={build.id} value={build.id}>
                      {build.name} (Lv.{build.level})
                    </option>
                  ))}
                </select>
              </div>

              {results[0] && (
                <div className="space-y-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {results[0].sustainedDPR.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">Sustained DPR</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-semibold">{results[0].round1.toFixed(1)}</div>
                      <div className="text-gray-600 dark:text-gray-400">R1</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-semibold">{results[0].round2.toFixed(1)}</div>
                      <div className="text-gray-600 dark:text-gray-400">R2</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-semibold">{results[0].round3.toFixed(1)}</div>
                      <div className="text-gray-600 dark:text-gray-400">R3</div>
                    </div>
                  </div>

                  {showAdvantageStates && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Advantage State Sweep</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="font-semibold text-red-600 dark:text-red-400">
                            {results[0].advantageStates.disadvantage.toFixed(1)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Disadv</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="font-semibold">
                            {results[0].advantageStates.normal.toFixed(1)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Normal</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {results[0].advantageStates.advantage.toFixed(1)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Adv</div>
                        </div>
                      </div>
                      
                      {/* Advantage state comparison with power attack */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">vs. Power Attack</div>
                        {results[0].powerAttack && (['disadvantage', 'normal', 'advantage'] as const).map((state) => {
                          const build = builds.find(b => b.id === selectedBuilds[0]);
                          if (!build) return null;
                          
                          const attackBonus = build.attackBonus || 5;
                          const damage = parseDamage(build.damage || '1d8+3');
                          
                          let hitChanceMultiplier = 1;
                          if (state === 'advantage') hitChanceMultiplier = 2;
                          if (state === 'disadvantage') hitChanceMultiplier = 0.5;
                          
                          const baseHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - attackBonus)) / 20));
                          const powerAttackHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - (attackBonus - 5))) / 20));
                          
                          let stateHitChance, statePowerHitChance;
                          if (state === 'advantage') {
                            stateHitChance = 1 - Math.pow(1 - baseHitChance, 2);
                            statePowerHitChance = 1 - Math.pow(1 - powerAttackHitChance, 2);
                          } else if (state === 'disadvantage') {
                            stateHitChance = Math.pow(baseHitChance, 2);
                            statePowerHitChance = Math.pow(powerAttackHitChance, 2);
                          } else {
                            stateHitChance = baseHitChance;
                            statePowerHitChance = powerAttackHitChance;
                          }
                          
                          const normalDPR = stateHitChance * damage;
                          const powerAttackDPR = statePowerHitChance * (damage + 10);
                          const difference = powerAttackDPR - normalDPR;
                          
                          return (
                            <div key={state} className="flex justify-between items-center text-xs p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                              <span className="capitalize text-gray-700 dark:text-gray-300">{state}:</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">{normalDPR.toFixed(1)}</span>
                                <span className="text-gray-400">vs</span>
                                <span className={`font-medium ${difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {powerAttackDPR.toFixed(1)}
                                </span>
                                <span className={`text-xs ${difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  ({difference > 0 ? '+' : ''}{difference.toFixed(1)})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Build Column B */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Build B</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Build
                </label>
                <select
                  value={selectedBuilds[1] || ''}
                  onChange={(e) => handleBuildSelection(1, e.target.value || null)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">No build selected</option>
                  {builds.map((build) => (
                    <option key={build.id} value={build.id}>
                      {build.name} (Lv.{build.level})
                    </option>
                  ))}
                </select>
              </div>

              {results[1] && (
                <div className="space-y-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {results[1].sustainedDPR.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">Sustained DPR</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-semibold">{results[1].round1.toFixed(1)}</div>
                      <div className="text-gray-600 dark:text-gray-400">R1</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-semibold">{results[1].round2.toFixed(1)}</div>
                      <div className="text-gray-600 dark:text-gray-400">R2</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-semibold">{results[1].round3.toFixed(1)}</div>
                      <div className="text-gray-600 dark:text-gray-400">R3</div>
                    </div>
                  </div>

                  {showAdvantageStates && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Advantage State Sweep</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="font-semibold text-red-600 dark:text-red-400">
                            {results[1].advantageStates.disadvantage.toFixed(1)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Disadv</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="font-semibold">
                            {results[1].advantageStates.normal.toFixed(1)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Normal</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {results[1].advantageStates.advantage.toFixed(1)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Adv</div>
                        </div>
                      </div>
                      
                      {/* Advantage state comparison with power attack */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">vs. Power Attack</div>
                        {results[1].powerAttack && (['disadvantage', 'normal', 'advantage'] as const).map((state) => {
                          const build = builds.find(b => b.id === selectedBuilds[1]);
                          if (!build) return null;
                          
                          const attackBonus = build.attackBonus || 5;
                          const damage = parseDamage(build.damage || '1d8+3');
                          
                          const baseHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - attackBonus)) / 20));
                          const powerAttackHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - (attackBonus - 5))) / 20));
                          
                          let stateHitChance, statePowerHitChance;
                          if (state === 'advantage') {
                            stateHitChance = 1 - Math.pow(1 - baseHitChance, 2);
                            statePowerHitChance = 1 - Math.pow(1 - powerAttackHitChance, 2);
                          } else if (state === 'disadvantage') {
                            stateHitChance = Math.pow(baseHitChance, 2);
                            statePowerHitChance = Math.pow(powerAttackHitChance, 2);
                          } else {
                            stateHitChance = baseHitChance;
                            statePowerHitChance = powerAttackHitChance;
                          }
                          
                          const normalDPR = stateHitChance * damage;
                          const powerAttackDPR = statePowerHitChance * (damage + 10);
                          const difference = powerAttackDPR - normalDPR;
                          
                          return (
                            <div key={state} className="flex justify-between items-center text-xs p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                              <span className="capitalize text-gray-700 dark:text-gray-300">{state}:</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">{normalDPR.toFixed(1)}</span>
                                <span className="text-gray-400">vs</span>
                                <span className={`font-medium ${difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {powerAttackDPR.toFixed(1)}
                                </span>
                                <span className={`text-xs ${difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  ({difference > 0 ? '+' : ''}{difference.toFixed(1)})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Build Column C */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Build C</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Build
                </label>
                <select
                  value={selectedBuilds[2] || ''}
                  onChange={(e) => handleBuildSelection(2, e.target.value || null)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">No build selected</option>
                  {builds.map((build) => (
                    <option key={build.id} value={build.id}>
                      {build.name} (Lv.{build.level})
                    </option>
                  ))}
                </select>
              </div>

              {results[2] && (
                <div className="space-y-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {results[2].sustainedDPR.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">Sustained DPR</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-semibold">{results[2].round1.toFixed(1)}</div>
                      <div className="text-gray-600 dark:text-gray-400">R1</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-semibold">{results[2].round2.toFixed(1)}</div>
                      <div className="text-gray-600 dark:text-gray-400">R2</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-semibold">{results[2].round3.toFixed(1)}</div>
                      <div className="text-gray-600 dark:text-gray-400">R3</div>
                    </div>
                  </div>

                  {showAdvantageStates && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Advantage State Sweep</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="font-semibold text-red-600 dark:text-red-400">
                            {results[2].advantageStates.disadvantage.toFixed(1)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Disadv</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="font-semibold">
                            {results[2].advantageStates.normal.toFixed(1)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Normal</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {results[2].advantageStates.advantage.toFixed(1)}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">Adv</div>
                        </div>
                      </div>
                      
                      {/* Advantage state comparison with power attack */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">vs. Power Attack</div>
                        {results[2].powerAttack && (['disadvantage', 'normal', 'advantage'] as const).map((state) => {
                          const build = builds.find(b => b.id === selectedBuilds[2]);
                          if (!build) return null;
                          
                          const attackBonus = build.attackBonus || 5;
                          const damage = parseDamage(build.damage || '1d8+3');
                          
                          const baseHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - attackBonus)) / 20));
                          const powerAttackHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - (attackBonus - 5))) / 20));
                          
                          let stateHitChance, statePowerHitChance;
                          if (state === 'advantage') {
                            stateHitChance = 1 - Math.pow(1 - baseHitChance, 2);
                            statePowerHitChance = 1 - Math.pow(1 - powerAttackHitChance, 2);
                          } else if (state === 'disadvantage') {
                            stateHitChance = Math.pow(baseHitChance, 2);
                            statePowerHitChance = Math.pow(powerAttackHitChance, 2);
                          } else {
                            stateHitChance = baseHitChance;
                            statePowerHitChance = powerAttackHitChance;
                          }
                          
                          const normalDPR = stateHitChance * damage;
                          const powerAttackDPR = statePowerHitChance * (damage + 10);
                          const difference = powerAttackDPR - normalDPR;
                          
                          return (
                            <div key={state} className="flex justify-between items-center text-xs p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                              <span className="capitalize text-gray-700 dark:text-gray-300">{state}:</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">{normalDPR.toFixed(1)}</span>
                                <span className="text-gray-400">vs</span>
                                <span className={`font-medium ${difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {powerAttackDPR.toFixed(1)}
                                </span>
                                <span className={`text-xs ${difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  ({difference > 0 ? '+' : ''}{difference.toFixed(1)})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Results Section */}
        {results.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Build Comparison Summary
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Build
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sustained DPR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      3-Round Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Hit Chance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Advantage DPR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Power Attack
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {results.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {result.buildName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {result.sustainedDPR.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {result.totalDPR.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {(result.hitChance * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {result.advantageStates.advantage.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {result.powerAttack ? (
                          <div className="flex items-center space-x-2">
                            <span className={
                              result.powerAttack.recommendation === 'use' ? 'text-green-600 dark:text-green-400' :
                              result.powerAttack.recommendation === 'avoid' ? 'text-red-600 dark:text-red-400' :
                              'text-yellow-600 dark:text-yellow-400'
                            }>
                              {result.powerAttack.powerAttackDPR.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({result.powerAttack.recommendation === 'use' ? '+' : 
                                result.powerAttack.recommendation === 'avoid' ? '-' : '='})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Helper Text */}
        {builds.length === 0 && (
          <div className="mt-8 text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 text-6xl mb-4">⚔️</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Builds Available</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create character builds in the Build Lab to use them for DPR comparison.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use the Build Lab tab to create detailed character builds with classes, abilities, and equipment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
/**
 * Enhanced DPR Simulator with 3-column comparison and Target Panel
 * Matches product spec requirements for comprehensive DPR analysis
 */

import React, { useState, useEffect } from 'react';
import { useSimpleStore } from '../store/simpleStore';
import { 
  SPELL_DATABASE, 
  calculateSpellDamage, 
  calculateSpellSaveDC, 
  calculateSpellAttackBonus,
  getAvailableSpells 
} from '../utils/spellCalculations';
import { MonteCarloEngine, type CombatScenario, type MonteCarloResults } from '../engine/monteCarlo';
import { MonteCarloResultsComponent } from '../components/results/MonteCarloResults';
import { ResourceManager } from '../utils/resourceManagement';

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
  spellDamage?: {
    weaponDPR: number;
    spellDPR: number;
    combinedDPR: number;
    bestSpells: Array<{
      name: string;
      damage: number;
      type: 'attack' | 'save';
    }>;
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
  
  // Monte Carlo state
  const [showMonteCarloModal, setShowMonteCarloModal] = useState<boolean>(false);
  const [monteCarloResults, setMonteCarloResults] = useState<MonteCarloResults | null>(null);
  const [isRunningMonteCarlo, setIsRunningMonteCarlo] = useState<boolean>(false);
  const [monteCarloProgress, setMonteCarloProgress] = useState<number>(0);

  // Resource management state
  const [showResourceManager, setShowResourceManager] = useState<boolean>(false);
  const [resourceManagers, setResourceManagers] = useState<Record<string, ResourceManager>>({});
  const [encountersRemaining, setEncountersRemaining] = useState<number>(6);
  const [currentEncounter, setCurrentEncounter] = useState<number>(1);

  // Calculate critical hit chance based on build features
  const calculateCritChance = (build: any, advantageState: 'normal' | 'advantage' | 'disadvantage'): number => {
    if (!build) return 0.05;
    
    // Default crit range (20 only)
    let critRange = 1;
    
    // Check for Champion Fighter expanded crit range
    if (build.classLevels) {
      const fighterLevel = build.classLevels.find((cl: any) => cl.class.toLowerCase() === 'fighter')?.level || 0;
      if (build.featureSelections) {
        const hasChampion = Object.values(build.featureSelections).some((selection: any) => 
          selection.selections && selection.selections.includes('champion')
        );
        
        if (hasChampion) {
          if (fighterLevel >= 15) critRange = 3; // 18-20 (Superior Critical)
          else if (fighterLevel >= 3) critRange = 2; // 19-20 (Improved Critical)
        }
      }
    }
    
    const baseCritChance = critRange / 20;
    
    // Check for Elven Accuracy
    const hasElvenAccuracy = build.featureSelections && 
      Object.values(build.featureSelections).some((selection: any) => 
        selection.improvements?.feat === 'elven-accuracy'
      );
    
    if (advantageState === 'advantage') {
      if (hasElvenAccuracy) {
        // Elven Accuracy: Triple advantage for crit fishing
        return 1 - Math.pow(1 - baseCritChance, 3);
      } else {
        // Regular advantage
        return 1 - Math.pow(1 - baseCritChance, 2);
      }
    } else if (advantageState === 'disadvantage') {
      return Math.pow(baseCritChance, 2);
    }
    
    return baseCritChance;
  };

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
      
      // Calculate weapon DPR for each advantage state
      const weaponNormalDPR = normalHitChance * averageDamage;
      const weaponAdvantageDPR = advantageHitChance * averageDamage;
      const weaponDisadvantageDPR = disadvantageHitChance * averageDamage;

      // Calculate spell DPR if build has spells
      let spellDamageData;
      let combinedNormalDPR = weaponNormalDPR;
      let combinedAdvantageDPR = weaponAdvantageDPR;
      let combinedDisadvantageDPR = weaponDisadvantageDPR;
      
      if (build && build.classLevels) {
        const characterLevel = build.level || 1;
        const availableSpells = getAvailableSpells(build, characterLevel);
        
        if (availableSpells.length > 0) {
          const spellSaveDC = calculateSpellSaveDC(build, characterLevel);
          const spellAttackBonus = calculateSpellAttackBonus(build, characterLevel);
          
          let bestSpellDPR = 0;
          const bestSpells: Array<{name: string; damage: number; type: 'attack' | 'save'}> = [];
          
          // Calculate damage for available spells
          availableSpells.forEach(spellName => {
            const spell = SPELL_DATABASE[spellName.toLowerCase()];
            if (spell) {
              const spellSlotLevel = Math.max(spell.level, 1);
              const spellResult = calculateSpellDamage(
                spell, 
                characterLevel, 
                spellSlotLevel, 
                target, 
                spellAttackBonus, 
                spellSaveDC
              );
              
              if (spellResult.averageDamage > bestSpellDPR) {
                bestSpellDPR = spellResult.averageDamage;
              }
              
              bestSpells.push({
                name: spell.name,
                damage: spellResult.averageDamage,
                type: spell.damageType || 'attack'
              });
            }
          });
          
          // Sort spells by damage
          bestSpells.sort((a, b) => b.damage - a.damage);
          bestSpells.splice(3); // Keep only top 3
          
          spellDamageData = {
            weaponDPR: weaponNormalDPR,
            spellDPR: bestSpellDPR,
            combinedDPR: weaponNormalDPR + (bestSpellDPR * 0.3), // Assume spells used 30% of the time
            bestSpells: bestSpells
          };
          
          // Add spell damage to combined DPR (weighted for realistic usage)
          const spellUsageWeight = 0.3; // 30% spell usage assumption
          combinedNormalDPR = weaponNormalDPR + (bestSpellDPR * spellUsageWeight);
          combinedAdvantageDPR = weaponAdvantageDPR + (bestSpellDPR * spellUsageWeight);
          combinedDisadvantageDPR = weaponDisadvantageDPR + (bestSpellDPR * spellUsageWeight);
        }
      }

      // Simulate 3-round combat (with spell consideration)
      const round1DPR = combinedNormalDPR * 1.2; // First round often has buffs/setup
      const round2DPR = combinedNormalDPR; // Sustained
      const round3DPR = combinedNormalDPR * 0.9; // Resources may be depleted
      const totalDPR = round1DPR + round2DPR + round3DPR;
      const sustainedDPR = combinedNormalDPR;

      // Calculate power attack analysis if build exists
      let powerAttackData;
      if (build) {
        const powerAttackAnalysis = getPowerAttackRecommendation(build);
        const powerAttackHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.ac - (attackBonus - 5))) / 20));
        powerAttackData = {
          normalDPR: weaponNormalDPR,
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
        critChance: calculateCritChance(build, 'normal'), // Dynamic crit chance
        advantageStates: {
          normal: combinedNormalDPR,
          advantage: combinedAdvantageDPR,
          disadvantage: combinedDisadvantageDPR,
        },
        powerAttack: powerAttackData,
        spellDamage: spellDamageData,
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

  // Parse damage string into average damage accounting for multiple attacks and features
  const parseDamage = (damage: string): number => {
    try {
      let baseDamage = 0;
      let perAttackExtraDamage = 0;
      let oncePerTurnDamage = 0;
      let attackMultiplier = 1;

      // Check for attack multiplier (e.g., "1d8+5 (×2 attacks)")
      const attackMatch = damage.match(/×(\d+)\s*attacks?\)/);
      if (attackMatch) {
        attackMultiplier = parseInt(attackMatch[1]) || 1;
      }

      // Parse base weapon damage
      if (damage.includes('d')) {
        const match = damage.match(/(\d+)d(\d+)(?:\+(\d+))?(?:\-(\d+))?/);
        if (match) {
          const [, numDice, dieSize, bonus, penalty] = match;
          const diceAverage = parseInt(numDice) * (parseInt(dieSize) + 1) / 2;
          const totalBonus = (parseInt(bonus) || 0) - (parseInt(penalty) || 0);
          baseDamage = diceAverage + totalBonus;
        }
      } else {
        baseDamage = parseFloat(damage) || 0;
      }
      
      // Parse extra damage sources from parentheses
      const extraDamageMatch = damage.match(/\(([^×]+)\)/);
      if (extraDamageMatch) {
        const extraDamageString = extraDamageMatch[1];
        
        // Sneak Attack damage (e.g., "Sneak+3d6/turn") - only once per turn
        const sneakMatch = extraDamageString.match(/Sneak\+(\d+)d6(?:\/turn)?/);
        if (sneakMatch) {
          const sneakDice = parseInt(sneakMatch[1]);
          oncePerTurnDamage += sneakDice * 3.5; // Only added once, not per attack
        }
        
        // Rage damage (e.g., "Rage+2") - applies to each attack
        const rageMatch = extraDamageString.match(/Rage\+(\d+)/);
        if (rageMatch) {
          perAttackExtraDamage += parseInt(rageMatch[1]);
        }
        
        // Divine Smite (e.g., "Smite+2d8") - typically once per turn
        const smiteMatch = extraDamageString.match(/Smite\+(\d+)d8/);
        if (smiteMatch) {
          const smiteDice = parseInt(smiteMatch[1]);
          oncePerTurnDamage += smiteDice * 4.5; // Average of 1d8
        }
        
        // Great Weapon Master/Sharpshooter (e.g., "GWM+10", "SS+10") - applies to each attack
        const powerAttackMatch = extraDamageString.match(/(?:GWM|SS)\+(\d+)/);
        if (powerAttackMatch) {
          perAttackExtraDamage += parseInt(powerAttackMatch[1]);
        }
        
        // Great Weapon Fighting (e.g., "GWF+0.8") - applies to each attack
        const gwfMatch = extraDamageString.match(/GWF\+([\d.]+)/);
        if (gwfMatch) {
          perAttackExtraDamage += parseFloat(gwfMatch[1]);
        }
        
        // Piercer feat (e.g., "Pierce+1d") - applies to each attack
        const pierceMatch = extraDamageString.match(/Pierce\+(\d+)d/);
        if (pierceMatch) {
          perAttackExtraDamage += parseInt(pierceMatch[1]) * 1; // Conservative estimate
        }
        
        // Savage Attacker (e.g., "Savage+0.5d") - applies to each attack
        const savageMatch = extraDamageString.match(/Savage\+([\d.]+)d/);
        if (savageMatch) {
          perAttackExtraDamage += parseFloat(savageMatch[1]) * 4; // Assuming d8 average
        }
      }

      // Calculate total DPR: (base damage + per-attack extras) * attacks + once-per-turn extras
      return (baseDamage + perAttackExtraDamage) * attackMultiplier + oncePerTurnDamage;
    } catch (e) {
      return 8; // Default
    }
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

  // Run Monte Carlo simulation for selected builds
  const runMonteCarloSimulation = async (buildIndex: number) => {
    const buildId = selectedBuilds[buildIndex];
    const build = builds.find(b => b.id === buildId);
    
    if (!build) {
      addNotification({
        type: 'error',
        message: 'Please select a build to run Monte Carlo simulation',
      });
      return;
    }

    setIsRunningMonteCarlo(true);
    setMonteCarloProgress(0);

    try {
      // Convert simple build to full Build interface for Monte Carlo
      const fullBuild: any = {
        id: build.id,
        name: build.name,
        levels: build.classLevels || [{ class: 'Fighter', subclass: '', level: build.level || 1, hitDie: 10 }],
        abilities: build.abilityScores || {
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8
        },
        proficiencyBonus: Math.ceil((build.level || 1) / 4) + 1,
        equipment: build.equipment || { mainHand: null, offHand: null, armor: null },
        features: [],
        spells: [],
        conditions: [],
        policies: {
          smitePolicy: 'optimal' as const,
          oncePerTurnPriority: 'optimal' as const,
          precast: [],
          buffAssumptions: 'moderate' as const,
          powerAttackThresholdEV: 0.5
        },
        spellSlots: {},
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      // Convert target interface
      const combatTarget: any = {
        name: 'Target',
        armorClass: target.ac,
        hitPoints: 100,
        resistances: target.resistances,
        immunities: target.immunities,
        vulnerabilities: target.vulnerabilities
      };

      // Define combat scenario
      const scenario: CombatScenario = {
        rounds: 3,
        encounters: 1,
        restType: 'none',
        enemyActions: [
          {
            name: 'Attack',
            probability: 0.8,
            effect: (state) => {
              // Enemy attacks, might trigger reactions
            }
          }
        ],
        environmental: {
          lighting: 'bright',
          terrain: 'normal',
          cover: 'none'
        }
      };

      const engine = new MonteCarloEngine(12345); // Fixed seed for consistency
      const results = await engine.simulate(fullBuild, combatTarget, scenario, 1000); // 1000 runs for demo

      setMonteCarloResults(results);
      setShowMonteCarloModal(true);
      
      addNotification({
        type: 'success',
        message: `Monte Carlo simulation completed: ${results.runs} runs analyzed`,
      });

    } catch (error) {
      console.error('Monte Carlo simulation error:', error);
      addNotification({
        type: 'error',
        message: 'Monte Carlo simulation failed. Please try again.',
      });
    } finally {
      setIsRunningMonteCarlo(false);
      setMonteCarloProgress(0);
    }
  };

  // Initialize resource managers when builds change
  useEffect(() => {
    const newResourceManagers: Record<string, ResourceManager> = {};
    
    selectedBuilds.forEach((buildId) => {
      if (buildId && builds.length > 0) {
        const build = builds.find(b => b.id === buildId);
        if (build) {
          newResourceManagers[buildId] = new ResourceManager(build);
        }
      }
    });
    
    setResourceManagers(newResourceManagers);
  }, [selectedBuilds, builds]);

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
              <button
                onClick={() => runMonteCarloSimulation(0)}
                disabled={!selectedBuilds[0] || isRunningMonteCarlo}
                className="px-3 py-2 bg-orange-200 text-orange-700 rounded-md hover:bg-orange-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunningMonteCarlo ? 'Running...' : 'Monte Carlo'}
              </button>
              <button
                onClick={() => setShowResourceManager(!showResourceManager)}
                className="px-3 py-2 bg-green-200 text-green-700 rounded-md hover:bg-green-300 text-sm"
              >
                {showResourceManager ? 'Hide' : 'Show'} Resources
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

              {/* Monte Carlo Button */}
              {selectedBuilds[0] && (
                <div className="mt-4">
                  <button
                    onClick={() => runMonteCarloSimulation(0)}
                    disabled={isRunningMonteCarlo}
                    className="w-full px-4 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-md hover:bg-orange-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunningMonteCarlo ? 'Running Simulation...' : '🎲 Run Monte Carlo Analysis'}
                  </button>
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

        {/* Resource Management Panel */}
        {showResourceManager && (
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resource Management & Optimization
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Encounters Remaining:</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={encountersRemaining}
                      onChange={(e) => setEncountersRemaining(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Current Encounter:</label>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{currentEncounter}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {selectedBuilds.map((buildId, index) => {
                  if (!buildId || !resourceManagers[buildId]) return null;

                  const build = builds.find(b => b.id === buildId);
                  const manager = resourceManagers[buildId];
                  const state = manager.getState();
                  const strategy = manager.getResourceStrategy(encountersRemaining, target.ac);
                  const efficiency = manager.getEfficiencyAnalysis();

                  return (
                    <div key={buildId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        {build?.name || `Build ${index + 1}`}
                      </h4>

                      {/* Resource Status */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Resources</h5>
                        <div className="space-y-1 text-xs">
                          {Object.keys(state.maximum.spellSlots).length > 0 && (
                            <div className="flex justify-between">
                              <span>Spell Slots:</span>
                              <span>
                                {Object.entries(state.current.spellSlots)
                                  .filter(([, slots]) => slots > 0)
                                  .map(([level, slots]) => `${slots}×${level}`)
                                  .join(', ') || 'None'}
                              </span>
                            </div>
                          )}
                          {state.maximum.warlockSlots && (
                            <div className="flex justify-between">
                              <span>Warlock Slots:</span>
                              <span>{state.current.warlockSlots?.slots || 0}×{state.current.warlockSlots?.level || 1}</span>
                            </div>
                          )}
                          {state.maximum.sorceryPoints > 0 && (
                            <div className="flex justify-between">
                              <span>Sorcery Points:</span>
                              <span>{state.current.sorceryPoints}/{state.maximum.sorceryPoints}</span>
                            </div>
                          )}
                          {state.maximum.kiPoints > 0 && (
                            <div className="flex justify-between">
                              <span>Ki Points:</span>
                              <span>{state.current.kiPoints}/{state.maximum.kiPoints}</span>
                            </div>
                          )}
                          {state.maximum.rageUses > 0 && (
                            <div className="flex justify-between">
                              <span>Rage Uses:</span>
                              <span>{state.current.rageUses === 999 ? '∞' : state.current.rageUses}/{state.maximum.rageUses === 999 ? '∞' : state.maximum.rageUses}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Strategy Recommendations */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Strategy: <span className="capitalize text-blue-600 dark:text-blue-400">{strategy.strategy}</span>
                        </h5>
                        <div className="space-y-1">
                          {strategy.recommendations.slice(0, 2).map((rec, i) => (
                            <div key={i} className="text-xs text-gray-600 dark:text-gray-400">• {rec}</div>
                          ))}
                        </div>
                      </div>

                      {/* Resource Efficiency */}
                      {efficiency.mostEfficient !== 'None' && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Efficiency</h5>
                          <div className="text-xs space-y-1">
                            <div className="text-green-600 dark:text-green-400">
                              ↑ {efficiency.mostEfficient}: {efficiency.averageEfficiency[efficiency.mostEfficient]?.toFixed(1) || '0'} DPR
                            </div>
                            {efficiency.leastEfficient !== 'None' && efficiency.leastEfficient !== efficiency.mostEfficient && (
                              <div className="text-red-600 dark:text-red-400">
                                ↓ {efficiency.leastEfficient}: {efficiency.averageEfficiency[efficiency.leastEfficient]?.toFixed(1) || '0'} DPR
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Rest Buttons */}
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => {
                            const benefit = manager.takeShortRest();
                            addNotification({
                              type: 'info',
                              message: `Short Rest: ${Object.entries(benefit.resourcesRestored).map(([k,v]) => `${k} +${v}`).join(', ')}`
                            });
                          }}
                          className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >
                          Short Rest
                        </button>
                        <button
                          onClick={() => {
                            const benefit = manager.takeLongRest();
                            addNotification({
                              type: 'success',
                              message: `Long Rest: All resources restored (${benefit.totalValue.toFixed(0)} DPR value)`
                            });
                          }}
                          className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                        >
                          Long Rest
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Global Controls */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        Object.values(resourceManagers).forEach(manager => manager.nextRound());
                        setCurrentEncounter(prev => prev + 1);
                      }}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Next Round
                    </button>
                    <button
                      onClick={() => {
                        Object.values(resourceManagers).forEach(manager => manager.nextEncounter());
                        setCurrentEncounter(prev => prev + 1);
                      }}
                      className="px-3 py-2 bg-yellow-200 text-yellow-700 rounded text-sm hover:bg-yellow-300"
                    >
                      Next Encounter
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {encountersRemaining - currentEncounter + 1} encounters remaining
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monte Carlo Results Modal */}
        {showMonteCarloModal && monteCarloResults && (
          <MonteCarloResultsComponent
            results={monteCarloResults}
            buildName={monteCarloResults.scenario ? 'Selected Build' : 'Unknown Build'}
            onClose={() => {
              setShowMonteCarloModal(false);
              setMonteCarloResults(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
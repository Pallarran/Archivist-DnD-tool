/**
 * Power Attack (Sharpshooter/GWM) advisor component with break-even calculations
 */

import React, { useState, useMemo } from 'react';
import type { Build, Target, CombatContext } from '../../types';
import { 
  analyzePowerAttack, 
  generatePowerAttackRecommendations,
  analyzeAdvantageStates,
  getPowerAttackThresholds,
  type PowerAttackOptions 
} from '../../engine/powerAttack';
import type { AttackSequence } from '../../engine/damage';

interface PowerAttackAdvisorProps {
  build: Build;
  target: Target;
  combat: CombatContext;
  onRecommendationApply?: (recommendation: string) => void;
}

export const PowerAttackAdvisor: React.FC<PowerAttackAdvisorProps> = ({
  build,
  target,
  combat,
  onRecommendationApply,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'sweep' | 'thresholds' | 'buffs'>('current');
  const [acRange, setACRange] = useState<[number, number]>([10, 25]);
  
  // Create attack sequence based on build
  const attackSequence: AttackSequence = useMemo(() => {
    const weapon = build.equipment.mainHand;
    const abilityMod = getAttackAbilityMod(build);
    
    return {
      hitProbability: 0.65, // Will be calculated by power attack analysis
      critProbability: 0.05,
      normalDamage: [{
        name: weapon?.name || 'Unarmed',
        dice: {
          count: weapon?.damage.includes('d') ? parseInt(weapon.damage.split('d')[0]) : 0,
          sides: weapon?.damage.includes('d') ? parseInt(weapon.damage.split('d')[1]) : 4,
          bonus: abilityMod,
          damageType: weapon?.damageType || 'bludgeoning',
        },
        source: 'weapon',
        onCritDouble: true,
        rerollMechanic: 'none',
      }],
      numAttacks: getAttackCount(build),
    };
  }, [build]);

  const attackBonus = useMemo(() => {
    return build.proficiencyBonus + getAttackAbilityMod(build);
  }, [build]);

  // Current analysis
  const currentAnalysis = useMemo(() => {
    const options: PowerAttackOptions = {
      attackBonus,
      targetAC: target.armorClass,
      attackSequence,
      advantageState: combat.advantage,
      target,
    };
    
    return analyzePowerAttack(options);
  }, [attackBonus, target, attackSequence, combat]);

  // AC sweep recommendations
  const sweepRecommendations = useMemo(() => {
    const options: PowerAttackOptions = {
      attackBonus,
      targetAC: 15, // Base AC for sweep
      attackSequence,
      advantageState: combat.advantage,
      target,
      acRange,
    };
    
    return generatePowerAttackRecommendations(options);
  }, [attackBonus, attackSequence, combat, target, acRange]);

  // Advantage state analysis
  const advantageAnalysis = useMemo(() => {
    const options: PowerAttackOptions = {
      attackBonus,
      targetAC: target.armorClass,
      attackSequence,
      target,
    };
    
    return analyzeAdvantageStates(options);
  }, [attackBonus, target, attackSequence]);

  // Threshold recommendations
  const thresholds = useMemo(() => {
    return getPowerAttackThresholds({
      attackBonus,
      attackSequence,
      target,
    });
  }, [attackBonus, attackSequence, target]);

  const tabs = [
    { id: 'current', label: 'Current Analysis', icon: '🎯' },
    { id: 'sweep', label: 'AC Sweep', icon: '📊' },
    { id: 'thresholds', label: 'Thresholds', icon: '📏' },
    { id: 'buffs', label: 'With Buffs', icon: '✨' },
  ] as const;

  const hasSharpshooter = build.features.includes('Sharpshooter');
  const hasGWM = build.features.includes('Great Weapon Master');
  const hasPowerAttackFeat = hasSharpshooter || hasGWM;

  if (!hasPowerAttackFeat) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-600 text-lg mb-2">⚠️ No Power Attack Feat</div>
        <div className="text-yellow-700 mb-4">
          This build doesn't have Sharpshooter or Great Weapon Master. 
          These feats enable the -5 attack / +10 damage power attack option.
        </div>
        <div className="space-y-2 text-sm text-yellow-600">
          <div><strong>Sharpshooter:</strong> For ranged weapon attacks</div>
          <div><strong>Great Weapon Master:</strong> For heavy melee weapon attacks</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {hasSharpshooter ? 'Sharpshooter' : 'Great Weapon Master'} Advisor
          </h2>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentAnalysis.shouldUsePowerAttack
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {currentAnalysis.shouldUsePowerAttack ? '✅ Use Power Attack' : '❌ Don\'t Use Power Attack'}
            </span>
            <span className="text-sm text-gray-500">
              vs AC {target.armorClass}
            </span>
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
        {activeTab === 'current' && (
          <CurrentAnalysis 
            analysis={currentAnalysis}
            build={build}
            target={target}
            combat={combat}
            onRecommendationApply={onRecommendationApply}
          />
        )}

        {activeTab === 'sweep' && (
          <ACSweepAnalysis
            recommendations={sweepRecommendations}
            acRange={acRange}
            onACRangeChange={setACRange}
            currentAC={target.armorClass}
          />
        )}

        {activeTab === 'thresholds' && (
          <ThresholdAnalysis
            thresholds={thresholds}
            advantageAnalysis={advantageAnalysis}
            currentAC={target.armorClass}
            currentAdvantage={combat.advantage}
          />
        )}

        {activeTab === 'buffs' && (
          <BuffAnalysis
            build={build}
            target={target}
            attackSequence={attackSequence}
            baseAttackBonus={attackBonus}
          />
        )}
      </div>
    </div>
  );
};

const CurrentAnalysis: React.FC<{
  analysis: any;
  build: Build;
  target: Target;
  combat: CombatContext;
  onRecommendationApply?: (recommendation: string) => void;
}> = ({ analysis, build, target, combat, onRecommendationApply }) => {
  const dprDifference = analysis.powerAttackDPR - analysis.normalDPR;
  const percentageChange = (dprDifference / analysis.normalDPR) * 100;

  return (
    <div className="space-y-6">
      {/* Main Recommendation */}
      <div className={`p-6 rounded-lg border-2 ${
        analysis.shouldUsePowerAttack
          ? 'border-green-200 bg-green-50'
          : 'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-start">
          <div className="text-4xl mr-4">
            {analysis.shouldUsePowerAttack ? '✅' : '❌'}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-2 ${
              analysis.shouldUsePowerAttack ? 'text-green-900' : 'text-red-900'
            }`}>
              {analysis.shouldUsePowerAttack 
                ? `Use ${build.features.includes('Sharpshooter') ? 'Sharpshooter' : 'Great Weapon Master'}`
                : `Don't Use ${build.features.includes('Sharpshooter') ? 'Sharpshooter' : 'Great Weapon Master'}`}
            </h3>
            <div className={`text-sm ${
              analysis.shouldUsePowerAttack ? 'text-green-800' : 'text-red-800'
            }`}>
              <div className="mb-2">
                Expected DPR change: <span className="font-bold">
                  {dprDifference > 0 ? '+' : ''}{dprDifference.toFixed(1)} ({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
                </span>
              </div>
              <div>
                Break-even AC: <span className="font-bold">{analysis.breakEvenAC}</span>
              </div>
            </div>
            {onRecommendationApply && (
              <button
                onClick={() => onRecommendationApply(analysis.shouldUsePowerAttack ? 'enable' : 'disable')}
                className={`mt-3 px-4 py-2 rounded-md text-sm font-medium ${
                  analysis.shouldUsePowerAttack
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Apply Recommendation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Normal Attacks</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>DPR</span>
              <span className="font-medium">{analysis.normalDPR.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Attack Bonus</span>
              <span>+{build.proficiencyBonus + getAttackAbilityMod(build)}</span>
            </div>
            <div className="flex justify-between">
              <span>Damage Bonus</span>
              <span>+{getAttackAbilityMod(build)}</span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Power Attack</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>DPR</span>
              <span className="font-medium">{analysis.powerAttackDPR.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Attack Bonus</span>
              <span>+{build.proficiencyBonus + getAttackAbilityMod(build) - 5}</span>
            </div>
            <div className="flex justify-between">
              <span>Damage Bonus</span>
              <span>+{getAttackAbilityMod(build) + 10}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Situational Factors */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">💡 Consider These Factors</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <strong>Current AC {target.armorClass}:</strong> 
              {target.armorClass <= analysis.breakEvenAC 
                ? ' Favors power attack' 
                : ' Favors normal attacks'}
            </div>
          </div>
          
          {combat.advantage === 'advantage' && (
            <div className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>Advantage:</strong> Improves power attack viability by increasing hit chance
              </div>
            </div>
          )}
          
          {combat.advantage === 'disadvantage' && (
            <div className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>Disadvantage:</strong> Makes power attack less viable due to reduced accuracy
              </div>
            </div>
          )}

          <div className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <strong>Multiple Attacks:</strong> {getAttackCount(build)} attacks per round
              {getAttackCount(build) > 1 ? ' amplifies the DPR difference' : ''}
            </div>
          </div>

          {target.resistances.length > 0 && (
            <div className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>Resistances:</strong> {target.resistances.join(', ')} - 
                Higher damage per hit becomes more valuable
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ACSweepAnalysis: React.FC<{
  recommendations: any[];
  acRange: [number, number];
  onACRangeChange: (range: [number, number]) => void;
  currentAC: number;
}> = ({ recommendations, acRange, onACRangeChange, currentAC }) => {
  const maxDPR = Math.max(...recommendations.map(r => Math.max(r.normalDPR, r.powerAttackDPR)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Power Attack Performance by AC</h3>
        <div className="flex items-center space-x-2 text-sm">
          <label>AC Range:</label>
          <input
            type="number"
            value={acRange[0]}
            onChange={(e) => onACRangeChange([parseInt(e.target.value), acRange[1]])}
            className="w-16 rounded border-gray-300 text-sm"
            min="1"
            max="30"
          />
          <span>to</span>
          <input
            type="number"
            value={acRange[1]}
            onChange={(e) => onACRangeChange([acRange[0], parseInt(e.target.value)])}
            className="w-16 rounded border-gray-300 text-sm"
            min="1"
            max="30"
          />
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map(({ ac, normalDPR, powerAttackDPR, recommended, advantage }) => {
          const isCurrentAC = ac === currentAC;
          const normalPercent = (normalDPR / maxDPR) * 100;
          const powerPercent = (powerAttackDPR / maxDPR) * 100;

          return (
            <div 
              key={ac} 
              className={`border rounded-lg p-4 ${
                isCurrentAC ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="font-medium text-lg">AC {ac}</span>
                  {isCurrentAC && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Current Target
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    recommended 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {recommended ? 'Use Power Attack' : 'Normal Attacks'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {advantage > 0 ? '+' : ''}{advantage.toFixed(1)} DPR
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Normal Attacks</span>
                  <span className="font-medium">{normalDPR.toFixed(1)} DPR</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${!recommended ? 'bg-blue-500' : 'bg-gray-400'}`}
                    style={{ width: `${normalPercent}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Power Attack</span>
                  <span className="font-medium">{powerAttackDPR.toFixed(1)} DPR</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${recommended ? 'bg-green-500' : 'bg-gray-400'}`}
                    style={{ width: `${powerPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ThresholdAnalysis: React.FC<{
  thresholds: any[];
  advantageAnalysis: any;
  currentAC: number;
  currentAdvantage: string;
}> = ({ thresholds, advantageAnalysis, currentAC, currentAdvantage }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Break-Even Thresholds</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {thresholds.map(({ condition, breakEvenAC, recommendation }) => {
          const isCurrentCondition = 
            (condition === 'Normal' && currentAdvantage === 'normal') ||
            (condition === 'Advantage' && currentAdvantage === 'advantage') ||
            (condition === 'Disadvantage' && currentAdvantage === 'disadvantage') ||
            (condition === 'Elven Accuracy' && currentAdvantage === 'elven-accuracy');

          return (
            <div 
              key={condition}
              className={`p-4 rounded-lg border ${
                isCurrentCondition 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{condition}</h4>
                {isCurrentCondition && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Current
                  </span>
                )}
              </div>
              
              <div className="text-2xl font-bold mb-1">
                AC {breakEvenAC}
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                {recommendation}
              </div>
              
              {isCurrentCondition && (
                <div className={`text-sm font-medium ${
                  currentAC <= breakEvenAC ? 'text-green-600' : 'text-red-600'
                }`}>
                  Current AC {currentAC}: {currentAC <= breakEvenAC ? 'Use Power Attack' : 'Normal Attacks'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Quick Reference</h4>
        <div className="text-sm space-y-2">
          <div>
            <strong>Rule of Thumb:</strong> Use power attack when target AC ≤ your break-even threshold
          </div>
          <div>
            <strong>Advantage helps:</strong> Increases break-even AC by ~3-5 points
          </div>
          <div>
            <strong>Disadvantage hurts:</strong> Decreases break-even AC by ~3-5 points  
          </div>
          <div>
            <strong>Multiple attacks:</strong> Amplifies the benefit/cost of the accuracy trade-off
          </div>
        </div>
      </div>
    </div>
  );
};

const BuffAnalysis: React.FC<{
  build: Build;
  target: Target;
  attackSequence: AttackSequence;
  baseAttackBonus: number;
}> = ({ build, target, attackSequence, baseAttackBonus }) => {
  const commonBuffs = [
    { name: 'Bless', attackBonus: 2.5, damageBonus: 0 }, // ~1d4 average
    { name: 'Bardic Inspiration', attackBonus: 3.5, damageBonus: 0 }, // ~1d6 average  
    { name: 'Guidance', attackBonus: 2.5, damageBonus: 0 },
    { name: 'Magic Weapon +1', attackBonus: 1, damageBonus: 1 },
    { name: 'Magic Weapon +2', attackBonus: 2, damageBonus: 2 },
    { name: 'Archery Fighting Style', attackBonus: 2, damageBonus: 0 },
  ];

  // Simplified buff analysis
  const buffAnalyses = commonBuffs.map(buff => {
    const buffedAttackBonus = baseAttackBonus + buff.attackBonus;
    
    // Simplified power attack analysis with buffs
    const normalHitChance = Math.max(0.05, Math.min(0.95, 
      (21 - (target.armorClass - buffedAttackBonus)) / 20
    ));
    const powerHitChance = Math.max(0.05, Math.min(0.95, 
      (21 - (target.armorClass - (buffedAttackBonus - 5))) / 20
    ));

    const baseDamage = 8 + getAttackAbilityMod(build) + buff.damageBonus;
    const powerDamage = baseDamage + 10;

    const normalDPR = normalHitChance * baseDamage * getAttackCount(build);
    const powerDPR = powerHitChance * powerDamage * getAttackCount(build);

    return {
      ...buff,
      normalDPR,
      powerDPR,
      shouldUsePowerAttack: powerDPR > normalDPR,
      dprGain: powerDPR - normalDPR,
      normalHitChance,
      powerHitChance,
    };
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Power Attack with Buffs</h3>
      
      <div className="text-sm text-gray-600 mb-4">
        How various buffs affect power attack viability against AC {target.armorClass}
      </div>

      <div className="space-y-4">
        {buffAnalyses.map((analysis) => (
          <div key={analysis.name} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{analysis.name}</h4>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                analysis.shouldUsePowerAttack
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {analysis.shouldUsePowerAttack ? 'Use Power Attack' : 'Normal Attacks'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Attack Bonus</div>
                <div className="font-medium">+{analysis.attackBonus}</div>
              </div>
              <div>
                <div className="text-gray-500">Damage Bonus</div>
                <div className="font-medium">+{analysis.damageBonus}</div>
              </div>
              <div>
                <div className="text-gray-500">DPR Change</div>
                <div className={`font-medium ${
                  analysis.dprGain > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analysis.dprGain > 0 ? '+' : ''}{analysis.dprGain.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Hit Chance (Power)</div>
                <div className="font-medium">{(analysis.powerHitChance * 100).toFixed(1)}%</div>
              </div>
            </div>

            {analysis.shouldUsePowerAttack && (
              <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-800">
                💡 This buff makes power attack viable with {analysis.dprGain.toFixed(1)} DPR gain
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Buff Strategy</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• Attack bonuses are most valuable when they push you over break-even thresholds</div>
          <div>• Damage bonuses stack with power attack for multiplicative benefits</div>
          <div>• Consider asking allies for buffs when facing high-AC targets</div>
          <div>• Magic weapons provide both accuracy and damage improvements</div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getAttackCount = (build: Build): number => {
  let attacks = 1;
  
  const fighterLevel = build.levels.find(l => l.class.toLowerCase() === 'fighter')?.level || 0;
  if (fighterLevel >= 5) attacks++;
  if (fighterLevel >= 11) attacks++;
  if (fighterLevel >= 20) attacks++;
  
  const extraAttackClasses = ['paladin', 'ranger', 'barbarian'];
  const hasExtraAttack = build.levels.some(l => 
    extraAttackClasses.includes(l.class.toLowerCase()) && l.level >= 5
  );
  if (hasExtraAttack && attacks === 1) attacks++;
  
  if (build.equipment.offHand) attacks++;
  
  return attacks;
};

const getAttackAbilityMod = (build: Build): number => {
  const weapon = build.equipment.mainHand;
  
  if (weapon?.properties.includes('finesse')) {
    return Math.max(
      Math.floor((build.abilities.strength - 10) / 2),
      Math.floor((build.abilities.dexterity - 10) / 2)
    );
  } else if (weapon?.type === 'ranged') {
    return Math.floor((build.abilities.dexterity - 10) / 2);
  } else {
    return Math.floor((build.abilities.strength - 10) / 2);
  }
};
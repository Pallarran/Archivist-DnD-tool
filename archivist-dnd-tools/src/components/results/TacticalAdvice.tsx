/**
 * Tactical advice and recommendations component
 */

import React from 'react';
import type { DPRCalculationResult } from './DPRResults';

interface TacticalAdviceProps {
  result: DPRCalculationResult;
}

interface TacticalRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'positioning' | 'resources' | 'targeting' | 'timing' | 'equipment';
  title: string;
  description: string;
  impact: string;
  requirements?: string;
}

export const TacticalAdvice: React.FC<TacticalAdviceProps> = ({ result }) => {
  const recommendations = generateRecommendations(result);
  
  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  const lowPriority = recommendations.filter(r => r.priority === 'low');

  const categoryIcons = {
    positioning: '📍',
    resources: '⚡',
    targeting: '🎯',
    timing: '⏰',
    equipment: '⚔️',
  };

  const priorityColors = {
    high: 'border-red-200 bg-red-50 text-red-800',
    medium: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    low: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Tactical Recommendations</h3>
        <div className="text-sm text-gray-600">
          Based on current build vs AC {result.target.armorClass}
        </div>
      </div>

      {/* High Priority Recommendations */}
      {highPriority.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-red-800 mb-3 flex items-center">
            <span className="mr-2">🔥</span>
            High Impact Recommendations
          </h4>
          <div className="space-y-3">
            {highPriority.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Recommendations */}
      {mediumPriority.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-yellow-800 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            Optimization Opportunities
          </h4>
          <div className="space-y-3">
            {mediumPriority.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority Recommendations */}
      {lowPriority.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center">
            <span className="mr-2">📋</span>
            General Tips
          </h4>
          <div className="space-y-3">
            {lowPriority.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg mb-2">🎯 Excellent optimization!</div>
          <div className="text-sm">Your build appears to be well-optimized for the current scenario.</div>
        </div>
      )}

      {/* Power Attack Analysis */}
      {result.powerAttack && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Power Attack Analysis</h4>
          <div className={`p-3 rounded border ${
            result.powerAttack.recommended 
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-start">
              <span className="text-2xl mr-3">
                {result.powerAttack.recommended ? '✅' : '❌'}
              </span>
              <div className="flex-1">
                <div className="font-medium mb-1">
                  {result.powerAttack.recommended 
                    ? 'Use Sharpshooter/Great Weapon Master' 
                    : 'Don\'t use Sharpshooter/Great Weapon Master'}
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    Normal DPR: <span className="font-medium">{result.powerAttack.normalDPR.toFixed(1)}</span>
                  </div>
                  <div>
                    Power Attack DPR: <span className="font-medium">{result.powerAttack.powerAttackDPR.toFixed(1)}</span>
                  </div>
                  <div>
                    Break-even AC: <span className="font-medium">{result.powerAttack.breakEvenAC}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  {result.powerAttack.recommended 
                    ? `Use power attack against targets with AC ${result.powerAttack.breakEvenAC} or lower.`
                    : `Switch to power attack once target AC drops to ${result.powerAttack.breakEvenAC} or lower.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advantage State Recommendations */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">Advantage Opportunities</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-blue-800 mb-2">Gaining Advantage</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Position for flanking with allies</li>
              <li>• Use Hide action for unseen attacks</li>
              <li>• Target prone enemies with melee attacks</li>
              <li>• Look for restrained or paralyzed targets</li>
            </ul>
          </div>
          <div>
            <h5 className="text-sm font-medium text-blue-800 mb-2">Avoiding Disadvantage</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Stay out of enemy reach when using ranged weapons</li>
              <li>• Avoid attacking prone targets with ranged weapons</li>
              <li>• Consider movement to avoid heavily obscured areas</li>
              <li>• Use light sources in darkness</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resource Management */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-3">Resource Management</h4>
        <div className="space-y-2 text-sm text-purple-800">
          {Object.entries(result.resourceUsage.spellSlots)
            .filter(([_, count]) => count > 0)
            .map(([level, count]) => (
              <div key={level} className="flex justify-between">
                <span>Level {level} Spell Slots</span>
                <span>{count} used per encounter</span>
              </div>
            ))}
          
          {Object.values(result.resourceUsage.spellSlots).every(count => count === 0) && (
            <div className="text-purple-700">
              No spell slot usage detected. Consider incorporating spells for additional damage or utility.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RecommendationCard: React.FC<{ recommendation: TacticalRecommendation }> = ({ 
  recommendation 
}) => {
  const categoryIcons = {
    positioning: '📍',
    resources: '⚡',
    targeting: '🎯',
    timing: '⏰',
    equipment: '⚔️',
  };

  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50',
  };

  return (
    <div className={`border rounded-lg p-4 ${priorityColors[recommendation.priority]}`}>
      <div className="flex items-start">
        <span className="text-xl mr-3">{categoryIcons[recommendation.category]}</span>
        <div className="flex-1">
          <h5 className="font-medium mb-1">{recommendation.title}</h5>
          <p className="text-sm mb-2">{recommendation.description}</p>
          <div className="text-sm">
            <span className="font-medium">Impact:</span> {recommendation.impact}
          </div>
          {recommendation.requirements && (
            <div className="text-sm mt-1">
              <span className="font-medium">Requirements:</span> {recommendation.requirements}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const generateRecommendations = (result: DPRCalculationResult): TacticalRecommendation[] => {
  const recommendations: TacticalRecommendation[] = [];
  const { build, target, combat, dpr, hitChances, powerAttack } = result;

  // Low hit chance recommendations
  if (hitChances.normal < 0.5) {
    recommendations.push({
      priority: 'high',
      category: 'positioning',
      title: 'Improve Attack Accuracy',
      description: 'Your hit chance is quite low against this target. Consider gaining advantage or targeting easier opponents.',
      impact: `Could increase DPR by ${((dpr.conditions.advantage - dpr.conditions.normal) * 100 / dpr.conditions.normal).toFixed(0)}%`,
      requirements: 'Flanking position or advantage-granting abilities',
    });
  }

  // Power attack suboptimal
  if (powerAttack && !powerAttack.recommended && powerAttack.normalDPR > powerAttack.powerAttackDPR) {
    const dprLoss = powerAttack.normalDPR - powerAttack.powerAttackDPR;
    if (dprLoss > 1) {
      recommendations.push({
        priority: 'high',
        category: 'resources',
        title: 'Disable Power Attack',
        description: 'Power attack is reducing your DPR against this target. Switch to normal attacks for better performance.',
        impact: `+${dprLoss.toFixed(1)} DPR increase`,
      });
    }
  }

  // Underused spell slots
  if (Object.values(result.resourceUsage.spellSlots).every(count => count === 0)) {
    const hasSpellSlots = Object.entries(build.spellSlots).some(([_, count]) => count > 0);
    if (hasSpellSlots) {
      recommendations.push({
        priority: 'medium',
        category: 'resources',
        title: 'Consider Using Spell Slots',
        description: 'You have unused spell slots that could enhance damage output through smites, spell attacks, or buffs.',
        impact: 'Potential for significant DPR increase',
        requirements: 'Available spell slots and appropriate spells',
      });
    }
  }

  // No once-per-turn effects
  if (dpr.breakdown.oncePerTurn === 0) {
    const hasRogue = build.levels.some(l => l.class.toLowerCase() === 'rogue');
    const hasPaladin = build.levels.some(l => l.class.toLowerCase() === 'paladin');
    
    if (hasRogue || hasPaladin) {
      recommendations.push({
        priority: 'medium',
        category: 'timing',
        title: 'Activate Once-Per-Turn Features',
        description: 'You have once-per-turn damage features that aren\'t being utilized. Ensure you\'re meeting their conditions.',
        impact: 'Could add 3-10+ damage per round',
        requirements: hasRogue ? 'Advantage or finesse weapon' : 'Spell slots for Divine Smite',
      });
    }
  }

  // Weapon optimization
  if (build.equipment.mainHand) {
    const weapon = build.equipment.mainHand;
    const isRanged = weapon.type === 'ranged';
    const hasArcheryStyle = build.fightingStyles?.includes('Archery');
    
    if (isRanged && !hasArcheryStyle) {
      recommendations.push({
        priority: 'low',
        category: 'equipment',
        title: 'Consider Archery Fighting Style',
        description: 'Archery fighting style would provide +2 to ranged attack rolls, significantly improving accuracy.',
        impact: 'Improved hit chance and DPR',
        requirements: 'Fighter, Paladin, or Ranger class',
      });
    }
  }

  // Dual wielding without TWF style
  if (build.equipment.offHand && !build.fightingStyles?.includes('Two-Weapon Fighting')) {
    recommendations.push({
      priority: 'low',
      category: 'equipment',
      title: 'Two-Weapon Fighting Style',
      description: 'You\'re dual wielding but not adding ability modifier to off-hand damage. TWF style would help.',
      impact: `+${Math.floor((build.abilities.strength - 10) / 2) || Math.floor((build.abilities.dexterity - 10) / 2)} damage per off-hand hit`,
      requirements: 'Fighter or Ranger class',
    });
  }

  // Target has resistances
  if (target.resistances.length > 0) {
    const weaponType = build.equipment.mainHand?.damageType || 'physical';
    if (target.resistances.includes(weaponType)) {
      recommendations.push({
        priority: 'high',
        category: 'equipment',
        title: 'Switch Damage Type',
        description: `Target resists ${weaponType} damage. Consider using a different weapon or magical damage.`,
        impact: 'Double current damage output',
        requirements: 'Alternative weapon or magical damage source',
      });
    }
  }

  // Combat positioning
  if (combat.cover === 'partial') {
    recommendations.push({
      priority: 'medium',
      category: 'positioning',
      title: 'Avoid Cover Penalties',
      description: 'Target has partial cover, imposing -2 to attack rolls. Reposition for a clear shot.',
      impact: '+10% hit chance improvement',
      requirements: 'Movement to different angle',
    });
  }

  // Advantage opportunities
  if (combat.advantage === 'normal' && hitChances.advantage > hitChances.normal * 1.2) {
    recommendations.push({
      priority: 'medium',
      category: 'positioning',
      title: 'Seek Advantage',
      description: 'Gaining advantage would significantly improve your performance against this target.',
      impact: `+${((dpr.conditions.advantage - dpr.conditions.normal) * 100 / dpr.conditions.normal).toFixed(0)}% DPR increase`,
      requirements: 'Flanking, hiding, or ally assistance',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};
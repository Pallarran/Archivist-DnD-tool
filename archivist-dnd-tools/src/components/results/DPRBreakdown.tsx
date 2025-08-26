/**
 * Detailed DPR breakdown component showing damage sources and calculations
 */

import React, { useState } from 'react';
import type { DPRCalculationResult } from './DPRResults';
import type { Build } from '../../types/build';

interface DPRBreakdownProps {
  result: DPRCalculationResult;
}

export const DPRBreakdown: React.FC<DPRBreakdownProps> = ({ result }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['weapon']));
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const { dpr, build, target, hitChances, critChances } = result;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Detailed Breakdown</h3>
        <div className="text-sm text-gray-600">
          Total: <span className="font-bold text-lg text-blue-600">{dpr.total.toFixed(1)} DPR</span>
        </div>
      </div>

      {/* Round-by-round Analysis */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <button
          onClick={() => toggleSection('rounds')}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="font-medium text-gray-900">Round-by-Round Analysis</h4>
          <span className={`transform transition-transform ${
            expandedSections.has('rounds') ? 'rotate-180' : ''
          }`}>▼</span>
        </button>
        
        {expandedSections.has('rounds') && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-8 gap-2 text-xs font-medium text-gray-700 mb-2">
              <div>Round</div>
              <div>DPR</div>
              <div>Hit%</div>
              <div>Crit%</div>
              <div>Weapon</div>
              <div>Features</div>
              <div>Spells</div>
              <div>Resources</div>
            </div>
            
            {dpr.byRound.map((roundDPR, index) => (
              <div key={index} className="grid grid-cols-8 gap-2 text-xs text-gray-600 py-1 border-b border-gray-200">
                <div className="font-medium">{index + 1}</div>
                <div className="font-medium text-blue-600">{roundDPR.toFixed(1)}</div>
                <div>{(hitChances.normal * 100).toFixed(0)}%</div>
                <div>{(critChances.normal * 100).toFixed(1)}%</div>
                <div>{dpr.breakdown.weaponDamage.toFixed(1)}</div>
                <div>{dpr.breakdown.oncePerTurn.toFixed(1)}</div>
                <div>{dpr.breakdown.spellDamage.toFixed(1)}</div>
                <div className="text-xs">
                  {Object.entries(result.resourceUsage.spellSlots)
                    .filter(([_, count]) => count > 0)
                    .map(([level, count]) => `${count}×L${level}`)
                    .join(', ')
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weapon Damage */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('weapon')}
          className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
        >
          <div className="flex items-center">
            <h4 className="font-medium text-gray-900">Weapon Attacks</h4>
            <span className="ml-2 text-sm font-bold text-blue-600">
              {dpr.breakdown.weaponDamage.toFixed(1)} DPR
            </span>
          </div>
          <span className={`transform transition-transform ${
            expandedSections.has('weapon') ? 'rotate-180' : ''
          }`}>▼</span>
        </button>
        
        {expandedSections.has('weapon') && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Main Hand</div>
                <div className="text-sm font-medium">
                  {build.equipment.mainHand?.name || 'Unarmed'}
                </div>
                <div className="text-xs text-gray-600">
                  {build.equipment.mainHand?.damage} {build.equipment.mainHand?.damageType}
                </div>
              </div>
              
              {build.equipment.offHand && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Off Hand</div>
                  <div className="text-sm font-medium">{build.equipment.offHand.name}</div>
                  <div className="text-xs text-gray-600">
                    {build.equipment.offHand.damage} {build.equipment.offHand.damageType}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Attacks/Round</div>
                <div className="text-sm font-medium">
                  {getAttackCount(build)} attacks
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Ability Mod</div>
                <div className="text-sm font-medium">
                  +{getAttackAbilityMod(build)}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
              <div className="font-medium text-blue-900 mb-1">Calculation</div>
              <div className="text-blue-800">
                {getAttackCount(build)} attacks × {(hitChances.normal * 100).toFixed(1)}% hit × {getAverageWeaponDamage(build).toFixed(1)} avg damage
                = {dpr.breakdown.weaponDamage.toFixed(1)} DPR
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Once-per-turn Effects */}
      {dpr.breakdown.oncePerTurn > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('onceturn')}
            className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center">
              <h4 className="font-medium text-gray-900">Once-per-Turn Effects</h4>
              <span className="ml-2 text-sm font-bold text-green-600">
                {dpr.breakdown.oncePerTurn.toFixed(1)} DPR
              </span>
            </div>
            <span className={`transform transition-transform ${
              expandedSections.has('onceturn') ? 'rotate-180' : ''
            }`}>▼</span>
          </button>
          
          {expandedSections.has('onceturn') && result.oncePerTurnAnalysis && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Selected: {result.oncePerTurnAnalysis.selectedEffect}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {result.oncePerTurnAnalysis.reasoning}
                  </div>
                </div>
                
                {result.oncePerTurnAnalysis.alternatives.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                      Other Available Effects
                    </div>
                    <div className="space-y-1">
                      {result.oncePerTurnAnalysis.alternatives.map((alt, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">{alt.name}</span>
                          <span className="text-gray-500">{alt.damage.toFixed(1)} avg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spell Damage */}
      {dpr.breakdown.spellDamage > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('spells')}
            className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center">
              <h4 className="font-medium text-gray-900">Spell Damage</h4>
              <span className="ml-2 text-sm font-bold text-purple-600">
                {dpr.breakdown.spellDamage.toFixed(1)} DPR
              </span>
            </div>
            <span className={`transform transition-transform ${
              expandedSections.has('spells') ? 'rotate-180' : ''
            }`}>▼</span>
          </button>
          
          {expandedSections.has('spells') && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  Active spells and spell attacks contributing to DPR
                </div>
                
                {build.policies.precast.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Pre-cast Spells
                    </div>
                    <div className="text-sm text-gray-700">
                      {build.policies.precast.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Target Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Target Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Armor Class</div>
            <div className="font-medium">{target.armorClass}</div>
          </div>
          <div>
            <div className="text-gray-500">Hit Points</div>
            <div className="font-medium">
              {target.currentHP ? `${target.currentHP}/${target.maxHP}` : target.maxHP || 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Type</div>
            <div className="font-medium capitalize">{target.type || 'Unknown'}</div>
          </div>
          <div>
            <div className="text-gray-500">Size</div>
            <div className="font-medium capitalize">{target.size || 'Medium'}</div>
          </div>
        </div>
        
        {(target.resistances.length > 0 || target.immunities.length > 0 || target.vulnerabilities.length > 0) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {target.resistances.length > 0 && (
                <div>
                  <div className="text-orange-600 font-medium">Resistances</div>
                  <div className="text-gray-700">{target.resistances.join(', ')}</div>
                </div>
              )}
              {target.immunities.length > 0 && (
                <div>
                  <div className="text-red-600 font-medium">Immunities</div>
                  <div className="text-gray-700">{target.immunities.join(', ')}</div>
                </div>
              )}
              {target.vulnerabilities.length > 0 && (
                <div>
                  <div className="text-green-600 font-medium">Vulnerabilities</div>
                  <div className="text-gray-700">{target.vulnerabilities.join(', ')}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Attack Modifiers */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">Attack Calculations</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex justify-between">
            <span>Proficiency Bonus</span>
            <span>+{build.proficiencyBonus}</span>
          </div>
          <div className="flex justify-between">
            <span>Ability Modifier</span>
            <span>+{getAttackAbilityMod(build)}</span>
          </div>
          <div className="flex justify-between">
            <span>Magic Weapon Bonus</span>
            <span>+0</span> {/* TODO: Calculate from equipment */}
          </div>
          <div className="border-t border-blue-200 pt-2 flex justify-between font-medium">
            <span>Total Attack Bonus</span>
            <span>+{build.proficiencyBonus + getAttackAbilityMod(build)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getAttackCount = (build: Build): number => {
  let attacks = 1;
  
  // Fighter Extra Attack
  const fighterLevel = build.levels.find(l => l.class.toLowerCase() === 'fighter')?.level || 0;
  if (fighterLevel >= 5) attacks++;
  if (fighterLevel >= 11) attacks++;
  if (fighterLevel >= 20) attacks++;
  
  // Other classes with Extra Attack
  const extraAttackClasses = ['paladin', 'ranger', 'barbarian'];
  const hasExtraAttack = build.levels.some(l => 
    extraAttackClasses.includes(l.class.toLowerCase()) && l.level >= 5
  );
  if (hasExtraAttack && attacks === 1) attacks++;
  
  // Dual wielding bonus action attack
  if (build.equipment.offHand) attacks++;
  
  return attacks;
};

const getAttackAbilityMod = (build: Build): number => {
  // Determine primary attack ability based on weapon
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

const getAverageWeaponDamage = (build: Build): number => {
  // Simplified calculation - would be more complex in practice
  const weapon = build.equipment.mainHand;
  if (!weapon) return 1; // Unarmed
  
  // Parse damage dice (simplified)
  const diceMatch = weapon.damage.match(/(\d+)d(\d+)/);
  if (diceMatch) {
    const [, count, sides] = diceMatch;
    const diceAverage = parseInt(count) * (parseInt(sides) + 1) / 2;
    const abilityMod = getAttackAbilityMod(build);
    return diceAverage + abilityMod;
  }
  
  return 5; // Fallback
};
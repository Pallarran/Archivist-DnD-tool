/**
 * Policy configuration form for automated decision making
 */

import React from 'react';
import type { Build } from '../../types';

interface PolicyFormProps {
  policies: Build['policies'];
  onChange: (policies: Build['policies']) => void;
}

export const PolicyForm: React.FC<PolicyFormProps> = ({
  policies,
  onChange,
}) => {
  const updatePolicy = <K extends keyof Build['policies']>(
    key: K,
    value: Build['policies'][K]
  ) => {
    onChange({ ...policies, [key]: value });
  };

  const updatePrecastSpells = (spells: string[]) => {
    updatePolicy('precast', spells);
  };

  const commonPrecastSpells = [
    'Hunter\'s Mark',
    'Hex',
    'Bless',
    'Faerie Fire',
    'Spiritual Weapon',
    'Spirit Guardians',
    'Haste',
    'Greater Invisibility',
    'Holy Weapon',
    'Summon Celestial',
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Combat Policies</h3>
      <p className="text-sm text-gray-600">
        Configure how the simulator makes tactical decisions during combat.
      </p>

      {/* Divine Smite Policy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Divine Smite Usage
        </label>
        <select
          value={policies.smitePolicy}
          onChange={(e) => updatePolicy('smitePolicy', e.target.value as any)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="never">Never use Divine Smite</option>
          <option value="onCrit">Only on critical hits</option>
          <option value="optimal">Use when optimal (EV calculation)</option>
          <option value="always">Always use when available</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {policies.smitePolicy === 'never' && 'Divine Smite will not be used, conserving spell slots.'}
          {policies.smitePolicy === 'onCrit' && 'Divine Smite will only be used on critical hits for maximum damage.'}
          {policies.smitePolicy === 'optimal' && 'Divine Smite will be used when it provides positive expected value.'}
          {policies.smitePolicy === 'always' && 'Divine Smite will be used on every hit until spell slots are exhausted.'}
        </p>
      </div>

      {/* Once-per-turn Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Once-per-turn Effect Priority
        </label>
        <select
          value={policies.oncePerTurnPriority}
          onChange={(e) => updatePolicy('oncePerTurnPriority', e.target.value as any)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="optimal">Use optimally</option>
          <option value="always">Always use when available</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {policies.oncePerTurnPriority === 'optimal' && 
            'Effects like Sneak Attack will be applied to the optimal attack each turn.'}
          {policies.oncePerTurnPriority === 'always' && 
            'Effects will be used on every qualifying attack when available.'}
        </p>
      </div>

      {/* Buff Assumptions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buff Assumptions
        </label>
        <select
          value={policies.buffAssumptions}
          onChange={(e) => updatePolicy('buffAssumptions', e.target.value as any)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="none">No external buffs</option>
          <option value="conservative">Conservative buffs (Bless, etc.)</option>
          <option value="moderate">Moderate buffs (Haste, Advantage)</option>
          <option value="optimal">Optimal buffs (All available)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {policies.buffAssumptions === 'none' && 'No party buffs or situational advantages assumed.'}
          {policies.buffAssumptions === 'conservative' && 'Basic party buffs like Bless assumed available.'}
          {policies.buffAssumptions === 'moderate' && 'Common buffs like Haste and tactical advantage assumed.'}
          {policies.buffAssumptions === 'optimal' && 'All beneficial buffs and situations assumed when possible.'}
        </p>
      </div>

      {/* Precast Spells */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pre-Combat Spells
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {commonPrecastSpells.map((spell) => (
            <div key={spell} className="flex items-center">
              <input
                id={`precast-${spell}`}
                type="checkbox"
                checked={policies.precast.includes(spell)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updatePrecastSpells([...policies.precast, spell]);
                  } else {
                    updatePrecastSpells(policies.precast.filter(s => s !== spell));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`precast-${spell}`} className="ml-2 text-sm text-gray-700">
                {spell}
              </label>
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Spells assumed to be active at the start of combat. These affect damage calculations and resource usage.
        </p>
      </div>

      {/* Power Attack Policy */}
      <div className="p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Power Attack Settings</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sharpshooter/GWM Threshold
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                defaultValue="0.5"
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-12">0.5 DPR</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Minimum expected DPR gain required to use power attack
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Policies */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Advanced Combat Decisions</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center">
            <input
              id="conserve-resources"
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="conserve-resources" className="ml-2 text-blue-700">
              Conserve resources for later encounters
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="opportunity-attacks"
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="opportunity-attacks" className="ml-2 text-blue-700">
              Account for opportunity attacks in positioning
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="saving-throws"
              type="checkbox"
              defaultChecked
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="saving-throws" className="ml-2 text-blue-700">
              Consider save-or-suck spells vs pure damage
            </label>
          </div>
        </div>
      </div>

      {/* Policy Summary */}
      <div className="p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Policy Summary</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            <strong>Resource Usage:</strong> {
              policies.smitePolicy === 'never' ? 'Conservative' :
              policies.smitePolicy === 'onCrit' ? 'Moderate' :
              policies.smitePolicy === 'optimal' ? 'Calculated' : 'Aggressive'
            }
          </div>
          <div>
            <strong>Tactical Approach:</strong> {
              policies.oncePerTurnPriority === 'optimal' ? 'Optimized' : 'Aggressive'
            }
          </div>
          <div>
            <strong>Party Synergy:</strong> {
              policies.buffAssumptions === 'none' ? 'Solo play' :
              policies.buffAssumptions === 'conservative' ? 'Basic teamwork' :
              policies.buffAssumptions === 'moderate' ? 'Good coordination' : 'Perfect synergy'
            }
          </div>
          {policies.precast.length > 0 && (
            <div>
              <strong>Pre-combat Prep:</strong> {policies.precast.length} spell(s) active
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
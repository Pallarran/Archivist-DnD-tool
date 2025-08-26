/**
 * Combat context configuration form component
 */

import React from 'react';
import type { CombatContext } from '../../types';

interface CombatContextFormProps {
  combat: CombatContext;
  onChange: (combat: CombatContext) => void;
}

export const CombatContextForm: React.FC<CombatContextFormProps> = ({
  combat,
  onChange,
}) => {
  const updateCombat = <K extends keyof CombatContext>(key: K, value: CombatContext[K]) => {
    onChange({ ...combat, [key]: value });
  };

  const toggleCondition = (condition: string, field: 'targetActions' | 'targetConditions') => {
    const current = combat[field];
    const updated = current.includes(condition)
      ? current.filter(c => c !== condition)
      : [...current, condition];
    updateCombat(field, updated);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Combat Context</h2>
      
      <div className="space-y-4">
        {/* Advantage State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Advantage State
          </label>
          <div className="space-y-2">
            {[
              { value: 'normal', label: 'Normal' },
              { value: 'advantage', label: 'Advantage' },
              { value: 'disadvantage', label: 'Disadvantage' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="radio"
                  name="advantage"
                  value={value}
                  checked={combat.advantage === value}
                  onChange={(e) => updateCombat('advantage', e.target.value as any)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Positioning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover
            </label>
            <select
              value={combat.cover}
              onChange={(e) => updateCombat('cover', e.target.value as any)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="none">No Cover</option>
              <option value="half">Half Cover (+2 AC)</option>
              <option value="three-quarters">Three-Quarters Cover (+5 AC)</option>
              <option value="full">Full Cover (no attack)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Range
            </label>
            <select
              value={combat.range}
              onChange={(e) => updateCombat('range', e.target.value as any)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="normal">Normal Range</option>
              <option value="long">Long Range (disadvantage)</option>
              <option value="point-blank">Point-Blank (within 5 ft)</option>
            </select>
          </div>
        </div>

        {/* Environmental Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lighting
          </label>
          <select
            value={combat.lighting}
            onChange={(e) => updateCombat('lighting', e.target.value as any)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="bright">Bright Light</option>
            <option value="dim">Dim Light</option>
            <option value="darkness">Darkness</option>
          </select>
        </div>

        {/* Tactical Factors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tactical Positioning
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={combat.flanking}
                onChange={(e) => updateCombat('flanking', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Flanking (advantage with ally opposite)
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={combat.hidden}
                onChange={(e) => updateCombat('hidden', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Hidden/Unseen attacker (advantage)
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={combat.allyWithin5ft}
                onChange={(e) => updateCombat('allyWithin5ft', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Ally within 5 ft of target
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={combat.recklessAttack}
                onChange={(e) => updateCombat('recklessAttack', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Reckless Attack (Barbarian, advantage but enemies get advantage)
              </span>
            </label>
          </div>
        </div>

        {/* Target Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Actions
          </label>
          <div className="space-y-2">
            {[
              { value: 'dodge', label: 'Dodge Action (attackers have disadvantage)' },
              { value: 'help', label: 'Help Action (helps ally)' },
              { value: 'hide', label: 'Hide Action' },
              { value: 'dash', label: 'Dash Action (double movement)' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={combat.targetActions.includes(value)}
                  onChange={() => toggleCondition(value, 'targetActions')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Target Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Conditions (affecting attacks against them)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { value: 'blinded', label: 'Blinded (attackers have advantage)' },
              { value: 'prone', label: 'Prone (melee advantage, ranged disadvantage)' },
              { value: 'restrained', label: 'Restrained (attackers have advantage)' },
              { value: 'stunned', label: 'Stunned (attackers have advantage)' },
              { value: 'paralyzed', label: 'Paralyzed (attackers have advantage)' },
              { value: 'unconscious', label: 'Unconscious (attackers have advantage)' },
              { value: 'incapacitated', label: 'Incapacitated' },
              { value: 'invisible', label: 'Invisible (attackers have disadvantage)' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={combat.targetConditions.includes(value)}
                  onChange={() => toggleCondition(value, 'targetConditions')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Scenario Presets */}
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Common Scenarios
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({
                advantage: 'normal',
                cover: 'none',
                range: 'normal',
                lighting: 'bright',
                flanking: false,
                hidden: false,
                recklessAttack: false,
                allyWithin5ft: false,
                targetActions: [],
                targetConditions: [],
              })}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Clear All
            </button>
            
            <button
              type="button"
              onClick={() => onChange({
                ...combat,
                advantage: 'advantage',
                flanking: true,
                allyWithin5ft: true,
              })}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Flanking
            </button>
            
            <button
              type="button"
              onClick={() => onChange({
                ...combat,
                advantage: 'advantage',
                hidden: true,
              })}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Stealth Attack
            </button>
            
            <button
              type="button"
              onClick={() => onChange({
                ...combat,
                advantage: 'advantage',
                targetConditions: ['prone'],
              })}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              Prone Target
            </button>
            
            <button
              type="button"
              onClick={() => onChange({
                ...combat,
                advantage: 'disadvantage',
                cover: 'half',
                lighting: 'dim',
              })}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Difficult Conditions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
/**
 * Target configuration form component
 */

import React from 'react';
import type { Target } from '../../types';

interface TargetFormProps {
  target: Target;
  onChange: (target: Target) => void;
}

const CREATURE_TYPES = [
  'aberration', 'beast', 'celestial', 'construct', 'dragon', 'elemental',
  'fey', 'fiend', 'giant', 'humanoid', 'monstrosity', 'ooze', 'plant', 'undead'
] as const;

const CREATURE_SIZES = [
  'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'
] as const;

const DAMAGE_TYPES = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic',
  'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'
] as const;

const COMMON_CONDITIONS = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
  'prone', 'restrained', 'stunned', 'unconscious'
] as const;

export const TargetForm: React.FC<TargetFormProps> = ({ target, onChange }) => {
  const updateTarget = <K extends keyof Target>(key: K, value: Target[K]) => {
    onChange({ ...target, [key]: value });
  };

  const toggleDamageType = (damageType: string, category: 'resistances' | 'immunities' | 'vulnerabilities') => {
    const current = target[category];
    const updated = current.includes(damageType)
      ? current.filter(type => type !== damageType)
      : [...current, damageType];
    updateTarget(category, updated);
  };

  const toggleCondition = (condition: string) => {
    const current = target.conditions || [];
    const updated = current.includes(condition)
      ? current.filter(c => c !== condition)
      : [...current, condition];
    updateTarget('conditions', updated);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Target Configuration</h2>
      
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={target.name}
              onChange={(e) => updateTarget('name', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Generic Enemy"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Armor Class
            </label>
            <input
              type="number"
              value={target.armorClass}
              onChange={(e) => updateTarget('armorClass', parseInt(e.target.value) || 10)}
              min="1"
              max="30"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max HP
            </label>
            <input
              type="number"
              value={target.maxHP || ''}
              onChange={(e) => updateTarget('maxHP', parseInt(e.target.value) || undefined)}
              min="1"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current HP
            </label>
            <input
              type="number"
              value={target.currentHP || ''}
              onChange={(e) => updateTarget('currentHP', parseInt(e.target.value) || undefined)}
              min="0"
              max={target.maxHP || 999}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size
            </label>
            <select
              value={target.size || 'medium'}
              onChange={(e) => updateTarget('size', e.target.value as any)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {CREATURE_SIZES.map(size => (
                <option key={size} value={size}>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Creature Type
          </label>
          <select
            value={target.type || 'humanoid'}
            onChange={(e) => updateTarget('type', e.target.value as any)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {CREATURE_TYPES.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Damage Resistances */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Damage Resistances
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DAMAGE_TYPES.map(damageType => (
              <label key={damageType} className="flex items-center">
                <input
                  type="checkbox"
                  checked={target.resistances.includes(damageType)}
                  onChange={() => toggleDamageType(damageType, 'resistances')}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {damageType}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Damage Immunities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Damage Immunities
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DAMAGE_TYPES.map(damageType => (
              <label key={damageType} className="flex items-center">
                <input
                  type="checkbox"
                  checked={target.immunities.includes(damageType)}
                  onChange={() => toggleDamageType(damageType, 'immunities')}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {damageType}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Damage Vulnerabilities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Damage Vulnerabilities
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DAMAGE_TYPES.map(damageType => (
              <label key={damageType} className="flex items-center">
                <input
                  type="checkbox"
                  checked={target.vulnerabilities.includes(damageType)}
                  onChange={() => toggleDamageType(damageType, 'vulnerabilities')}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {damageType}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conditions
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {COMMON_CONDITIONS.map(condition => (
              <label key={condition} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(target.conditions || []).includes(condition)}
                  onChange={() => toggleCondition(condition)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {condition}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({
                ...target,
                name: 'Goblin',
                armorClass: 15,
                maxHP: 7,
                currentHP: 7,
                size: 'small',
                type: 'humanoid',
                resistances: [],
                immunities: [],
                vulnerabilities: [],
                conditions: [],
              })}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Goblin (AC 15)
            </button>
            <button
              type="button"
              onClick={() => onChange({
                ...target,
                name: 'Orc',
                armorClass: 13,
                maxHP: 15,
                currentHP: 15,
                size: 'medium',
                type: 'humanoid',
                resistances: [],
                immunities: [],
                vulnerabilities: [],
                conditions: [],
              })}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Orc (AC 13)
            </button>
            <button
              type="button"
              onClick={() => onChange({
                ...target,
                name: 'Adult Dragon',
                armorClass: 19,
                maxHP: 200,
                currentHP: 200,
                size: 'huge',
                type: 'dragon',
                resistances: [],
                immunities: ['fire'],
                vulnerabilities: [],
                conditions: [],
              })}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Adult Dragon (AC 19)
            </button>
            <button
              type="button"
              onClick={() => onChange({
                ...target,
                name: 'Heavily Armored Knight',
                armorClass: 20,
                maxHP: 100,
                currentHP: 100,
                size: 'medium',
                type: 'humanoid',
                resistances: ['bludgeoning', 'piercing', 'slashing'],
                immunities: [],
                vulnerabilities: [],
                conditions: [],
              })}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Armored Knight (AC 20)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
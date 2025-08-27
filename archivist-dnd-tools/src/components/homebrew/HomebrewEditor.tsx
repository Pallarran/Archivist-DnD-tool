/**
 * Homebrew Editor Component
 * Allows users to create, edit, and manage custom effects
 */

import React, { useState, useRef } from 'react';
import type { Effect, HookContext, HookResult } from '../../types/effects';
import { validateEffectCombination } from '../../data/effects/comprehensiveEffects';

interface HomebrewEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (effect: Effect) => void;
  editingEffect?: Effect | null;
}

type EffectCategory = 'feat' | 'spell' | 'class-feature' | 'fighting-style' | 'magic-item' | 'condition' | 'custom';
type HookType = keyof Effect['hooks'];

const AVAILABLE_HOOKS: Array<{ key: HookType; label: string; description: string }> = [
  { key: 'onAttackRoll', label: 'On Attack Roll', description: 'Triggered when making an attack roll' },
  { key: 'onHit', label: 'On Hit', description: 'Triggered when an attack hits' },
  { key: 'onCrit', label: 'On Critical Hit', description: 'Triggered on a critical hit' },
  { key: 'onDamageRoll', label: 'On Damage Roll', description: 'Triggered when rolling damage' },
  { key: 'onSave', label: 'On Saving Throw', description: 'Triggered when making a saving throw' },
  { key: 'onFailSave', label: 'On Failed Save', description: 'Triggered when a saving throw fails' },
  { key: 'onTurnStart', label: 'On Turn Start', description: 'Triggered at the start of your turn' },
  { key: 'onTurnEnd', label: 'On Turn End', description: 'Triggered at the end of your turn' },
  { key: 'onKill', label: 'On Kill', description: 'Triggered when you kill a creature' }
];

const EFFECT_CATEGORIES: Array<{ value: EffectCategory; label: string }> = [
  { value: 'feat', label: 'Feat' },
  { value: 'spell', label: 'Spell' },
  { value: 'class-feature', label: 'Class Feature' },
  { value: 'fighting-style', label: 'Fighting Style' },
  { value: 'magic-item', label: 'Magic Item' },
  { value: 'condition', label: 'Condition' },
  { value: 'custom', label: 'Custom' }
];

export const HomebrewEditor: React.FC<HomebrewEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEffect
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<Effect>>(() => ({
    id: editingEffect?.id || '',
    name: editingEffect?.name || '',
    description: editingEffect?.description || '',
    category: editingEffect?.category || 'custom',
    source: editingEffect?.source || { book: 'Homebrew', page: 1 },
    level: editingEffect?.level,
    class: editingEffect?.class,
    school: editingEffect?.school,
    concentration: editingEffect?.concentration || false,
    duration: editingEffect?.duration,
    range: editingEffect?.range,
    components: editingEffect?.components || [],
    hooks: editingEffect?.hooks || {},
    prerequisites: editingEffect?.prerequisites || [],
    resourceCost: editingEffect?.resourceCost,
    oncePerTurn: editingEffect?.oncePerTurn || false
  }));

  const [activeTab, setActiveTab] = useState<'basic' | 'hooks' | 'preview'>('basic');
  const [selectedHook, setSelectedHook] = useState<HookType | null>(null);
  const [hookCode, setHookCode] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] }>({
    valid: true,
    errors: []
  });

  const hookEditorRef = useRef<HTMLTextAreaElement>(null);

  // Handle form field changes
  const updateField = (field: keyof Effect, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle hook editing
  const openHookEditor = (hookType: HookType) => {
    setSelectedHook(hookType);
    const existingHook = formData.hooks?.[hookType];
    if (existingHook) {
      // Convert function back to string for editing
      setHookCode(existingHook.toString());
    } else {
      // Provide template
      setHookCode(`(context) => {
  // Available context properties:
  // context.characterLevel, context.hasAdvantage, context.isCritical
  // context.weaponType, context.damageType, context.targetType, etc.
  
  // Return hook result object:
  return {
    // toHitBonus: 2,
    // bonusDamage: '1d6',
    // advantage: true,
    // disadvantage: true
  };
}`);
    }
  };

  // Save hook code
  const saveHook = () => {
    if (!selectedHook) return;

    try {
      // Validate JavaScript syntax
      const hookFunction = new Function('context', `return (${hookCode})(context)`);
      
      setFormData(prev => ({
        ...prev,
        hooks: {
          ...prev.hooks,
          [selectedHook]: hookFunction as any
        }
      }));

      setSelectedHook(null);
      setHookCode('');
    } catch (error) {
      alert('Invalid JavaScript code. Please check your syntax.');
    }
  };

  // Delete hook
  const deleteHook = (hookType: HookType) => {
    setFormData(prev => ({
      ...prev,
      hooks: {
        ...prev.hooks,
        [hookType]: undefined
      }
    }));
  };

  // Validate effect
  const validateEffect = (): boolean => {
    const errors: string[] = [];

    if (!formData.name?.trim()) errors.push('Name is required');
    if (!formData.description?.trim()) errors.push('Description is required');
    if (!formData.category) errors.push('Category is required');

    // ID validation
    if (!formData.id?.trim()) errors.push('ID is required');
    else if (!/^[a-z0-9-]+$/.test(formData.id)) {
      errors.push('ID must contain only lowercase letters, numbers, and hyphens');
    }

    // Category-specific validation
    if (formData.category === 'spell' && typeof formData.level !== 'number') {
      errors.push('Spells must have a level (0-9)');
    }

    if (formData.category === 'class-feature' && !formData.class?.trim()) {
      errors.push('Class features must specify a class');
    }

    setValidationResult({ valid: errors.length === 0, errors });
    return errors.length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateEffect()) return;

    const effect: Effect = {
      id: formData.id!,
      name: formData.name!,
      description: formData.description!,
      category: formData.category!,
      source: formData.source!,
      level: formData.level,
      class: formData.class,
      school: formData.school,
      concentration: formData.concentration,
      duration: formData.duration,
      range: formData.range,
      components: formData.components,
      hooks: formData.hooks || {},
      prerequisites: formData.prerequisites,
      resourceCost: formData.resourceCost,
      oncePerTurn: formData.oncePerTurn
    };

    onSave(effect);
    onClose();
  };

  // Generate ID from name
  const generateId = () => {
    if (formData.name) {
      const id = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      updateField('id', id);
    }
  };

  if (!isOpen) return null;

  const renderBasicTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            onBlur={generateId}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter effect name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ID * <button 
              type="button" 
              onClick={generateId}
              className="ml-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Generate
            </button>
          </label>
          <input
            type="text"
            value={formData.id || ''}
            onChange={(e) => updateField('id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="unique-effect-id"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          rows={3}
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Describe what this effect does..."
        />
      </div>

      {/* Category and Class */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            value={formData.category || ''}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {EFFECT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Class {formData.category === 'class-feature' && '*'}
          </label>
          <input
            type="text"
            value={formData.class || ''}
            onChange={(e) => updateField('class', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Fighter, Wizard, etc."
          />
        </div>
      </div>

      {/* Level and School (for spells) */}
      {formData.category === 'spell' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Level *
            </label>
            <input
              type="number"
              min={0}
              max={9}
              value={formData.level || ''}
              onChange={(e) => updateField('level', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              School
            </label>
            <select
              value={formData.school || ''}
              onChange={(e) => updateField('school', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select school</option>
              <option value="abjuration">Abjuration</option>
              <option value="conjuration">Conjuration</option>
              <option value="divination">Divination</option>
              <option value="enchantment">Enchantment</option>
              <option value="evocation">Evocation</option>
              <option value="illusion">Illusion</option>
              <option value="necromancy">Necromancy</option>
              <option value="transmutation">Transmutation</option>
            </select>
          </div>
        </div>
      )}

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.concentration || false}
            onChange={(e) => updateField('concentration', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Requires Concentration</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.oncePerTurn || false}
            onChange={(e) => updateField('oncePerTurn', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Once Per Turn</span>
        </label>
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Source Book
        </label>
        <input
          type="text"
          value={formData.source?.book || 'Homebrew'}
          onChange={(e) => updateField('source', { ...formData.source, book: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Source book name"
        />
      </div>
    </div>
  );

  const renderHooksTab = () => (
    <div className="space-y-6">
      {/* Available Hooks */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Available Hooks
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_HOOKS.map(hook => (
            <div
              key={hook.key}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  {hook.label}
                </h5>
                <div className="space-x-2">
                  {formData.hooks?.[hook.key] ? (
                    <>
                      <button
                        onClick={() => openHookEditor(hook.key)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteHook(hook.key)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openHookEditor(hook.key)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hook.description}
              </p>
              {formData.hooks?.[hook.key] && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  ✓ Configured
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hook Editor Modal */}
      {selectedHook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit {AVAILABLE_HOOKS.find(h => h.key === selectedHook)?.label}
              </h3>
              <button
                onClick={() => setSelectedHook(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hook Function (JavaScript)
                </label>
                <textarea
                  ref={hookEditorRef}
                  value={hookCode}
                  onChange={(e) => setHookCode(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  spellCheck={false}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedHook(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveHook}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Hook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPreviewTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {formData.name || 'Unnamed Effect'}
        </h4>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {formData.description || 'No description provided'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Category:</span> {formData.category}
          </div>
          <div>
            <span className="font-medium">Source:</span> {formData.source?.book}
          </div>
          {formData.class && (
            <div>
              <span className="font-medium">Class:</span> {formData.class}
            </div>
          )}
          {formData.level !== undefined && (
            <div>
              <span className="font-medium">Level:</span> {formData.level}
            </div>
          )}
        </div>
        
        {Object.keys(formData.hooks || {}).length > 0 && (
          <div className="mt-4">
            <span className="font-medium">Configured Hooks:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.keys(formData.hooks || {}).map(hookKey => (
                <span
                  key={hookKey}
                  className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs"
                >
                  {AVAILABLE_HOOKS.find(h => h.key === hookKey)?.label || hookKey}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Validation Results */}
      {!validationResult.valid && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h5 className="font-medium text-red-800 dark:text-red-400 mb-2">
            Validation Errors:
          </h5>
          <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
            {validationResult.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingEffect ? 'Edit Homebrew Effect' : 'Create Homebrew Effect'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'hooks', label: 'Hooks & Logic' },
            { id: 'preview', label: 'Preview' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'hooks' && renderHooksTab()}
          {activeTab === 'preview' && renderPreviewTab()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Create custom effects with JavaScript hooks for complex behaviors
          </div>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!validationResult.valid}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Effect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
/**
 * Main build configuration form component
 */

import React, { useState, useEffect } from 'react';
import type { Build, ClassLevel } from '../../types';
import { useBuildStore } from '../../store';
import { AbilityScoreForm } from './AbilityScoreForm';
import { ClassLevelForm } from './ClassLevelForm';
import { EquipmentForm } from './EquipmentForm';
import { PolicyForm } from './PolicyForm';

interface BuildFormProps {
  buildId?: string;
  onSave?: (build: Build) => void;
  onCancel?: () => void;
}

export const BuildForm: React.FC<BuildFormProps> = ({
  buildId,
  onSave,
  onCancel,
}) => {
  const { builds, createBuild, updateBuild } = useBuildStore();
  const [formData, setFormData] = useState<Partial<Build>>({
    name: '',
    description: '',
    abilities: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    levels: [],
    proficiencyBonus: 2,
    equipment: {
      mainHand: null,
      offHand: null,
      armor: null,
      accessories: [],
    },
    features: [],
    spells: [],
    conditions: [],
    policies: {
      smitePolicy: 'optimal',
      oncePerTurnPriority: 'optimal',
      precast: [],
      buffAssumptions: 'moderate',
      powerAttackThresholdEV: 0.5,
    },
    spellSlots: {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0,
      '9': 0,
    },
    version: '1.0',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'basic' | 'abilities' | 'classes' | 'equipment' | 'policies'>('basic');

  // Load existing build data
  useEffect(() => {
    if (buildId) {
      const existingBuild = builds.find(b => b.id === buildId);
      if (existingBuild) {
        setFormData(existingBuild);
      }
    }
  }, [buildId, builds]);

  const handleBasicInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear any existing error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAbilitiesChange = (abilities: Build['abilities']) => {
    setFormData(prev => ({ ...prev, abilities }));
  };

  const handleLevelsChange = (levels: ClassLevel[]) => {
    // Calculate proficiency bonus based on total level
    const totalLevel = levels.reduce((sum, level) => sum + level.level, 0);
    const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;
    
    setFormData(prev => ({
      ...prev,
      levels,
      proficiencyBonus,
    }));
  };

  const handleEquipmentChange = (equipment: Build['equipment']) => {
    setFormData(prev => ({ ...prev, equipment }));
  };

  const handlePoliciesChange = (policies: Build['policies']) => {
    setFormData(prev => ({ ...prev, policies }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Build name is required';
    }

    if (!formData.levels?.length) {
      newErrors.levels = 'At least one class level is required';
    }

    const totalLevel = formData.levels?.reduce((sum, level) => sum + level.level, 0) || 0;
    if (totalLevel < 1 || totalLevel > 20) {
      newErrors.levels = 'Total character level must be between 1 and 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const buildData: Omit<Build, 'id'> = {
      ...formData as Build,
      lastModified: new Date().toISOString(),
    };

    if (buildId) {
      updateBuild(buildId, buildData);
    } else {
      createBuild(buildData);
    }

    if (onSave) {
      onSave({ ...buildData, id: buildId || 'new' });
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'abilities', label: 'Abilities', icon: '💪' },
    { id: 'classes', label: 'Classes', icon: '🎭' },
    { id: 'equipment', label: 'Equipment', icon: '⚔️' },
    { id: 'policies', label: 'Policies', icon: '⚙️' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {buildId ? 'Edit Build' : 'Create New Build'}
          </h2>
          <div className="flex space-x-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              form="build-form"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {buildId ? 'Update Build' : 'Create Build'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <nav className="flex space-x-4">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Form Content */}
      <form id="build-form" onSubmit={handleSubmit} className="p-6">
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Build Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : ''
                  }`}
                  placeholder="e.g., Elven Ranger Archer"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Brief description of the build concept..."
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'abilities' && (
          <AbilityScoreForm
            abilities={formData.abilities || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }}
            onChange={handleAbilitiesChange}
          />
        )}

        {activeSection === 'classes' && (
          <ClassLevelForm
            levels={formData.levels || []}
            onChange={handleLevelsChange}
            error={errors.levels}
          />
        )}

        {activeSection === 'equipment' && (
          <EquipmentForm
            equipment={formData.equipment || { mainHand: null, offHand: null, armor: null, accessories: [] }}
            onChange={handleEquipmentChange}
          />
        )}

        {activeSection === 'policies' && (
          <PolicyForm
            policies={formData.policies || { smitePolicy: 'optimal', oncePerTurnPriority: 'optimal', precast: [], buffAssumptions: 'moderate', powerAttackThresholdEV: 0.5 }}
            onChange={handlePoliciesChange}
          />
        )}
      </form>
    </div>
  );
};
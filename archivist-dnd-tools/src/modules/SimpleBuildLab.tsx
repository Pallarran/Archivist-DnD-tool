/**
 * Simple Build Lab with ability score management
 * Integration with simplified store for persistent character builds
 */

import React, { useState, useEffect } from 'react';
import { useSimpleStore } from '../store/simpleStore';
import { BasicAbilityScoreForm, type AbilityScores } from '../components/forms/BasicAbilityScoreForm';
import { ClassLevelForm } from '../components/forms/ClassLevelForm';
import { EquipmentForm } from '../components/forms/EquipmentForm';
import type { Equipment } from '../types/build';

// Class level interface for Build Lab
interface ClassLevel {
  class: string;
  level: number;
  hitDie?: number;
  subclass?: string;
}

// Extended build interface for Build Lab
interface DetailedBuild {
  id: string;
  name: string;
  level: number;
  attackBonus: number;
  damage: string;
  notes?: string;
  createdAt: string;
  
  // Additional Build Lab properties
  abilityScores: AbilityScores;
  race?: string;
  classLevels: ClassLevel[];
  background?: string;
}

export const SimpleBuildLab: React.FC = () => {
  // Store integration
  const builds = useSimpleStore((state) => state.builds);
  const selectedBuild = useSimpleStore((state) => state.getSelectedBuild());
  const { addBuild, updateBuild, selectBuild, addNotification } = useSimpleStore();

  // Build creation state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'abilities' | 'classes' | 'equipment'>('basics');
  
  // Form state
  const [buildName, setBuildName] = useState<string>('');
  const [buildRace, setBuildRace] = useState<string>('Human');
  const [buildBackground, setBuildBackground] = useState<string>('Soldier');
  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  });
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([{
    class: 'fighter',
    level: 1,
    hitDie: 10,
    subclass: '',
  }]);
  const [equipment, setEquipment] = useState<Equipment>({
    mainHand: null,
    offHand: null,
    armor: null,
    accessories: []
  });

  // Common D&D races and backgrounds
  const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
  const backgrounds = ['Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier', 'Charlatan', 'Entertainer', 'Guild Artisan', 'Hermit', 'Outlander', 'Sailor'];

  // Calculate derived stats
  const getAbilityModifier = (score: number): number => Math.floor((score - 10) / 2);
  
  const getTotalLevel = (): number => {
    return classLevels.reduce((total, cl) => total + cl.level, 0);
  };
  
  const calculateAttackBonus = (): number => {
    // Attack bonus calculation: proficiency bonus + ability modifier + equipment bonus
    const totalLevel = getTotalLevel();
    const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;
    let primaryAbilityMod = 0;
    let equipmentBonus = 0;

    // Get weapon for primary attack
    const weapon = equipment.mainHand;
    
    // Use the first (primary) class for attack bonus calculation
    const primaryClass = classLevels[0]?.class.toLowerCase() || 'fighter';

    // Determine primary ability based on class and weapon
    if (weapon && weapon.properties.includes('finesse')) {
      // Finesse weapons can use Str or Dex - choose the better one
      primaryAbilityMod = Math.max(
        getAbilityModifier(abilityScores.strength),
        getAbilityModifier(abilityScores.dexterity)
      );
    } else if (weapon && weapon.type === 'ranged') {
      // Ranged weapons use Dex
      primaryAbilityMod = getAbilityModifier(abilityScores.dexterity);
    } else {
      // Default class-based ability
      switch (primaryClass) {
        case 'barbarian':
        case 'fighter':
        case 'paladin':
          primaryAbilityMod = getAbilityModifier(abilityScores.strength);
          break;
        case 'monk':
        case 'ranger':
        case 'rogue':
          primaryAbilityMod = getAbilityModifier(abilityScores.dexterity);
          break;
        case 'cleric':
        case 'druid':
          primaryAbilityMod = getAbilityModifier(abilityScores.wisdom);
          break;
        case 'sorcerer':
        case 'warlock':
        case 'bard':
          primaryAbilityMod = getAbilityModifier(abilityScores.charisma);
          break;
        case 'wizard':
          primaryAbilityMod = getAbilityModifier(abilityScores.intelligence);
          break;
        default:
          primaryAbilityMod = getAbilityModifier(abilityScores.strength);
      }
    }

    // Add equipment bonuses
    if (weapon?.magic) {
      equipmentBonus += weapon.magic;
    }
    if (weapon?.toHitBonus) {
      equipmentBonus += weapon.toHitBonus;
    }

    return proficiencyBonus + primaryAbilityMod + equipmentBonus;
  };

  const calculateDamage = (): string => {
    // Damage calculation based on equipped weapon and abilities
    const weapon = equipment.mainHand;
    const primaryClass = classLevels[0]?.class.toLowerCase() || 'fighter';
    
    let damageDice = '1d8'; // Default if no weapon
    let abilityMod = 0;
    let equipmentBonus = 0;
    
    // Get weapon damage dice
    if (weapon?.damage) {
      damageDice = weapon.damage;
    }
    
    // Calculate ability modifier for damage
    if (weapon && weapon.properties.includes('finesse')) {
      // Finesse weapons can use Str or Dex - choose the better one
      abilityMod = Math.max(
        getAbilityModifier(abilityScores.strength),
        getAbilityModifier(abilityScores.dexterity)
      );
    } else if (weapon && weapon.type === 'ranged') {
      // Ranged weapons use Dex
      abilityMod = getAbilityModifier(abilityScores.dexterity);
    } else {
      // Default class-based ability for damage
      switch (primaryClass) {
        case 'barbarian':
        case 'fighter':
        case 'paladin':
          abilityMod = getAbilityModifier(abilityScores.strength);
          break;
        case 'monk':
        case 'ranger':
        case 'rogue':
          abilityMod = getAbilityModifier(abilityScores.dexterity);
          break;
        default:
          abilityMod = getAbilityModifier(abilityScores.strength);
      }
    }
    
    // Add equipment bonuses
    if (weapon?.magic) {
      equipmentBonus += weapon.magic;
    }
    if (weapon?.damageBonus) {
      equipmentBonus += weapon.damageBonus;
    }
    
    const totalBonus = abilityMod + equipmentBonus;
    return totalBonus > 0 ? `${damageDice}+${totalBonus}` : `${damageDice}${totalBonus}`;
  };

  const calculateArmorClass = (): number => {
    // AC calculation: base 10 + armor + dex modifier + shield + magic bonuses
    let baseAC = 10;
    let armorBonus = 0;
    let dexMod = getAbilityModifier(abilityScores.dexterity);
    let shieldBonus = 0;
    let magicBonus = 0;
    
    if (equipment.armor) {
      armorBonus = equipment.armor.ac;
      
      // Apply Dex modifier limits based on armor type
      if (equipment.armor.type === 'heavy') {
        dexMod = 0; // Heavy armor doesn't benefit from Dex
      } else if (equipment.armor.type === 'medium') {
        dexMod = Math.min(dexMod, 2); // Medium armor caps at +2 Dex
      }
      // Light armor uses full Dex modifier
      
      if (equipment.armor.magic) {
        magicBonus += equipment.armor.magic;
      }
      
      // With armor, use armor AC instead of base 10
      baseAC = 0;
    }
    
    // TODO: Add shield bonus when shield state is properly tracked
    // This would require passing shield state from EquipmentForm
    
    return baseAC + armorBonus + dexMod + shieldBonus + magicBonus;
  };

  // Create new build
  const handleCreateBuild = () => {
    if (!buildName.trim()) {
      addNotification({
        type: 'error',
        message: 'Build name is required',
      });
      return;
    }

    const totalLevel = getTotalLevel();
    const classNames = classLevels.map(cl => `${cl.class} ${cl.level}`).join('/');
    
    const newBuild = {
      name: buildName.trim(),
      level: totalLevel,
      attackBonus: calculateAttackBonus(),
      damage: calculateDamage(),
      notes: `${buildRace} ${classNames} (${buildBackground})`,
    };

    addBuild(newBuild);

    // Reset form
    setBuildName('');
    setBuildRace('Human');
    setBuildBackground('Soldier');
    setAbilityScores({
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    });
    setClassLevels([{
      class: 'fighter',
      level: 1,
      hitDie: 10,
      subclass: '',
    }]);
    setEquipment({
      mainHand: null,
      offHand: null,
      armor: null,
      accessories: []
    });
    setIsCreating(false);
    setActiveTab('basics');

    addNotification({
      type: 'success',
      message: `Character "${newBuild.name}" created successfully!`,
    });
  };

  // Update calculations when relevant data changes
  useEffect(() => {
    // Auto-calculate attack bonus and damage when ability scores, class/level, or equipment change
  }, [abilityScores, classLevels, equipment]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Build Lab</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Create and customize character builds with comprehensive D&D 5e support
        </p>
      </div>

      {/* Build Management Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Character Builds ({builds.length})
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isCreating
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isCreating ? 'Cancel' : 'New Character'}
          </button>
        </div>
      </div>

      {/* Character Creation Form */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Character</h3>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'basics' as const, label: 'Basics' },
              { key: 'abilities' as const, label: 'Ability Scores' },
              { key: 'classes' as const, label: 'Classes & Levels' },
              { key: 'equipment' as const, label: 'Equipment' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={buildName}
                    onChange={(e) => setBuildName(e.target.value)}
                    placeholder="e.g., Thorin Ironshield"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Race
                  </label>
                  <select
                    value={buildRace}
                    onChange={(e) => setBuildRace(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {races.map((race) => (
                      <option key={race} value={race}>{race}</option>
                    ))}
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background
                  </label>
                  <select
                    value={buildBackground}
                    onChange={(e) => setBuildBackground(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {backgrounds.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Character Preview</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{buildName || 'Unnamed Character'}</strong> - Level {getTotalLevel()} {buildRace} {classLevels.map(cl => cl.class).join('/')} ({buildBackground})
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Attack Bonus: +{calculateAttackBonus()} • Damage: {calculateDamage()} • AC: {calculateArmorClass()}
                </p>
                {classLevels.length > 1 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Classes: {classLevels.map(cl => `${cl.class} ${cl.level}`).join(', ')}
                  </p>
                )}
                {equipment.mainHand && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Weapon: {equipment.mainHand.name} ({equipment.mainHand.damage} {equipment.mainHand.damageType})
                  </p>
                )}
                {equipment.armor && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Armor: {equipment.armor.name} (AC {equipment.armor.ac}
                    {equipment.armor.type === 'light' && ' + Dex'}
                    {equipment.armor.type === 'medium' && ' + Dex (max 2)'}
                    )
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'abilities' && (
            <BasicAbilityScoreForm
              scores={abilityScores}
              onChange={setAbilityScores}
              className="mt-4"
            />
          )}

          {activeTab === 'classes' && (
            <ClassLevelForm
              levels={classLevels}
              onChange={setClassLevels}
            />
          )}

          {activeTab === 'equipment' && (
            <EquipmentForm
              equipment={equipment}
              onChange={setEquipment}
            />
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBuild}
              disabled={!buildName.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Character
            </button>
          </div>
        </div>
      )}

      {/* Existing Builds */}
      {builds.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Characters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {builds.map((build) => (
              <div
                key={build.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedBuild?.id === build.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => selectBuild(build.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">{build.name}</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Lv.{build.level}</span>
                </div>
                
                {build.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{build.notes}</p>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>Attack: +{build.attackBonus} • Damage: {build.damage}</div>
                  <div>Created: {new Date(build.createdAt).toLocaleDateString()}</div>
                </div>
                
                {selectedBuild?.id === build.id && (
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      ✓ Selected for DPR Calculator
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 text-6xl mb-4">🎭</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Characters Yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Create your first D&D character to get started with optimization!
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Create Your First Character
          </button>
        </div>
      )}
    </div>
  );
};
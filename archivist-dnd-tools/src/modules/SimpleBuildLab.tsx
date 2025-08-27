/**
 * Simple Build Lab with ability score management
 * Integration with simplified store for persistent character builds
 */

import React, { useState, useEffect } from 'react';
import { useSimpleStore, type SimpleBuild } from '../store/simpleStore';
import { BasicAbilityScoreForm, type AbilityScores } from '../components/forms/BasicAbilityScoreForm';
import { ClassLevelForm } from '../components/forms/ClassLevelForm';
import { EquipmentForm } from '../components/forms/EquipmentForm';
import { ClassFeatureDisplay, type FeatureSelection } from '../components/forms/ClassFeatureDisplay';
import type { Equipment, ClassLevel } from '../types/build';

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
  const { addBuild, updateBuild, deleteBuild, selectBuild, addNotification } = useSimpleStore();

  // Build creation/editing state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingBuild, setEditingBuild] = useState<SimpleBuild | null>(null);
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
  const [abilityScoreMethod, setAbilityScoreMethod] = useState<'pointBuy' | 'standardArray' | 'manual'>('pointBuy');
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
  const [featureSelections, setFeatureSelections] = useState<{ [featureId: string]: FeatureSelection }>({});

  // Common D&D races and backgrounds
  const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
  const backgrounds = ['Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier', 'Charlatan', 'Entertainer', 'Guild Artisan', 'Hermit', 'Outlander', 'Sailor'];

  // Calculate derived stats
  const getAbilityModifier = (score: number): number => Math.floor((score - 10) / 2);
  
  const getTotalLevel = (): number => {
    return classLevels.reduce((total, cl) => total + cl.level, 0);
  };

  const getFightingStyles = (): string[] => {
    const styles: string[] = [];
    Object.values(featureSelections).forEach(selection => {
      if (selection.selections) {
        selection.selections.forEach(selectionId => {
          // Check if this selection is a fighting style
          if (['archery', 'defense', 'dueling', 'great-weapon-fighting', 'protection', 'two-weapon-fighting'].includes(selectionId)) {
            styles.push(selectionId);
          }
        });
      }
    });
    return styles;
  };

  const getExtraAttacks = (): number => {
    let extraAttacks = 0;
    classLevels.forEach(classLevel => {
      const className = classLevel.class.toLowerCase();
      const level = classLevel.level;
      
      // Fighter gets extra attacks at levels 5, 11, and 20
      if (className === 'fighter') {
        if (level >= 20) extraAttacks += 3;
        else if (level >= 11) extraAttacks += 2;
        else if (level >= 5) extraAttacks += 1;
      }
      // Other classes get extra attack at level 5
      else if (['barbarian', 'paladin', 'ranger'].includes(className) && level >= 5) {
        extraAttacks += 1;
      }
    });
    return extraAttacks;
  };
  
  const calculateAttackBonus = (): number => {
    // Attack bonus calculation: proficiency bonus + ability modifier + equipment bonus + fighting style bonus
    const totalLevel = getTotalLevel();
    const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;
    let primaryAbilityMod = 0;
    let equipmentBonus = 0;
    let fightingStyleBonus = 0;

    // Get weapon for primary attack
    const weapon = equipment.mainHand;
    
    // Use the first (primary) class for attack bonus calculation
    const primaryClass = classLevels[0]?.class.toLowerCase() || 'fighter';

    // Check for fighting style bonuses
    const fightingStyles = getFightingStyles();
    if (fightingStyles.includes('archery') && weapon?.type === 'ranged') {
      fightingStyleBonus += 2; // Archery fighting style gives +2 to ranged attacks
    }

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

    return proficiencyBonus + primaryAbilityMod + equipmentBonus + fightingStyleBonus;
  };

  const calculateDamage = (): string => {
    // Damage calculation based on equipped weapon and abilities
    const weapon = equipment.mainHand;
    const primaryClass = classLevels[0]?.class.toLowerCase() || 'fighter';
    
    let damageDice = '1d8'; // Default if no weapon
    let abilityMod = 0;
    let equipmentBonus = 0;
    let fightingStyleBonus = 0;
    
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

    // Check for fighting style damage bonuses
    const fightingStyles = getFightingStyles();
    if (fightingStyles.includes('dueling') && weapon && !equipment.offHand) {
      // Dueling fighting style: +2 damage when wielding one-handed weapon with no other weapons
      if (weapon.properties.includes('versatile') || weapon.type === 'melee') {
        fightingStyleBonus += 2;
      }
    }
    // Note: Two-weapon fighting adds ability mod to off-hand attacks, which we don't calculate here
    // Note: Great weapon fighting allows rerolling 1s and 2s, which is hard to represent as a flat bonus
    
    // Add equipment bonuses
    if (weapon?.magic) {
      equipmentBonus += weapon.magic;
    }
    if (weapon?.damageBonus) {
      equipmentBonus += weapon.damageBonus;
    }
    
    const totalBonus = abilityMod + equipmentBonus + fightingStyleBonus;
    const extraAttacks = getExtraAttacks();
    const totalAttacks = 1 + extraAttacks;
    
    let damageString = totalBonus > 0 ? `${damageDice}+${totalBonus}` : `${damageDice}${totalBonus}`;
    if (totalAttacks > 1) {
      damageString += ` (×${totalAttacks} attacks)`;
    }
    
    return damageString;
  };

  const calculateArmorClass = (): number => {
    // AC calculation: base 10 + armor + dex modifier + shield + magic bonuses + fighting style bonuses
    let baseAC = 10;
    let armorBonus = 0;
    let dexMod = getAbilityModifier(abilityScores.dexterity);
    let shieldBonus = 0;
    let magicBonus = 0;
    let fightingStyleBonus = 0;
    
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
    
    // Check for fighting style AC bonuses
    const fightingStyles = getFightingStyles();
    if (fightingStyles.includes('defense') && equipment.armor) {
      fightingStyleBonus += 1; // Defense fighting style gives +1 AC while wearing armor
    }
    
    // TODO: Add shield bonus when shield state is properly tracked
    // This would require passing shield state from EquipmentForm
    
    return baseAC + armorBonus + dexMod + shieldBonus + magicBonus + fightingStyleBonus;
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
      // Store detailed character data for editing
      race: buildRace,
      background: buildBackground,
      abilityScores: { ...abilityScores },
      abilityScoreMethod,
      classLevels: [...classLevels],
      equipment: {
        mainHand: equipment.mainHand,
        offHand: equipment.offHand,
        armor: equipment.armor,
        accessories: equipment.accessories || []
      },
      featureSelections: { ...featureSelections }
    };

    addBuild(newBuild);

    // Reset form using the same function as cancel
    handleCancelEdit();

    addNotification({
      type: 'success',
      message: `Character "${newBuild.name}" created successfully!`,
    });
  };

  // Start editing an existing build
  const handleEditBuild = (build: SimpleBuild) => {
    setEditingBuild(build);
    setBuildName(build.name);
    
    // Load stored character data or fall back to parsing notes/defaults
    if (build.race) {
      setBuildRace(build.race);
    } else {
      // Fall back to parsing notes for older builds without detailed data
      const notesParts = build.notes?.match(/^(\w+)\s+(.*?)\s+\((.+)\)$/) || [];
      if (notesParts.length >= 4) {
        setBuildRace(notesParts[1]);
      } else {
        setBuildRace('Human');
      }
    }
    
    if (build.background) {
      setBuildBackground(build.background);
    } else {
      // Fall back to parsing notes or default
      const notesParts = build.notes?.match(/^(\w+)\s+(.*?)\s+\((.+)\)$/) || [];
      if (notesParts.length >= 4) {
        setBuildBackground(notesParts[3]);
      } else {
        setBuildBackground('Soldier');
      }
    }
    
    // Load ability scores or use defaults
    if (build.abilityScores) {
      setAbilityScores({ ...build.abilityScores });
    } else {
      setAbilityScores({
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      });
    }
    
    // Load ability score method or use default
    if (build.abilityScoreMethod) {
      setAbilityScoreMethod(build.abilityScoreMethod);
    } else {
      setAbilityScoreMethod('manual'); // Default to manual for legacy builds since they had manual entry
    }
    
    // Load class levels or create from build level
    if (build.classLevels && build.classLevels.length > 0) {
      setClassLevels([...build.classLevels]);
    } else {
      // Fall back to single class at build level
      setClassLevels([{
        class: 'fighter',
        level: build.level,
        hitDie: 10,
        subclass: '',
      }]);
    }
    
    // Load equipment or use defaults
    if (build.equipment) {
      setEquipment({
        mainHand: build.equipment.mainHand || null,
        offHand: build.equipment.offHand || null,
        armor: build.equipment.armor || null,
        accessories: build.equipment.accessories || []
      });
    } else {
      setEquipment({
        mainHand: null,
        offHand: null,
        armor: null,
        accessories: []
      });
    }
    
    // Load feature selections
    if (build.featureSelections) {
      setFeatureSelections({ ...build.featureSelections });
    } else {
      setFeatureSelections({});
    }
    
    setIsCreating(true);
    setActiveTab('basics');
  };

  // Update existing build
  const handleUpdateBuild = () => {
    if (!editingBuild || !buildName.trim()) {
      addNotification({
        type: 'error',
        message: 'Build name is required',
      });
      return;
    }

    const totalLevel = getTotalLevel();
    const classNames = classLevels.map(cl => `${cl.class} ${cl.level}`).join('/');
    
    const updatedData = {
      name: buildName.trim(),
      level: totalLevel,
      attackBonus: calculateAttackBonus(),
      damage: calculateDamage(),
      notes: `${buildRace} ${classNames} (${buildBackground})`,
      // Store detailed character data for future editing
      race: buildRace,
      background: buildBackground,
      abilityScores: { ...abilityScores },
      abilityScoreMethod,
      classLevels: [...classLevels],
      equipment: {
        mainHand: equipment.mainHand,
        offHand: equipment.offHand,
        armor: equipment.armor,
        accessories: equipment.accessories || []
      },
      featureSelections: { ...featureSelections }
    };

    updateBuild(editingBuild.id, updatedData);
    handleCancelEdit();

    addNotification({
      type: 'success',
      message: `Character "${updatedData.name}" updated successfully!`,
    });
  };

  // Cancel editing/creating
  const handleCancelEdit = () => {
    setEditingBuild(null);
    setIsCreating(false);
    setActiveTab('basics');
    // Reset form values
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
    setAbilityScoreMethod('pointBuy');
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
    setFeatureSelections({});
  };

  // Delete build with confirmation
  const handleDeleteBuild = (build: SimpleBuild) => {
    if (window.confirm(`Are you sure you want to delete "${build.name}"? This action cannot be undone.`)) {
      deleteBuild(build.id);
    }
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
            onClick={() => isCreating || editingBuild ? handleCancelEdit() : setIsCreating(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isCreating || editingBuild
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isCreating || editingBuild ? 'Cancel' : 'New Character'}
          </button>
        </div>
      </div>

      {/* Character Creation/Editing Form */}
      {(isCreating || editingBuild) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingBuild ? `Edit Character: ${editingBuild.name}` : 'Create New Character'}
          </h3>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'basics' as const, label: 'Basics' },
              { key: 'abilities' as const, label: 'Ability Scores' },
              { key: 'classes' as const, label: 'Classes & Features' },
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
              method={abilityScoreMethod}
              onMethodChange={setAbilityScoreMethod}
              className="mt-4"
            />
          )}

          {activeTab === 'classes' && (
            <ClassLevelForm
              levels={classLevels}
              onChange={setClassLevels}
              featureSelections={featureSelections}
              onFeatureSelectionChange={(featureId, selection) => {
                setFeatureSelections(prev => ({
                  ...prev,
                  [featureId]: selection
                }));
              }}
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
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={editingBuild ? handleUpdateBuild : handleCreateBuild}
              disabled={!buildName.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingBuild ? 'Update Character' : 'Create Character'}
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
                className={`p-4 rounded-lg border transition-colors ${
                  selectedBuild?.id === build.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div 
                  className="cursor-pointer"
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

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditBuild(build);
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Edit build"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBuild(build);
                    }}
                    className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete build"
                  >
                    🗑️ Delete
                  </button>
                </div>
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
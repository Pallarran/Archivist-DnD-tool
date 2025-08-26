/**
 * Equipment selection form component
 */

import React, { useState, useEffect } from 'react';
import type { Build, Weapon, Armor } from '../../types';

interface EquipmentFormProps {
  equipment: Build['equipment'];
  onChange: (equipment: Build['equipment']) => void;
}

// Common weapons data
const WEAPONS: Weapon[] = [
  // Simple Melee
  { name: 'Club', damage: '1d4', damageType: 'bludgeoning', properties: ['light'], category: 'simple', type: 'melee', cost: '1 sp', weight: 2 },
  { name: 'Dagger', damage: '1d4', damageType: 'piercing', properties: ['finesse', 'light', 'thrown'], category: 'simple', type: 'melee', cost: '2 gp', weight: 1 },
  { name: 'Handaxe', damage: '1d6', damageType: 'slashing', properties: ['light', 'thrown'], category: 'simple', type: 'melee', cost: '5 gp', weight: 2 },
  { name: 'Javelin', damage: '1d6', damageType: 'piercing', properties: ['thrown'], category: 'simple', type: 'melee', cost: '5 sp', weight: 2 },
  { name: 'Mace', damage: '1d6', damageType: 'bludgeoning', properties: [], category: 'simple', type: 'melee', cost: '5 gp', weight: 4 },
  { name: 'Quarterstaff', damage: '1d6', damageType: 'bludgeoning', properties: ['versatile'], category: 'simple', type: 'melee', cost: '2 sp', weight: 4 },
  { name: 'Spear', damage: '1d6', damageType: 'piercing', properties: ['thrown', 'versatile'], category: 'simple', type: 'melee', cost: '1 gp', weight: 3 },
  
  // Simple Ranged
  { name: 'Crossbow, light', damage: '1d8', damageType: 'piercing', properties: ['ammunition', 'loading', 'two-handed'], category: 'simple', type: 'ranged', cost: '25 gp', weight: 5, range: '80/320' },
  { name: 'Shortbow', damage: '1d6', damageType: 'piercing', properties: ['ammunition', 'two-handed'], category: 'simple', type: 'ranged', cost: '25 gp', weight: 2, range: '80/320' },
  { name: 'Sling', damage: '1d4', damageType: 'bludgeoning', properties: ['ammunition'], category: 'simple', type: 'ranged', cost: '1 sp', weight: 0, range: '30/120' },
  
  // Martial Melee
  { name: 'Battleaxe', damage: '1d8', damageType: 'slashing', properties: ['versatile'], category: 'martial', type: 'melee', cost: '10 gp', weight: 4 },
  { name: 'Glaive', damage: '1d10', damageType: 'slashing', properties: ['heavy', 'reach', 'two-handed'], category: 'martial', type: 'melee', cost: '20 gp', weight: 6 },
  { name: 'Greataxe', damage: '1d12', damageType: 'slashing', properties: ['heavy', 'two-handed'], category: 'martial', type: 'melee', cost: '30 gp', weight: 7 },
  { name: 'Greatsword', damage: '2d6', damageType: 'slashing', properties: ['heavy', 'two-handed'], category: 'martial', type: 'melee', cost: '50 gp', weight: 6 },
  { name: 'Halberd', damage: '1d10', damageType: 'slashing', properties: ['heavy', 'reach', 'two-handed'], category: 'martial', type: 'melee', cost: '20 gp', weight: 6 },
  { name: 'Lance', damage: '1d12', damageType: 'piercing', properties: ['reach', 'special'], category: 'martial', type: 'melee', cost: '10 gp', weight: 6 },
  { name: 'Longsword', damage: '1d8', damageType: 'slashing', properties: ['versatile'], category: 'martial', type: 'melee', cost: '15 gp', weight: 3 },
  { name: 'Maul', damage: '2d6', damageType: 'bludgeoning', properties: ['heavy', 'two-handed'], category: 'martial', type: 'melee', cost: '10 gp', weight: 10 },
  { name: 'Pike', damage: '1d10', damageType: 'piercing', properties: ['heavy', 'reach', 'two-handed'], category: 'martial', type: 'melee', cost: '5 gp', weight: 18 },
  { name: 'Rapier', damage: '1d8', damageType: 'piercing', properties: ['finesse'], category: 'martial', type: 'melee', cost: '25 gp', weight: 2 },
  { name: 'Scimitar', damage: '1d6', damageType: 'slashing', properties: ['finesse', 'light'], category: 'martial', type: 'melee', cost: '25 gp', weight: 3 },
  { name: 'Shortsword', damage: '1d6', damageType: 'piercing', properties: ['finesse', 'light'], category: 'martial', type: 'melee', cost: '10 gp', weight: 2 },
  { name: 'Warhammer', damage: '1d8', damageType: 'bludgeoning', properties: ['versatile'], category: 'martial', type: 'melee', cost: '15 gp', weight: 2 },
  
  // Martial Ranged
  { name: 'Crossbow, hand', damage: '1d6', damageType: 'piercing', properties: ['ammunition', 'light', 'loading'], category: 'martial', type: 'ranged', cost: '75 gp', weight: 3, range: '30/120' },
  { name: 'Crossbow, heavy', damage: '1d10', damageType: 'piercing', properties: ['ammunition', 'heavy', 'loading', 'two-handed'], category: 'martial', type: 'ranged', cost: '50 gp', weight: 18, range: '100/400' },
  { name: 'Longbow', damage: '1d8', damageType: 'piercing', properties: ['ammunition', 'heavy', 'two-handed'], category: 'martial', type: 'ranged', cost: '50 gp', weight: 2, range: '150/600' },
];

// Common armor data
const ARMOR: Armor[] = [
  // Light Armor
  { name: 'Padded', ac: 11, type: 'light', stealthDisadvantage: true, cost: '5 gp', weight: 8 },
  { name: 'Leather', ac: 11, type: 'light', stealthDisadvantage: false, cost: '10 gp', weight: 10 },
  { name: 'Studded Leather', ac: 12, type: 'light', stealthDisadvantage: false, cost: '45 gp', weight: 13 },
  
  // Medium Armor
  { name: 'Hide', ac: 12, type: 'medium', stealthDisadvantage: false, cost: '10 gp', weight: 12 },
  { name: 'Chain Shirt', ac: 13, type: 'medium', stealthDisadvantage: false, cost: '50 gp', weight: 20 },
  { name: 'Scale Mail', ac: 14, type: 'medium', stealthDisadvantage: true, cost: '50 gp', weight: 45 },
  { name: 'Breastplate', ac: 14, type: 'medium', stealthDisadvantage: false, cost: '400 gp', weight: 20 },
  { name: 'Half Plate', ac: 15, type: 'medium', stealthDisadvantage: true, cost: '750 gp', weight: 40 },
  
  // Heavy Armor
  { name: 'Ring Mail', ac: 14, type: 'heavy', stealthDisadvantage: true, cost: '30 gp', weight: 40, strengthRequirement: 0 },
  { name: 'Chain Mail', ac: 16, type: 'heavy', stealthDisadvantage: true, cost: '75 gp', weight: 55, strengthRequirement: 13 },
  { name: 'Splint', ac: 17, type: 'heavy', stealthDisadvantage: true, cost: '200 gp', weight: 60, strengthRequirement: 15 },
  { name: 'Plate', ac: 18, type: 'heavy', stealthDisadvantage: true, cost: '1500 gp', weight: 65, strengthRequirement: 15 },
];

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  equipment,
  onChange,
}) => {
  const [activeSection, setActiveSection] = useState<'weapons' | 'armor' | 'accessories'>('weapons');
  const [magicWeaponBonus, setMagicWeaponBonus] = useState<number>(0);
  const [magicArmorBonus, setMagicArmorBonus] = useState<number>(0);
  const [hasShield, setHasShield] = useState<boolean>(false);

  // Initialize magic bonuses from existing equipment
  useEffect(() => {
    if (equipment.mainHand?.magic) {
      setMagicWeaponBonus(equipment.mainHand.magic);
    } else if (equipment.offHand?.magic) {
      setMagicWeaponBonus(equipment.offHand.magic);
    }
    
    if (equipment.armor?.magic) {
      setMagicArmorBonus(equipment.armor.magic);
    }
  }, [equipment.mainHand, equipment.offHand, equipment.armor]);

  const updateMainHand = (weapon: Weapon | null) => {
    if (weapon && magicWeaponBonus > 0) {
      weapon = { ...weapon, magic: magicWeaponBonus };
    }
    onChange({ ...equipment, mainHand: weapon });
  };

  const updateOffHand = (weapon: Weapon | null) => {
    if (weapon && magicWeaponBonus > 0) {
      weapon = { ...weapon, magic: magicWeaponBonus };
    }
    onChange({ ...equipment, offHand: weapon });
  };

  const updateArmor = (armor: Armor | null) => {
    if (armor && magicArmorBonus > 0) {
      armor = { ...armor, magic: magicArmorBonus };
    }
    onChange({ ...equipment, armor });
  };

  const canDualWield = (mainHand: Weapon | null, offHand: Weapon | null): boolean => {
    if (!mainHand || !offHand) return true;
    
    // Both weapons must be light for dual wielding
    return mainHand.properties.includes('light') && offHand.properties.includes('light');
  };

  const getWeaponsByCategory = (category: 'simple' | 'martial') => {
    return WEAPONS.filter(w => w.category === category);
  };

  const formatWeaponInfo = (weapon: Weapon): string => {
    const parts = [];
    parts.push(`${weapon.damage} ${weapon.damageType}`);
    if (weapon.properties.length > 0) {
      parts.push(`(${weapon.properties.join(', ')})`);
    }
    if (weapon.range) {
      parts.push(`Range: ${weapon.range}`);
    }
    return parts.join(' ');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Equipment</h3>

      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'weapons', label: 'Weapons', icon: '⚔️' },
            { id: 'armor', label: 'Armor', icon: '🛡️' },
            { id: 'accessories', label: 'Accessories', icon: '💍' },
          ].map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Weapons Section */}
      {activeSection === 'weapons' && (
        <div className="space-y-6">
          {/* Main Hand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Hand Weapon
            </label>
            <select
              value={equipment.mainHand?.name || ''}
              onChange={(e) => {
                const weapon = WEAPONS.find(w => w.name === e.target.value) || null;
                updateMainHand(weapon);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">No weapon</option>
              <optgroup label="Simple Weapons">
                {getWeaponsByCategory('simple').map(weapon => (
                  <option key={weapon.name} value={weapon.name}>
                    {weapon.name} - {formatWeaponInfo(weapon)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Martial Weapons">
                {getWeaponsByCategory('martial').map(weapon => (
                  <option key={weapon.name} value={weapon.name}>
                    {weapon.name} - {formatWeaponInfo(weapon)}
                  </option>
                ))}
              </optgroup>
            </select>
            
            {equipment.mainHand && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <div><strong>Damage:</strong> {equipment.mainHand.damage} {equipment.mainHand.damageType}</div>
                <div><strong>Properties:</strong> {equipment.mainHand.properties.join(', ') || 'None'}</div>
                <div><strong>Weight:</strong> {equipment.mainHand.weight} lbs | <strong>Cost:</strong> {equipment.mainHand.cost}</div>
              </div>
            )}
          </div>

          {/* Off Hand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Off Hand Weapon
            </label>
            <select
              value={equipment.offHand?.name || ''}
              onChange={(e) => {
                const weapon = WEAPONS.find(w => w.name === e.target.value) || null;
                updateOffHand(weapon);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">No weapon / Shield</option>
              <optgroup label="Light Weapons (Dual Wield)">
                {WEAPONS.filter(w => w.properties.includes('light')).map(weapon => (
                  <option key={weapon.name} value={weapon.name}>
                    {weapon.name} - {formatWeaponInfo(weapon)}
                  </option>
                ))}
              </optgroup>
            </select>

            {equipment.offHand && equipment.offHand.damage && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <div><strong>Damage:</strong> {equipment.offHand.damage} {equipment.offHand.damageType}</div>
                <div><strong>Properties:</strong> {equipment.offHand.properties.join(', ') || 'None'}</div>
                <div><strong>Weight:</strong> {equipment.offHand.weight} lbs | <strong>Cost:</strong> {equipment.offHand.cost}</div>
              </div>
            )}

            {/* Dual Wield Warning */}
            {equipment.mainHand && equipment.offHand && !canDualWield(equipment.mainHand, equipment.offHand) && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                ⚠️ Warning: Both weapons must have the "light" property for dual wielding without feat
              </div>
            )}
          </div>
        </div>
      )}

      {/* Armor Section */}
      {activeSection === 'armor' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Armor
            </label>
            <select
              value={equipment.armor?.name || ''}
              onChange={(e) => {
                const armor = ARMOR.find(a => a.name === e.target.value) || null;
                updateArmor(armor);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">No armor</option>
              <optgroup label="Light Armor">
                {ARMOR.filter(a => a.type === 'light').map(armor => (
                  <option key={armor.name} value={armor.name}>
                    {armor.name} (AC {armor.ac} + Dex modifier)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Medium Armor">
                {ARMOR.filter(a => a.type === 'medium').map(armor => (
                  <option key={armor.name} value={armor.name}>
                    {armor.name} (AC {armor.ac} + Dex modifier (max 2))
                  </option>
                ))}
              </optgroup>
              <optgroup label="Heavy Armor">
                {ARMOR.filter(a => a.type === 'heavy').map(armor => (
                  <option key={armor.name} value={armor.name}>
                    {armor.name} (AC {armor.ac})
                    {armor.strengthRequirement && armor.strengthRequirement > 0 ? 
                      ` - Req. Str ${armor.strengthRequirement}` : ''}
                  </option>
                ))}
              </optgroup>
            </select>

            {equipment.armor && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <div><strong>AC:</strong> {equipment.armor.ac} 
                  {equipment.armor.type === 'light' && ' + Dex modifier'}
                  {equipment.armor.type === 'medium' && ' + Dex modifier (max 2)'}
                </div>
                <div><strong>Type:</strong> {equipment.armor.type} armor</div>
                {equipment.armor.stealthDisadvantage && (
                  <div className="text-red-600">⚠️ Disadvantage on Stealth checks</div>
                )}
                {equipment.armor.strengthRequirement && equipment.armor.strengthRequirement > 0 && (
                  <div><strong>Strength Requirement:</strong> {equipment.armor.strengthRequirement}</div>
                )}
                <div><strong>Weight:</strong> {equipment.armor.weight} lbs | <strong>Cost:</strong> {equipment.armor.cost}</div>
              </div>
            )}
          </div>

          {/* Shield Option */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <input
                id="shield"
                type="checkbox"
                checked={hasShield}
                onChange={(e) => {
                  setHasShield(e.target.checked);
                  if (e.target.checked) {
                    // Clear off-hand when equipping shield
                    onChange({ ...equipment, offHand: null });
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="shield" className="ml-2 text-sm text-blue-700">
                Shield (+2 AC, requires free hand)
              </label>
            </div>
            <p className="mt-1 text-xs text-blue-600">
              Cannot be used with two-handed weapons or while dual wielding
            </p>
            {hasShield && equipment.mainHand?.properties.includes('two-handed') && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                ⚠️ Warning: Cannot use shield with two-handed weapons
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accessories Section */}
      {activeSection === 'accessories' && (
        <div className="space-y-6">
          <p className="text-gray-600 text-sm">
            Magic items and accessories that provide bonuses to attacks, damage, or AC.
          </p>

          <div className="space-y-4">
            {/* Magic Weapon Bonus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Magic Weapon Bonus
              </label>
              <select 
                value={magicWeaponBonus}
                onChange={(e) => {
                  const bonus = parseInt(e.target.value);
                  setMagicWeaponBonus(bonus);
                  // Update existing weapons with new bonus
                  if (equipment.mainHand) {
                    updateMainHand(equipment.mainHand);
                  }
                  if (equipment.offHand) {
                    updateOffHand(equipment.offHand);
                  }
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="0">No bonus</option>
                <option value="1">+1 Magic Weapon</option>
                <option value="2">+2 Magic Weapon</option>
                <option value="3">+3 Magic Weapon</option>
              </select>
            </div>

            {/* Magic Armor Bonus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Magic Armor Bonus
              </label>
              <select 
                value={magicArmorBonus}
                onChange={(e) => {
                  const bonus = parseInt(e.target.value);
                  setMagicArmorBonus(bonus);
                  // Update existing armor with new bonus
                  if (equipment.armor) {
                    updateArmor(equipment.armor);
                  }
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="0">No bonus</option>
                <option value="1">+1 Magic Armor</option>
                <option value="2">+2 Magic Armor</option>
                <option value="3">+3 Magic Armor</option>
              </select>
            </div>

            {/* Other Magic Items */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Magic Items
              </label>
              <div className="space-y-2">
                {[
                  { id: 'bracers-archery', name: 'Bracers of Archery', description: '+2 damage with ranged weapons' },
                  { id: 'belt-giant-str', name: 'Belt of Giant Strength', description: 'Set Strength to 21-29' },
                  { id: 'gauntlets-ogre', name: 'Gauntlets of Ogre Power', description: 'Strength 19' },
                  { id: 'ring-protection', name: 'Ring of Protection', description: '+1 AC and saving throws' },
                  { id: 'amulet-health', name: 'Amulet of Health', description: 'Constitution 19' },
                ].map((item) => {
                  const isChecked = equipment.accessories?.some(acc => acc.name === item.name) || false;
                  return (
                    <div key={item.id} className="flex items-center">
                      <input 
                        id={item.id} 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => {
                          let newAccessories = equipment.accessories || [];
                          if (e.target.checked) {
                            // Add accessory if not already present
                            if (!newAccessories.some(acc => acc.name === item.name)) {
                              newAccessories = [...newAccessories, { name: item.name, properties: [item.description] }];
                            }
                          } else {
                            // Remove accessory
                            newAccessories = newAccessories.filter(acc => acc.name !== item.name);
                          }
                          onChange({ ...equipment, accessories: newAccessories });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <label htmlFor={item.id} className="ml-2 text-sm text-gray-700">
                        {item.name} ({item.description})
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
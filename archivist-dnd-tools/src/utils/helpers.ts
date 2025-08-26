import type { Build, Target } from '../types';

// ID generation
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Ability modifier calculation
export const getAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

// Proficiency bonus by total character level
export const getProficiencyBonus = (totalLevel: number): number => {
  return Math.ceil(totalLevel / 4) + 1;
};

// Calculate total character level from class levels
export const getTotalLevel = (levels: Build['levels']): number => {
  return levels.reduce((total, classLevel) => total + classLevel.level, 0);
};

// Get class level for a specific class
export const getClassLevel = (levels: Build['levels'], className: string): number => {
  const classLevel = levels.find(cl => cl.class.toLowerCase() === className.toLowerCase());
  return classLevel?.level || 0;
};

// Calculate spell attack bonus
export const getSpellAttackBonus = (
  build: Build, 
  spellcastingAbility: keyof Build['abilities']
): number => {
  const abilityMod = getAbilityModifier(build.abilities[spellcastingAbility]);
  return abilityMod + build.proficiencyBonus;
};

// Calculate spell save DC
export const getSpellSaveDC = (
  build: Build, 
  spellcastingAbility: keyof Build['abilities']
): number => {
  const abilityMod = getAbilityModifier(build.abilities[spellcastingAbility]);
  return 8 + abilityMod + build.proficiencyBonus;
};

// Calculate weapon attack bonus
export const getAttackBonus = (
  build: Build,
  weapon: Build['equipment']['mainHand'],
  ability?: keyof Build['abilities']
): number => {
  if (!weapon) return 0;
  
  // Determine ability score to use
  let abilityScore = ability;
  if (!abilityScore) {
    // Default to strength for melee, dexterity for ranged
    abilityScore = weapon.properties.includes('ranged') || 
                   weapon.properties.includes('finesse') ? 'dexterity' : 'strength';
  }
  
  const abilityMod = getAbilityModifier(build.abilities[abilityScore]);
  const magicBonus = weapon.magic || 0;
  const weaponBonus = weapon.toHitBonus || 0;
  
  // Check if proficient (simplified - assume proficiency for now)
  const proficiencyBonus = build.proficiencyBonus;
  
  return abilityMod + proficiencyBonus + magicBonus + weaponBonus;
};

// Parse dice notation (e.g., "1d8+3", "2d6", "1d4+1")
export const parseDice = (diceString: string): { count: number; sides: number; bonus: number } => {
  const match = diceString.match(/^(\d+)?d(\d+)(?:\+(\d+))?$/i);
  if (!match) {
    throw new Error(`Invalid dice notation: ${diceString}`);
  }
  
  return {
    count: parseInt(match[1] || '1', 10),
    sides: parseInt(match[2], 10),
    bonus: parseInt(match[3] || '0', 10),
  };
};

// Calculate average damage for dice notation
export const getAverageDamage = (diceString: string): number => {
  const { count, sides, bonus } = parseDice(diceString);
  return count * ((sides + 1) / 2) + bonus;
};

// Calculate maximum damage for dice notation
export const getMaxDamage = (diceString: string): number => {
  const { count, sides, bonus } = parseDice(diceString);
  return count * sides + bonus;
};

// Calculate minimum damage for dice notation
export const getMinDamage = (diceString: string): number => {
  const { count, bonus } = parseDice(diceString);
  return count + bonus;
};

// Format dice for display
export const formatDice = (count: number, sides: number, bonus: number = 0): string => {
  let result = `${count}d${sides}`;
  if (bonus > 0) result += `+${bonus}`;
  else if (bonus < 0) result += `${bonus}`;
  return result;
};

// Check if a target has resistance to a damage type
export const hasResistance = (target: Target, damageType: string): boolean => {
  return target.resistances.includes(damageType.toLowerCase());
};

// Check if a target has immunity to a damage type
export const hasImmunity = (target: Target, damageType: string): boolean => {
  return target.immunities.includes(damageType.toLowerCase());
};

// Check if a target has vulnerability to a damage type
export const hasVulnerability = (target: Target, damageType: string): boolean => {
  return target.vulnerabilities.includes(damageType.toLowerCase());
};

// Apply damage resistances/immunities/vulnerabilities
export const applyDamageResistances = (
  damage: number, 
  damageType: string, 
  target: Target
): number => {
  if (hasImmunity(target, damageType)) {
    return 0;
  }
  
  if (hasResistance(target, damageType)) {
    return Math.floor(damage / 2);
  }
  
  if (hasVulnerability(target, damageType)) {
    return damage * 2;
  }
  
  return damage;
};

// Validate build completeness
export const isBuildValid = (build: Partial<Build>): build is Build => {
  return !!(
    build.id &&
    build.name &&
    build.levels?.length &&
    build.abilities &&
    build.proficiencyBonus !== undefined &&
    build.proficiencies &&
    build.equipment &&
    build.policies
  );
};

// Deep clone an object (for immutable operations)
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Capitalize first letter of a string
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Format a number as a percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Format a number with appropriate decimal places
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

// Clamp a number between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Check if two arrays are equal (shallow comparison)
export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  return a.length === b.length && a.every((val, i) => val === b[i]);
};

// Group array elements by a key function
export const groupBy = <T, K extends string | number | symbol>(
  array: T[], 
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    (groups[key] = groups[key] || []).push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

// Sort array by multiple criteria
export const sortBy = <T>(
  array: T[], 
  ...criteria: Array<(item: T) => number | string>
): T[] => {
  return array.slice().sort((a, b) => {
    for (const criterion of criteria) {
      const aVal = criterion(a);
      const bVal = criterion(b);
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
};

// Debounce function calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

// Throttle function calls
export const throttle = <T extends (...args: any[]) => any>(
  func: T, 
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Local storage helpers with error handling
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue || null;
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
};
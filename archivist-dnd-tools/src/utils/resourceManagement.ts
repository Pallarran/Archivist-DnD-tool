/**
 * Resource Management System for D&D 5e Combat Simulation
 * Handles spell slots, class resources, short/long rests, and optimization
 */

import type { SimpleBuild } from '../store/simpleStore';
import { calculateClassResources, type ClassResources } from './multiclassSpellcasting';

export interface ResourceState {
  // Current resource values
  current: ClassResources;
  // Maximum resource values (for reference)
  maximum: ClassResources;
  // Tracking usage patterns
  usageHistory: ResourceUsage[];
  // Combat state
  combatRound: number;
  encountersToday: number;
  restsSinceStart: {
    shortRests: number;
    longRests: number;
  };
}

export interface ResourceUsage {
  round: number;
  encounter: number;
  resource: string;
  amount: number;
  purpose: 'damage' | 'utility' | 'defense' | 'healing';
  efficiency: number; // DPR per resource used
}

export interface RestBenefit {
  resourcesRestored: Record<string, number>;
  totalValue: number; // Estimated DPR value of restored resources
  recommendation: 'take_now' | 'continue_fighting' | 'long_rest_needed';
  reasoning: string;
}

/**
 * Resource Management Engine
 */
export class ResourceManager {
  private state: ResourceState;
  
  constructor(build: SimpleBuild) {
    const maxResources = calculateClassResources(build, build.level);
    this.state = {
      current: { ...maxResources },
      maximum: { ...maxResources },
      usageHistory: [],
      combatRound: 0,
      encountersToday: 0,
      restsSinceStart: {
        shortRests: 0,
        longRests: 0
      }
    };
  }

  /**
   * Use a resource and track the usage
   */
  useResource(
    resource: keyof ClassResources, 
    amount: number, 
    purpose: ResourceUsage['purpose'] = 'damage',
    damageDealt: number = 0
  ): boolean {
    const currentAmount = this.getCurrentResource(resource);
    
    if (currentAmount < amount) {
      return false; // Not enough resources
    }

    // Deduct the resource
    this.modifyResource(resource, -amount);

    // Track usage
    const efficiency = damageDealt > 0 ? damageDealt / amount : 0;
    this.state.usageHistory.push({
      round: this.state.combatRound,
      encounter: this.state.encountersToday,
      resource: resource as string,
      amount,
      purpose,
      efficiency
    });

    return true;
  }

  /**
   * Get current amount of a resource
   */
  getCurrentResource(resource: keyof ClassResources): number {
    const value = this.state.current[resource];
    
    if (typeof value === 'number') {
      return value;
    } else if (typeof value === 'object' && value !== null) {
      if ('slots' in value) {
        return value.slots;
      } else if (typeof value === 'object') {
        return Object.values(value).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
      }
    } else if (Array.isArray(value)) {
      return value.length;
    }
    
    return 0;
  }

  /**
   * Modify a resource amount
   */
  private modifyResource(resource: keyof ClassResources, delta: number): void {
    const current = this.state.current[resource];
    
    if (resource === 'spellSlots' && typeof current === 'object' && current !== null) {
      // For spell slots, prioritize using higher level slots first (unless specified otherwise)
      const spellSlots = current as Record<number, number>;
      let remaining = Math.abs(delta);
      
      if (delta < 0) {
        // Using spell slots - start from highest level
        for (let level = 9; level >= 1 && remaining > 0; level--) {
          if (spellSlots[level] > 0) {
            const used = Math.min(remaining, spellSlots[level]);
            spellSlots[level] -= used;
            remaining -= used;
          }
        }
      } else {
        // Restoring spell slots - restore to lowest levels first
        for (let level = 1; level <= 9 && remaining > 0; level++) {
          const maxSlots = (this.state.maximum.spellSlots as Record<number, number>)[level] || 0;
          const currentSlots = spellSlots[level] || 0;
          const canRestore = Math.min(remaining, maxSlots - currentSlots);
          if (canRestore > 0) {
            spellSlots[level] = currentSlots + canRestore;
            remaining -= canRestore;
          }
        }
      }
    } else if (typeof current === 'number') {
      const newValue = Math.max(0, Math.min(
        current + delta,
        this.getMaximumResource(resource)
      ));
      (this.state.current as any)[resource] = newValue;
    }
  }

  /**
   * Get maximum amount of a resource
   */
  getMaximumResource(resource: keyof ClassResources): number {
    const value = this.state.maximum[resource];
    
    if (typeof value === 'number') {
      return value;
    } else if (typeof value === 'object' && value !== null) {
      if ('slots' in value) {
        return value.slots;
      } else if (typeof value === 'object') {
        return Object.values(value).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
      }
    } else if (Array.isArray(value)) {
      return value.length;
    }
    
    return 0;
  }

  /**
   * Take a short rest
   */
  takeShortRest(): RestBenefit {
    const resourcesRestored: Record<string, number> = {};
    let totalValue = 0;

    // Warlock spell slots
    if (this.state.maximum.warlockSlots) {
      const currentWarlock = this.state.current.warlockSlots;
      const maxWarlock = this.state.maximum.warlockSlots;
      if (currentWarlock && maxWarlock && currentWarlock.slots < maxWarlock.slots) {
        const restored = maxWarlock.slots - currentWarlock.slots;
        this.state.current.warlockSlots = { ...maxWarlock };
        resourcesRestored['Warlock Slots'] = restored;
        totalValue += restored * maxWarlock.level * 7; // Rough DPR value
      }
    }

    // Action Surge
    if (this.state.current.actionSurges < this.state.maximum.actionSurges) {
      const restored = this.state.maximum.actionSurges - this.state.current.actionSurges;
      this.state.current.actionSurges = this.state.maximum.actionSurges;
      resourcesRestored['Action Surge'] = restored;
      totalValue += restored * 20; // High DPR value for action surge
    }

    // Superiority Dice
    if (this.state.current.superiorityDice < this.state.maximum.superiorityDice) {
      const restored = this.state.maximum.superiorityDice - this.state.current.superiorityDice;
      this.state.current.superiorityDice = this.state.maximum.superiorityDice;
      resourcesRestored['Superiority Dice'] = restored;
      totalValue += restored * 8; // Average damage boost per die
    }

    // Channel Divinity
    if (this.state.current.channelDivinityUses < this.state.maximum.channelDivinityUses) {
      const restored = this.state.maximum.channelDivinityUses - this.state.current.channelDivinityUses;
      this.state.current.channelDivinityUses = this.state.maximum.channelDivinityUses;
      resourcesRestored['Channel Divinity'] = restored;
      totalValue += restored * 15; // Varies by domain, estimate
    }

    this.state.restsSinceStart.shortRests++;

    const recommendation = this.getRestRecommendation('short', totalValue);

    return {
      resourcesRestored,
      totalValue,
      recommendation: recommendation.recommendation,
      reasoning: recommendation.reasoning
    };
  }

  /**
   * Take a long rest
   */
  takeLongRest(): RestBenefit {
    const resourcesRestored: Record<string, number> = {};
    let totalValue = 0;

    // Restore all resources to maximum
    for (const [key, maxValue] of Object.entries(this.state.maximum)) {
      const currentValue = this.state.current[key as keyof ClassResources];
      
      if (typeof maxValue === 'number' && typeof currentValue === 'number') {
        if (currentValue < maxValue) {
          const restored = maxValue - currentValue;
          resourcesRestored[key] = restored;
          totalValue += restored * this.getResourceValue(key as keyof ClassResources);
          (this.state.current as any)[key] = maxValue;
        }
      } else if (key === 'spellSlots' && typeof maxValue === 'object' && typeof currentValue === 'object') {
        const maxSlots = maxValue as Record<number, number>;
        const currentSlots = currentValue as Record<number, number>;
        let totalRestored = 0;
        
        for (const [level, maxCount] of Object.entries(maxSlots)) {
          const currentCount = currentSlots[level] || 0;
          if (currentCount < maxCount) {
            const restored = maxCount - currentCount;
            currentSlots[level] = maxCount;
            totalRestored += restored;
            totalValue += restored * parseInt(level) * 7; // DPR value by spell level
          }
        }
        
        if (totalRestored > 0) {
          resourcesRestored['Spell Slots'] = totalRestored;
        }
      }
    }

    this.state.restsSinceStart.longRests++;
    this.state.encountersToday = 0; // Reset encounter count

    return {
      resourcesRestored,
      totalValue,
      recommendation: 'take_now',
      reasoning: 'Long rest restores all resources - always beneficial'
    };
  }

  /**
   * Get estimated DPR value of a resource
   */
  private getResourceValue(resource: keyof ClassResources): number {
    switch (resource) {
      case 'actionSurges': return 25;
      case 'superiorityDice': return 8;
      case 'kiPoints': return 6;
      case 'rageUses': return 15;
      case 'sorceryPoints': return 5;
      case 'channelDivinityUses': return 15;
      case 'bardInspiration': return 4;
      default: return 5;
    }
  }

  /**
   * Get rest recommendation based on current state
   */
  private getRestRecommendation(restType: 'short' | 'long', restoredValue: number): {
    recommendation: RestBenefit['recommendation'];
    reasoning: string;
  } {
    const resourcePercentage = this.calculateResourcePercentage();
    
    if (restType === 'long') {
      if (resourcePercentage < 0.3) {
        return {
          recommendation: 'take_now',
          reasoning: 'Less than 30% resources remaining - long rest highly recommended'
        };
      } else if (this.state.encountersToday >= 6) {
        return {
          recommendation: 'take_now',
          reasoning: '6+ encounters completed - standard adventuring day complete'
        };
      } else {
        return {
          recommendation: 'continue_fighting',
          reasoning: 'Still have significant resources for more encounters'
        };
      }
    } else {
      if (restoredValue >= 30) {
        return {
          recommendation: 'take_now',
          reasoning: `Short rest would restore ${restoredValue.toFixed(0)} DPR worth of resources`
        };
      } else if (resourcePercentage < 0.5) {
        return {
          recommendation: 'take_now',
          reasoning: 'Less than 50% short-rest resources remaining'
        };
      } else {
        return {
          recommendation: 'continue_fighting',
          reasoning: 'Limited benefit from short rest at current resource levels'
        };
      }
    }
  }

  /**
   * Calculate overall resource percentage remaining
   */
  calculateResourcePercentage(): number {
    let totalCurrent = 0;
    let totalMaximum = 0;

    for (const resource of Object.keys(this.state.maximum) as (keyof ClassResources)[]) {
      const current = this.getCurrentResource(resource);
      const maximum = this.getMaximumResource(resource);
      
      if (maximum > 0) {
        totalCurrent += current;
        totalMaximum += maximum;
      }
    }

    return totalMaximum > 0 ? totalCurrent / totalMaximum : 1;
  }

  /**
   * Get optimal resource usage strategy
   */
  getResourceStrategy(encountersRemaining: number, targetAC: number): {
    strategy: string;
    recommendations: string[];
    spellSlotPriority: number[];
    resourcePriority: string[];
  } {
    const resourcePercentage = this.calculateResourcePercentage();
    const recommendations: string[] = [];
    
    let strategy = 'balanced';
    
    if (encountersRemaining <= 1) {
      strategy = 'nova';
      recommendations.push('Use all remaining high-value resources');
      recommendations.push('Prioritize highest damage options');
    } else if (resourcePercentage > 0.8) {
      strategy = 'aggressive';
      recommendations.push('Use resources liberally');
      recommendations.push('Focus on encounter-ending damage');
    } else if (resourcePercentage < 0.3) {
      strategy = 'conservative';
      recommendations.push('Conserve resources for critical moments');
      recommendations.push('Prioritize weapon attacks over spells');
    }

    // Spell slot priority (higher level first for damage, lower level for utility)
    const spellSlotPriority = strategy === 'nova' ? [9,8,7,6,5,4,3,2,1] : [3,2,4,1,5,6,7,8,9];
    
    // Resource priority based on regeneration and impact
    const resourcePriority = [
      'actionSurges',      // Highest impact, short rest
      'superiorityDice',   // High impact, short rest
      'spellSlots',        // High impact, long rest
      'channelDivinityUses', // Medium impact, short rest
      'kiPoints',          // Medium impact, short rest
      'sorceryPoints',     // Flexible, long rest
      'rageUses',          // Sustained benefit, long rest
      'bardInspiration'    // Support benefit, short rest
    ];

    return {
      strategy,
      recommendations,
      spellSlotPriority,
      resourcePriority
    };
  }

  /**
   * Advance to next round
   */
  nextRound(): void {
    this.state.combatRound++;
  }

  /**
   * Advance to next encounter
   */
  nextEncounter(): void {
    this.state.encountersToday++;
    this.state.combatRound = 0;
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<ResourceState> {
    return { ...this.state };
  }

  /**
   * Get resource efficiency analysis
   */
  getEfficiencyAnalysis(): {
    mostEfficient: string;
    leastEfficient: string;
    averageEfficiency: Record<string, number>;
    recommendations: string[];
  } {
    const efficiencyByResource: Record<string, number[]> = {};
    
    // Group usage history by resource
    for (const usage of this.state.usageHistory) {
      if (!efficiencyByResource[usage.resource]) {
        efficiencyByResource[usage.resource] = [];
      }
      if (usage.efficiency > 0) {
        efficiencyByResource[usage.resource].push(usage.efficiency);
      }
    }

    // Calculate averages
    const averageEfficiency: Record<string, number> = {};
    for (const [resource, efficiencies] of Object.entries(efficiencyByResource)) {
      if (efficiencies.length > 0) {
        averageEfficiency[resource] = efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length;
      }
    }

    const sortedResources = Object.entries(averageEfficiency)
      .sort(([,a], [,b]) => b - a);

    const recommendations: string[] = [];
    
    if (sortedResources.length > 0) {
      recommendations.push(`Most efficient: ${sortedResources[0][0]} (${sortedResources[0][1].toFixed(1)} DPR per use)`);
      
      if (sortedResources.length > 1) {
        const least = sortedResources[sortedResources.length - 1];
        recommendations.push(`Least efficient: ${least[0]} (${least[1].toFixed(1)} DPR per use)`);
        recommendations.push(`Consider using ${sortedResources[0][0]} more and ${least[0]} less`);
      }
    }

    return {
      mostEfficient: sortedResources[0]?.[0] || 'None',
      leastEfficient: sortedResources[sortedResources.length - 1]?.[0] || 'None',
      averageEfficiency,
      recommendations
    };
  }
}
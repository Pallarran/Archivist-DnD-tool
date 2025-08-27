/**
 * Advanced Policy Engine with Sophisticated Decision Making
 * Uses machine learning-inspired techniques for optimal combat decisions
 */

import type { Build, Target, CombatState } from '../types/build';
import type { Effect } from '../types/effects';

// Policy weight configuration
export interface PolicyWeights {
  damageMaximization: number;
  resourceConservation: number;
  riskAversion: number;
  targetPrioritization: number;
  actionEconomyOptimization: number;
  conditionManagement: number;
}

// Decision context for policy evaluation
export interface DecisionContext {
  currentState: CombatState;
  availableActions: ActionOption[];
  targets: Target[];
  allies: any[];
  environment: EnvironmentalFactors;
  encounterProgress: {
    currentRound: number;
    expectedDuration: number;
    resourcesRemaining: Record<string, number>;
    threatLevel: number;
  };
}

// Action evaluation result
export interface ActionEvaluation {
  action: ActionOption;
  expectedValue: number;
  riskFactor: number;
  resourceCost: number;
  opportunityCost: number;
  longTermValue: number;
  confidence: number;
  breakdown: {
    damage: number;
    utility: number;
    efficiency: number;
    positioning: number;
    synergy: number;
  };
}

// Available action types
export interface ActionOption {
  type: 'attack' | 'spell' | 'movement' | 'item' | 'special';
  name: string;
  actionCost: 'action' | 'bonus' | 'reaction' | 'movement' | 'free';
  target?: Target;
  parameters?: Record<string, any>;
  requirements?: Array<{
    type: 'resource' | 'positioning' | 'condition';
    value: any;
  }>;
  effects?: Effect[];
}

export interface EnvironmentalFactors {
  lighting: 'bright' | 'dim' | 'darkness';
  terrain: 'normal' | 'difficult' | 'hazardous';
  weather: 'clear' | 'rain' | 'fog' | 'storm';
  cover: Record<string, 'none' | 'half' | 'three-quarters' | 'full'>;
  hazards: string[];
}

/**
 * Advanced Policy Engine using multi-criteria decision analysis
 */
export class AdvancedPolicyEngine {
  private weights: PolicyWeights;
  private learningData: Array<{
    context: DecisionContext;
    decision: ActionOption;
    outcome: number;
  }> = [];

  constructor(weights: Partial<PolicyWeights> = {}) {
    this.weights = {
      damageMaximization: 0.4,
      resourceConservation: 0.2,
      riskAversion: 0.15,
      targetPrioritization: 0.1,
      actionEconomyOptimization: 0.1,
      conditionManagement: 0.05,
      ...weights
    };
  }

  /**
   * Select optimal action from available options
   */
  selectOptimalAction(context: DecisionContext): ActionOption {
    // Evaluate all available actions
    const evaluations = context.availableActions.map(action => 
      this.evaluateAction(action, context)
    );

    // Sort by expected value
    evaluations.sort((a, b) => b.expectedValue - a.expectedValue);

    // Apply policy constraints and preferences
    const filteredEvaluations = this.applyPolicyConstraints(evaluations, context);

    // Select best action with confidence weighting
    const bestAction = this.selectWithConfidence(filteredEvaluations);

    // Record decision for learning
    this.recordDecision(context, bestAction.action);

    return bestAction.action;
  }

  /**
   * Evaluate a single action option
   */
  private evaluateAction(action: ActionOption, context: DecisionContext): ActionEvaluation {
    const damage = this.calculateDamageValue(action, context);
    const utility = this.calculateUtilityValue(action, context);
    const efficiency = this.calculateEfficiencyValue(action, context);
    const positioning = this.calculatePositioningValue(action, context);
    const synergy = this.calculateSynergyValue(action, context);

    // Resource cost analysis
    const resourceCost = this.calculateResourceCost(action, context);
    const opportunityCost = this.calculateOpportunityCost(action, context);

    // Risk assessment
    const riskFactor = this.calculateRiskFactor(action, context);

    // Long-term value consideration
    const longTermValue = this.calculateLongTermValue(action, context);

    // Weighted expected value
    const expectedValue = this.calculateExpectedValue({
      damage,
      utility,
      efficiency,
      positioning,
      synergy
    }, context);

    // Confidence based on historical performance and certainty
    const confidence = this.calculateConfidence(action, context);

    return {
      action,
      expectedValue,
      riskFactor,
      resourceCost,
      opportunityCost,
      longTermValue,
      confidence,
      breakdown: {
        damage,
        utility,
        efficiency,
        positioning,
        synergy
      }
    };
  }

  /**
   * Calculate damage value of an action
   */
  private calculateDamageValue(action: ActionOption, context: DecisionContext): number {
    switch (action.type) {
      case 'attack':
        return this.calculateAttackDamage(action, context);
      case 'spell':
        return this.calculateSpellDamage(action, context);
      default:
        return 0;
    }
  }

  private calculateAttackDamage(action: ActionOption, context: DecisionContext): number {
    // Get target information
    const target = action.target;
    if (!target) return 0;

    // Calculate hit probability
    const attackBonus = this.getAttackBonus(action, context);
    const baseHitChance = Math.max(0.05, Math.min(0.95, (21 - (target.armorClass - attackBonus)) / 20));
    
    // Apply advantage/disadvantage
    const advantageState = this.getAdvantageState(action, context);
    const hitChance = this.adjustForAdvantage(baseHitChance, advantageState);

    // Calculate damage
    const baseDamage = this.getBaseDamage(action, context);
    const critChance = this.getCritChance(action, context);
    const critDamage = this.getCritDamage(action, context);

    // Expected damage = (hit chance * base damage) + (crit chance * crit bonus damage)
    const expectedDamage = (hitChance * baseDamage) + (critChance * critDamage);

    // Apply resistances/vulnerabilities
    return this.applyDamageModifiers(expectedDamage, action, target);
  }

  private calculateSpellDamage(action: ActionOption, context: DecisionContext): number {
    // Implementation depends on spell type (attack roll vs saving throw)
    const spellLevel = action.parameters?.spellLevel || 1;
    const baseDamage = action.parameters?.damage || 0;
    
    if (action.parameters?.attackSpell) {
      // Spell attack
      const spellAttackBonus = this.getSpellAttackBonus(action, context);
      const target = action.target;
      if (!target) return 0;

      const hitChance = Math.max(0.05, Math.min(0.95, (21 - (target.armorClass - spellAttackBonus)) / 20));
      return hitChance * baseDamage;
    } else {
      // Saving throw spell
      const saveDC = this.getSpellSaveDC(action, context);
      const saveBonus = this.getTargetSaveBonus(action, context);
      const saveChance = Math.max(0.05, Math.min(0.95, (saveBonus + 11 - saveDC) / 20));
      
      if (action.parameters?.saveForHalf) {
        return baseDamage * (1 - saveChance) + (baseDamage * 0.5 * saveChance);
      } else {
        return baseDamage * (1 - saveChance);
      }
    }
  }

  /**
   * Calculate utility value (healing, buffing, control)
   */
  private calculateUtilityValue(action: ActionOption, context: DecisionContext): number {
    let utility = 0;

    // Healing value
    if (action.parameters?.healing) {
      const healingNeeded = this.getHealingNeeded(context);
      utility += Math.min(action.parameters.healing, healingNeeded) * 0.8;
    }

    // Buff value
    if (action.parameters?.buffs) {
      utility += this.calculateBuffValue(action.parameters.buffs, context);
    }

    // Control value
    if (action.parameters?.conditions) {
      utility += this.calculateControlValue(action.parameters.conditions, context);
    }

    // Defensive value
    if (action.parameters?.defensive) {
      utility += this.calculateDefensiveValue(action, context);
    }

    return utility;
  }

  /**
   * Calculate resource efficiency
   */
  private calculateEfficiencyValue(action: ActionOption, context: DecisionContext): number {
    const resourceCost = this.calculateResourceCost(action, context);
    const totalValue = this.calculateTotalActionValue(action, context);
    
    if (resourceCost === 0) return totalValue;
    return totalValue / resourceCost;
  }

  /**
   * Calculate positioning value
   */
  private calculatePositioningValue(action: ActionOption, context: DecisionContext): number {
    // Consider movement options, cover, flanking, etc.
    let positioningValue = 0;

    // Movement to advantageous position
    if (action.type === 'movement') {
      positioningValue += this.calculateMovementAdvantage(action, context);
    }

    // Positioning for future turns
    positioningValue += this.calculateFuturePositioningValue(action, context);

    return positioningValue;
  }

  /**
   * Calculate synergy with other abilities/party members
   */
  private calculateSynergyValue(action: ActionOption, context: DecisionContext): number {
    let synergy = 0;

    // Combo potential with other abilities
    synergy += this.calculateComboValue(action, context);

    // Party synergy
    synergy += this.calculatePartySynergy(action, context);

    // Setup for future turns
    synergy += this.calculateSetupValue(action, context);

    return synergy;
  }

  /**
   * Apply policy constraints and preferences
   */
  private applyPolicyConstraints(
    evaluations: ActionEvaluation[], 
    context: DecisionContext
  ): ActionEvaluation[] {
    return evaluations.filter(evaluation => {
      // Resource conservation constraints
      if (this.weights.resourceConservation > 0.3) {
        if (evaluation.resourceCost > this.getResourceThreshold(context)) {
          return false;
        }
      }

      // Risk aversion constraints
      if (this.weights.riskAversion > 0.3) {
        if (evaluation.riskFactor > this.getRiskThreshold(context)) {
          return false;
        }
      }

      // Action economy constraints
      if (!this.isActionEconomyEfficient(evaluation.action, context)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Select action with confidence weighting
   */
  private selectWithConfidence(evaluations: ActionEvaluation[]): ActionEvaluation {
    if (evaluations.length === 0) {
      throw new Error('No valid actions available');
    }

    // Weight expected value by confidence
    const weightedEvaluations = evaluations.map(eval => ({
      ...eval,
      weightedValue: eval.expectedValue * eval.confidence
    }));

    // Select best weighted option
    return weightedEvaluations.reduce((best, current) =>
      current.weightedValue > best.weightedValue ? current : best
    );
  }

  /**
   * Calculate weighted expected value
   */
  private calculateExpectedValue(breakdown: ActionEvaluation['breakdown'], context: DecisionContext): number {
    return (
      breakdown.damage * this.weights.damageMaximization +
      breakdown.utility * 0.3 +
      breakdown.efficiency * 0.25 +
      breakdown.positioning * 0.15 +
      breakdown.synergy * 0.2
    );
  }

  // Helper methods for calculations

  private getAttackBonus(action: ActionOption, context: DecisionContext): number {
    // Implementation depends on build and action
    return action.parameters?.attackBonus || 5;
  }

  private getAdvantageState(action: ActionOption, context: DecisionContext): 'normal' | 'advantage' | 'disadvantage' {
    // Analyze conditions, positioning, etc.
    return 'normal';
  }

  private adjustForAdvantage(baseChance: number, advantage: 'normal' | 'advantage' | 'disadvantage'): number {
    switch (advantage) {
      case 'advantage':
        return 1 - Math.pow(1 - baseChance, 2);
      case 'disadvantage':
        return Math.pow(baseChance, 2);
      default:
        return baseChance;
    }
  }

  private getBaseDamage(action: ActionOption, context: DecisionContext): number {
    return action.parameters?.baseDamage || 8;
  }

  private getCritChance(action: ActionOption, context: DecisionContext): number {
    return action.parameters?.critChance || 0.05;
  }

  private getCritDamage(action: ActionOption, context: DecisionContext): number {
    return action.parameters?.critDamage || this.getBaseDamage(action, context);
  }

  private applyDamageModifiers(damage: number, action: ActionOption, target: Target): number {
    // Apply resistances, immunities, vulnerabilities
    const damageType = action.parameters?.damageType || 'physical';
    
    if (target.immunities.includes(damageType)) return 0;
    if (target.resistances.includes(damageType)) return damage * 0.5;
    if (target.vulnerabilities.includes(damageType)) return damage * 2;
    
    return damage;
  }

  private getSpellAttackBonus(action: ActionOption, context: DecisionContext): number {
    return action.parameters?.spellAttackBonus || 7;
  }

  private getSpellSaveDC(action: ActionOption, context: DecisionContext): number {
    return action.parameters?.saveDC || 15;
  }

  private getTargetSaveBonus(action: ActionOption, context: DecisionContext): number {
    const saveType = action.parameters?.saveType || 'dexterity';
    return action.target?.savingThrows?.[saveType] || 0;
  }

  private calculateResourceCost(action: ActionOption, context: DecisionContext): number {
    let cost = 0;
    
    // Spell slot cost
    if (action.parameters?.spellSlot) {
      cost += action.parameters.spellSlot * 2; // Weight by slot level
    }
    
    // Other resource costs
    if (action.parameters?.resourceCost) {
      cost += action.parameters.resourceCost;
    }
    
    return cost;
  }

  private calculateOpportunityCost(action: ActionOption, context: DecisionContext): number {
    // Cost of not taking other high-value actions
    const alternativeActions = context.availableActions.filter(a => a !== action);
    if (alternativeActions.length === 0) return 0;
    
    const bestAlternative = Math.max(...alternativeActions.map(a => 
      this.calculateDamageValue(a, context)
    ));
    
    return Math.max(0, bestAlternative - this.calculateDamageValue(action, context));
  }

  private calculateRiskFactor(action: ActionOption, context: DecisionContext): number {
    // Risk of failure, counterattack, resource waste, etc.
    let risk = 0;
    
    // Miss chance
    if (action.type === 'attack') {
      const hitChance = this.calculateAttackDamage(action, context) / this.getBaseDamage(action, context);
      risk += (1 - hitChance) * 0.5;
    }
    
    // Positioning risk
    risk += this.calculatePositioningRisk(action, context);
    
    // Resource waste risk
    risk += this.calculateResourceWasteRisk(action, context);
    
    return Math.min(1, risk);
  }

  private calculateLongTermValue(action: ActionOption, context: DecisionContext): number {
    // Value beyond current turn
    let longTermValue = 0;
    
    // Persistent effects
    if (action.parameters?.duration) {
      longTermValue += this.calculatePersistentEffectValue(action, context);
    }
    
    // Setup for future combos
    longTermValue += this.calculateSetupValue(action, context);
    
    return longTermValue;
  }

  private calculateConfidence(action: ActionOption, context: DecisionContext): number {
    // Confidence based on historical success and certainty of calculations
    let confidence = 0.8; // Base confidence
    
    // Reduce confidence for complex interactions
    if (action.effects && action.effects.length > 2) {
      confidence *= 0.9;
    }
    
    // Increase confidence for well-understood actions
    if (action.type === 'attack') {
      confidence *= 1.1;
    }
    
    return Math.min(1, confidence);
  }

  // Additional helper methods (simplified implementations)
  private getHealingNeeded(context: DecisionContext): number { return 20; }
  private calculateBuffValue(buffs: any[], context: DecisionContext): number { return 15; }
  private calculateControlValue(conditions: string[], context: DecisionContext): number { return 25; }
  private calculateDefensiveValue(action: ActionOption, context: DecisionContext): number { return 10; }
  private calculateTotalActionValue(action: ActionOption, context: DecisionContext): number { return 30; }
  private calculateMovementAdvantage(action: ActionOption, context: DecisionContext): number { return 5; }
  private calculateFuturePositioningValue(action: ActionOption, context: DecisionContext): number { return 8; }
  private calculateComboValue(action: ActionOption, context: DecisionContext): number { return 12; }
  private calculatePartySynergy(action: ActionOption, context: DecisionContext): number { return 10; }
  private calculateSetupValue(action: ActionOption, context: DecisionContext): number { return 6; }
  private getResourceThreshold(context: DecisionContext): number { return 15; }
  private getRiskThreshold(context: DecisionContext): number { return 0.6; }
  private isActionEconomyEfficient(action: ActionOption, context: DecisionContext): boolean { return true; }
  private calculatePositioningRisk(action: ActionOption, context: DecisionContext): number { return 0.1; }
  private calculateResourceWasteRisk(action: ActionOption, context: DecisionContext): number { return 0.1; }
  private calculatePersistentEffectValue(action: ActionOption, context: DecisionContext): number { return 20; }

  /**
   * Record decision for learning and optimization
   */
  private recordDecision(context: DecisionContext, decision: ActionOption): void {
    // Store decision data for future learning (simplified)
    this.learningData.push({
      context: { ...context },
      decision,
      outcome: 0 // Would be filled in after seeing results
    });
    
    // Keep learning data size manageable
    if (this.learningData.length > 1000) {
      this.learningData = this.learningData.slice(-500);
    }
  }

  /**
   * Update policy weights based on performance feedback
   */
  updateWeights(feedback: { success: boolean; actualOutcome: number; expectedOutcome: number }): void {
    const error = feedback.actualOutcome - feedback.expectedOutcome;
    const learningRate = 0.01;
    
    // Simple weight adjustment based on prediction error
    if (Math.abs(error) > 5) {
      if (feedback.success) {
        // Increase weight for successful predictions
        this.weights.damageMaximization += learningRate;
      } else {
        // Decrease weight for failed predictions
        this.weights.damageMaximization -= learningRate;
      }
      
      // Normalize weights
      const total = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
      Object.keys(this.weights).forEach(key => {
        this.weights[key as keyof PolicyWeights] /= total;
      });
    }
  }

  /**
   * Export policy configuration
   */
  exportPolicy(): { weights: PolicyWeights; learningDataSize: number } {
    return {
      weights: { ...this.weights },
      learningDataSize: this.learningData.length
    };
  }

  /**
   * Import policy configuration
   */
  importPolicy(config: { weights: PolicyWeights }): void {
    this.weights = { ...config.weights };
  }
}
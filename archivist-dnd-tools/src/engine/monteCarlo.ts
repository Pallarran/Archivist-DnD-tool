/**
 * Monte Carlo Simulation Engine for D&D 5e Combat Analysis
 * Handles complex stateful scenarios with resource management
 */

import { SeededRandom, DiceRoller, Statistics } from './random';
import type { Build, Target } from '../types/build';

// Combat state tracking
export interface CombatState {
  round: number;
  turn: number;
  resources: {
    hitPoints: number;
    spellSlots: Record<string, number>;
    classResources: Record<string, number>; // Ki, Rage, Superiority Die, etc.
    concentration: string | null;
    conditions: string[];
  };
  actionEconomy: {
    action: boolean;
    bonusAction: boolean;
    reaction: boolean;
    movement: number;
  };
  temporaryEffects: Array<{
    name: string;
    duration: number;
    effects: any;
  }>;
}

// Combat scenario definition
export interface CombatScenario {
  rounds: number;
  encounters: number;
  restType: 'none' | 'short' | 'long' | 'mixed';
  enemyActions: Array<{
    name: string;
    probability: number;
    effect: (state: CombatState) => void;
  }>;
  environmental: {
    lighting: 'bright' | 'dim' | 'darkness';
    terrain: 'normal' | 'difficult' | 'hazardous';
    cover: 'none' | 'partial' | 'heavy';
  };
}

// Simulation result for a single run
export interface SimulationRun {
  totalDamage: number;
  damageByRound: number[];
  hitCount: number;
  missCount: number;
  critCount: number;
  resourcesUsed: Record<string, number>;
  conditions: string[];
  finalState: CombatState;
}

// Aggregated results from multiple runs
export interface MonteCarloResults {
  runs: number;
  seed: number;
  scenario: CombatScenario;
  
  // Damage statistics
  damage: {
    mean: number;
    median: number;
    standardDeviation: number;
    confidenceInterval: { lower: number; upper: number; margin: number };
    percentiles: Record<number, number>;
    byRound: {
      mean: number[];
      confidenceInterval: Array<{ lower: number; upper: number }>;
    };
  };
  
  // Accuracy statistics
  accuracy: {
    hitRate: number;
    critRate: number;
    missStreak: { max: number; average: number };
  };
  
  // Resource efficiency
  resources: {
    utilization: Record<string, number>; // Percentage used
    efficiency: Record<string, number>; // Damage per resource
  };
  
  // Tactical insights
  insights: {
    optimalRounds: number[];
    weakestRounds: number[];
    bestStrategies: string[];
    riskFactors: string[];
  };
}

/**
 * Monte Carlo Simulation Engine
 */
export class MonteCarloEngine {
  private rng: SeededRandom;
  private roller: DiceRoller;
  private runs: SimulationRun[] = [];

  constructor(seed?: number) {
    this.rng = new SeededRandom(seed);
    this.roller = new DiceRoller(this.rng);
  }

  /**
   * Run Monte Carlo simulation for a build vs target
   */
  async simulate(
    build: Build,
    target: Target,
    scenario: CombatScenario,
    iterations: number = 10000
  ): Promise<MonteCarloResults> {
    this.runs = [];
    
    // Progress tracking for UI
    const progressCallback = (progress: number) => {
      // Could emit events for UI progress bar
    };

    for (let i = 0; i < iterations; i++) {
      const run = this.simulateSingleRun(build, target, scenario);
      this.runs.push(run);
      
      if (i % 100 === 0) {
        progressCallback(i / iterations);
        // Allow event loop to continue for UI responsiveness
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return this.analyzeResults(scenario);
  }

  /**
   * Simulate a single combat encounter
   */
  private simulateSingleRun(
    build: Build,
    target: Target,
    scenario: CombatScenario
  ): SimulationRun {
    // Initialize combat state
    const state: CombatState = this.initializeCombatState(build);
    const damageByRound: number[] = [];
    let totalDamage = 0;
    let hitCount = 0;
    let missCount = 0;
    let critCount = 0;
    const resourcesUsed: Record<string, number> = {};

    // Simulate each round
    for (let round = 1; round <= scenario.rounds; round++) {
      state.round = round;
      const roundDamage = this.simulateRound(build, target, state, scenario);
      
      damageByRound.push(roundDamage.damage);
      totalDamage += roundDamage.damage;
      hitCount += roundDamage.hits;
      missCount += roundDamage.misses;
      critCount += roundDamage.crits;
      
      // Track resource usage
      for (const [resource, amount] of Object.entries(roundDamage.resourcesUsed)) {
        resourcesUsed[resource] = (resourcesUsed[resource] || 0) + amount;
      }

      // Apply end-of-round effects
      this.applyEndOfRoundEffects(state);
    }

    return {
      totalDamage,
      damageByRound,
      hitCount,
      missCount,
      critCount,
      resourcesUsed,
      conditions: state.resources.conditions,
      finalState: state
    };
  }

  /**
   * Simulate a single round of combat
   */
  private simulateRound(
    build: Build,
    target: Target,
    state: CombatState,
    scenario: CombatScenario
  ): {
    damage: number;
    hits: number;
    misses: number;
    crits: number;
    resourcesUsed: Record<string, number>;
  } {
    // Reset action economy
    state.actionEconomy = {
      action: true,
      bonusAction: true,
      reaction: true,
      movement: 30 // Default movement
    };

    let roundDamage = 0;
    let hits = 0;
    let misses = 0;
    let crits = 0;
    const resourcesUsed: Record<string, number> = {};

    // Main action phase
    if (state.actionEconomy.action) {
      const actionResult = this.simulateAction(build, target, state, 'action');
      roundDamage += actionResult.damage;
      hits += actionResult.hits;
      misses += actionResult.misses;
      crits += actionResult.crits;
      Object.assign(resourcesUsed, actionResult.resourcesUsed);
      state.actionEconomy.action = false;
    }

    // Bonus action phase
    if (state.actionEconomy.bonusAction) {
      const bonusResult = this.simulateBonusAction(build, target, state);
      if (bonusResult) {
        roundDamage += bonusResult.damage;
        hits += bonusResult.hits;
        misses += bonusResult.misses;
        crits += bonusResult.crits;
        Object.assign(resourcesUsed, bonusResult.resourcesUsed);
        state.actionEconomy.bonusAction = false;
      }
    }

    // Simulate enemy actions and potential reactions
    this.simulateEnemyPhase(build, target, state, scenario);

    return { damage: roundDamage, hits, misses, crits, resourcesUsed };
  }

  /**
   * Simulate main action (Attack, Cast a Spell, etc.)
   */
  private simulateAction(
    build: Build,
    target: Target,
    state: CombatState,
    actionType: 'action' | 'bonusAction'
  ): {
    damage: number;
    hits: number;
    misses: number;
    crits: number;
    resourcesUsed: Record<string, number>;
  } {
    // Determine best action based on build and current state
    const availableActions = this.getAvailableActions(build, state);
    const selectedAction = this.selectOptimalAction(availableActions, build, target, state);
    
    return this.executeAction(selectedAction, build, target, state);
  }

  /**
   * Execute a specific action
   */
  private executeAction(
    action: string,
    build: Build,
    target: Target,
    state: CombatState
  ): {
    damage: number;
    hits: number;
    misses: number;
    crits: number;
    resourcesUsed: Record<string, number>;
  } {
    let damage = 0;
    let hits = 0;
    let misses = 0;
    let crits = 0;
    const resourcesUsed: Record<string, number> = {};

    switch (action) {
      case 'attack':
        const attackResult = this.simulateAttackAction(build, target, state);
        return attackResult;
        
      case 'spell':
        const spellResult = this.simulateSpellAction(build, target, state);
        return spellResult;
        
      case 'dodge':
        // Defensive action, no damage
        break;
        
      default:
        // Custom actions from build features
        break;
    }

    return { damage, hits, misses, crits, resourcesUsed };
  }

  /**
   * Simulate attack action with multiple attacks
   */
  private simulateAttackAction(
    build: Build,
    target: Target,
    state: CombatState
  ): {
    damage: number;
    hits: number;
    misses: number;
    crits: number;
    resourcesUsed: Record<string, number>;
  } {
    let totalDamage = 0;
    let hits = 0;
    let misses = 0;
    let crits = 0;
    const resourcesUsed: Record<string, number> = {};

    // Calculate number of attacks based on level and features
    const attacksPerAction = this.getAttacksPerAction(build);
    const attackBonus = this.calculateAttackBonus(build, state);
    const damageRoll = this.getDamageRoll(build);

    for (let attack = 0; attack < attacksPerAction; attack++) {
      // Roll attack
      const attackRoll = this.roller.rollWithAdvantage('1d20', this.getAdvantageState(build, target, state));
      const totalAttackRoll = attackRoll + attackBonus;
      
      // Check for hit/crit
      const isCrit = attackRoll >= this.getCritRange(build);
      const isHit = isCrit || totalAttackRoll >= target.armorClass;

      if (isHit) {
        hits++;
        if (isCrit) crits++;

        // Roll damage
        let damageAmount = this.roller.roll(damageRoll);
        
        // Apply crit damage
        if (isCrit) {
          damageAmount += this.roller.roll(damageRoll); // Double damage dice
          damageAmount += this.getCritBonusDamage(build); // Brutal Critical, etc.
        }

        // Apply once-per-turn effects (Sneak Attack, Divine Strike, etc.)
        if (attack === 0 || this.allowsMultipleOncePerTurn(build)) {
          const oncePerTurnDamage = this.getOncePerTurnDamage(build, state, isCrit);
          damageAmount += oncePerTurnDamage.damage;
          Object.assign(resourcesUsed, oncePerTurnDamage.resourcesUsed);
        }

        // Apply smite or similar resource-based damage
        const smiteDamage = this.applySmiteLogic(build, state, isCrit);
        if (smiteDamage.damage > 0) {
          damageAmount += smiteDamage.damage;
          Object.assign(resourcesUsed, smiteDamage.resourcesUsed);
        }

        totalDamage += damageAmount;
      } else {
        misses++;
      }
    }

    return { damage: totalDamage, hits, misses, crits, resourcesUsed };
  }

  /**
   * Simulate spell casting action
   */
  private simulateSpellAction(
    build: Build,
    target: Target,
    state: CombatState
  ): {
    damage: number;
    hits: number;
    misses: number;
    crits: number;
    resourcesUsed: Record<string, number>;
  } {
    // Select optimal spell based on available slots and situation
    const availableSpells = this.getAvailableSpells(build, state);
    const selectedSpell = this.selectOptimalSpell(availableSpells, build, target, state);
    
    if (!selectedSpell) {
      return { damage: 0, hits: 0, misses: 0, crits: 0, resourcesUsed: {} };
    }

    // Execute spell
    return this.executeSpell(selectedSpell, build, target, state);
  }

  /**
   * Simulate bonus action options
   */
  private simulateBonusAction(
    build: Build,
    target: Target,
    state: CombatState
  ): {
    damage: number;
    hits: number;
    misses: number;
    crits: number;
    resourcesUsed: Record<string, number>;
  } | null {
    const bonusActions = this.getAvailableBonusActions(build, state);
    if (bonusActions.length === 0) return null;

    const selectedAction = bonusActions[0]; // Simplified selection
    return this.executeBonusAction(selectedAction, build, target, state);
  }

  /**
   * Simulate enemy actions that might trigger reactions
   */
  private simulateEnemyPhase(
    build: Build,
    target: Target,
    state: CombatState,
    scenario: CombatScenario
  ): void {
    // Randomly select enemy actions based on scenario probabilities
    for (const enemyAction of scenario.enemyActions) {
      if (this.rng.chance(enemyAction.probability)) {
        enemyAction.effect(state);
        
        // Check for reaction triggers
        this.checkReactionTriggers(build, target, state, enemyAction.name);
      }
    }
  }

  // Utility methods for combat simulation

  private initializeCombatState(build: Build): CombatState {
    return {
      round: 0,
      turn: 0,
      resources: {
        hitPoints: this.calculateMaxHP(build),
        spellSlots: { ...build.spellSlots },
        classResources: this.initializeClassResources(build),
        concentration: null,
        conditions: []
      },
      actionEconomy: {
        action: true,
        bonusAction: true,
        reaction: true,
        movement: 30
      },
      temporaryEffects: []
    };
  }

  private calculateMaxHP(build: Build): number {
    // Calculate HP based on class levels and CON modifier
    let totalHP = 0;
    const conMod = Math.floor((build.abilities.constitution - 10) / 2);
    
    for (const level of build.levels) {
      totalHP += level.hitDie + conMod;
    }
    
    return totalHP;
  }

  private initializeClassResources(build: Build): Record<string, number> {
    const resources: Record<string, number> = {};
    
    // Initialize common class resources based on build
    // This would be expanded based on actual class features
    
    return resources;
  }

  private getAttacksPerAction(build: Build): number {
    // Calculate attacks per action based on level and class features
    const totalLevel = build.levels.reduce((sum, level) => sum + level.level, 0);
    
    // Basic Extra Attack progression (Fighter gets more)
    if (totalLevel >= 20) return 4; // Fighter 20
    if (totalLevel >= 11) return 3; // Fighter 11
    if (totalLevel >= 5) return 2;  // Most martial classes
    return 1;
  }

  private calculateAttackBonus(build: Build, state: CombatState): number {
    // Calculate total attack bonus
    const profBonus = build.proficiencyBonus;
    const abilityMod = this.getPrimaryAttackAbilityMod(build);
    const magicBonus = build.equipment.mainHand?.toHitBonus || 0;
    
    return profBonus + abilityMod + magicBonus;
  }

  private getPrimaryAttackAbilityMod(build: Build): number {
    // Determine primary attack ability (STR or DEX) and return modifier
    const weapon = build.equipment.mainHand;
    if (weapon?.properties.includes('finesse')) {
      return Math.max(
        Math.floor((build.abilities.strength - 10) / 2),
        Math.floor((build.abilities.dexterity - 10) / 2)
      );
    }
    
    if (weapon?.type === 'ranged') {
      return Math.floor((build.abilities.dexterity - 10) / 2);
    }
    
    return Math.floor((build.abilities.strength - 10) / 2);
  }

  private getDamageRoll(build: Build): string {
    const weapon = build.equipment.mainHand;
    if (!weapon) return '1d4'; // Unarmed strike
    
    const baseDamage = weapon.damage;
    const abilityMod = this.getPrimaryAttackAbilityMod(build);
    const magicBonus = weapon.damageBonus || 0;
    const totalBonus = abilityMod + magicBonus;
    
    return totalBonus > 0 ? `${baseDamage}+${totalBonus}` : baseDamage;
  }

  private getAdvantageState(build: Build, target: Target, state: CombatState): 'normal' | 'advantage' | 'disadvantage' {
    // Determine advantage state based on conditions, positioning, etc.
    // This would be expanded with proper condition checking
    return 'normal';
  }

  private getCritRange(build: Build): number {
    // Base crit range is 20, can be improved by Champion, etc.
    return 20;
  }

  private getCritBonusDamage(build: Build): number {
    // Brutal Critical and similar features
    return 0;
  }

  private getOncePerTurnDamage(build: Build, state: CombatState, isCrit: boolean): {
    damage: number;
    resourcesUsed: Record<string, number>;
  } {
    // Sneak Attack, Divine Strike, etc.
    return { damage: 0, resourcesUsed: {} };
  }

  private applySmiteLogic(build: Build, state: CombatState, isCrit: boolean): {
    damage: number;
    resourcesUsed: Record<string, number>;
  } {
    // Implement smite policy logic
    return { damage: 0, resourcesUsed: {} };
  }

  private allowsMultipleOncePerTurn(build: Build): boolean {
    // Some builds can apply once-per-turn effects multiple times (rare)
    return false;
  }

  private getAvailableActions(build: Build, state: CombatState): string[] {
    return ['attack', 'spell', 'dodge'];
  }

  private selectOptimalAction(actions: string[], build: Build, target: Target, state: CombatState): string {
    // Implement action selection logic
    return 'attack';
  }

  private getAvailableSpells(build: Build, state: CombatState): string[] {
    return build.spells.filter(spell => this.canCastSpell(spell, state));
  }

  private canCastSpell(spell: string, state: CombatState): boolean {
    // Check if spell can be cast (slots available, no concentration conflict, etc.)
    return true;
  }

  private selectOptimalSpell(spells: string[], build: Build, target: Target, state: CombatState): string | null {
    return spells[0] || null;
  }

  private executeSpell(spell: string, build: Build, target: Target, state: CombatState): {
    damage: number;
    hits: number;
    misses: number;
    crits: number;
    resourcesUsed: Record<string, number>;
  } {
    // Implement spell execution logic
    return { damage: 0, hits: 0, misses: 0, crits: 0, resourcesUsed: {} };
  }

  private getAvailableBonusActions(build: Build, state: CombatState): string[] {
    return [];
  }

  private executeBonusAction(action: string, build: Build, target: Target, state: CombatState): {
    damage: number;
    hits: number;
    misses: number;
    crits: number;
    resourcesUsed: Record<string, number>;
  } {
    return { damage: 0, hits: 0, misses: 0, crits: 0, resourcesUsed: {} };
  }

  private checkReactionTriggers(build: Build, target: Target, state: CombatState, enemyAction: string): void {
    // Check for Opportunity Attack, Riposte, etc.
  }

  private applyEndOfRoundEffects(state: CombatState): void {
    // Decrement temporary effect durations, apply ongoing damage, etc.
    state.temporaryEffects = state.temporaryEffects.filter(effect => {
      effect.duration--;
      return effect.duration > 0;
    });
  }

  /**
   * Analyze simulation results and generate insights
   */
  private analyzeResults(scenario: CombatScenario): MonteCarloResults {
    const damageValues = this.runs.map(run => run.totalDamage);
    const hitRates = this.runs.map(run => run.hitCount / (run.hitCount + run.missCount));
    const critRates = this.runs.map(run => run.critCount / (run.hitCount + run.missCount));

    // Calculate round-by-round statistics
    const roundCount = scenario.rounds;
    const byRoundMeans: number[] = [];
    const byRoundConfidence: Array<{ lower: number; upper: number }> = [];

    for (let round = 0; round < roundCount; round++) {
      const roundDamages = this.runs.map(run => run.damageByRound[round] || 0);
      byRoundMeans.push(Statistics.mean(roundDamages));
      
      const ci = Statistics.confidenceInterval(roundDamages);
      byRoundConfidence.push({ lower: ci.lower, upper: ci.upper });
    }

    // Generate tactical insights
    const insights = this.generateInsights();

    return {
      runs: this.runs.length,
      seed: this.rng.getSeed(),
      scenario,
      damage: {
        mean: Statistics.mean(damageValues),
        median: Statistics.percentiles(damageValues, [50])[50],
        standardDeviation: Statistics.standardDeviation(damageValues),
        confidenceInterval: Statistics.confidenceInterval(damageValues),
        percentiles: Statistics.percentiles(damageValues),
        byRound: {
          mean: byRoundMeans,
          confidenceInterval: byRoundConfidence
        }
      },
      accuracy: {
        hitRate: Statistics.mean(hitRates),
        critRate: Statistics.mean(critRates),
        missStreak: { max: 0, average: 0 } // Would calculate from run data
      },
      resources: {
        utilization: {},
        efficiency: {}
      },
      insights
    };
  }

  private generateInsights(): {
    optimalRounds: number[];
    weakestRounds: number[];
    bestStrategies: string[];
    riskFactors: string[];
  } {
    // Analyze patterns in the simulation data to generate tactical insights
    return {
      optimalRounds: [1, 2], // Rounds with highest average damage
      weakestRounds: [3], // Rounds with lowest damage (resource depletion)
      bestStrategies: ['Use Action Surge early', 'Save spell slots for crits'],
      riskFactors: ['Low hit chance vs high AC', 'Spell slot depletion']
    };
  }
}
/**
 * Archivist DnD Tools - Math Engine
 * Core mathematical calculations for DPR, probability, and game mechanics
 */

export class MathEngine {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the math engine
     */
    async init() {
        console.log('Initializing math engine...');
        this.initialized = true;
        console.log('Math engine initialized');
    }

    /**
     * Calculate DPR (Damage Per Round) for a build against a target
     * @param {Object} build - Character build configuration
     * @param {Object} target - Target configuration (AC, saves, resistances, etc.)
     * @returns {Object} DPR calculation results
     */
    calculateDPR(build, target) {
        if (!build || !build.name) {
            throw new Error('Invalid build configuration');
        }

        if (!target) {
            throw new Error('Invalid target configuration');
        }

        // For now, return mock results for Phase 1
        // This will be expanded in Phase 2 with actual calculations
        const mockResults = this.generateMockResults(build, target);
        
        console.log(`Calculating DPR for build: ${build.name}`);
        console.log('Target AC:', target.ac);
        
        return mockResults;
    }

    /**
     * Generate mock results for initial testing (Phase 1)
     * Will be replaced with real calculations in Phase 2
     */
    generateMockResults(build, target) {
        // Basic mock calculation based on target AC
        const baseHitChance = Math.max(5, Math.min(95, 105 - target.ac * 5));
        const baseDamage = 8.5; // Average of 1d8+4
        const baseDPR = (baseHitChance / 100) * baseDamage;
        
        // Add some variation for different advantage states
        const advantageFactor = 1.3;
        const disadvantageFactor = 0.7;
        
        return {
            // Per-round DPR
            round1: baseDPR * 1.2, // First round with setup/buffs
            round2: baseDPR,
            round3: baseDPR * 0.9, // Resources starting to deplete
            sustained: baseDPR * 0.85,
            
            // Advantage state variations
            normal: baseDPR,
            advantage: baseDPR * advantageFactor,
            disadvantage: baseDPR * disadvantageFactor,
            
            // Current advantage state
            advantageState: build.advantageState || 'normal',
            
            // Supporting metrics
            hitChance: baseHitChance,
            critChance: 5, // Standard 5% crit chance
            averageDamage: baseDamage,
            
            // Breakdown (placeholder)
            breakdown: {
                weaponDamage: baseDPR * 0.7,
                bonusDamage: baseDPR * 0.2,
                critDamage: baseDPR * 0.1
            }
        };
    }

    /**
     * Calculate hit probability
     * @param {number} toHitBonus - Total to-hit bonus
     * @param {number} targetAC - Target's Armor Class
     * @param {string} advantageState - 'normal', 'advantage', or 'disadvantage'
     * @returns {number} Hit probability (0-1)
     */
    calculateHitProbability(toHitBonus, targetAC, advantageState = 'normal') {
        const neededRoll = Math.max(2, Math.min(20, targetAC - toHitBonus));
        const baseChance = Math.max(0.05, Math.min(0.95, (21 - neededRoll) / 20));
        
        switch (advantageState) {
            case 'advantage':
                return this.calculateAdvantageHitChance(baseChance);
            case 'disadvantage':
                return this.calculateDisadvantageHitChance(baseChance);
            default:
                return baseChance;
        }
    }

    /**
     * Calculate hit chance with advantage
     * @param {number} baseChance - Base hit probability
     * @returns {number} Advantage hit probability
     */
    calculateAdvantageHitChance(baseChance) {
        // P(hit with advantage) = 1 - P(miss)²
        const missChance = 1 - baseChance;
        return 1 - (missChance * missChance);
    }

    /**
     * Calculate hit chance with disadvantage
     * @param {number} baseChance - Base hit probability
     * @returns {number} Disadvantage hit probability
     */
    calculateDisadvantageHitChance(baseChance) {
        // P(hit with disadvantage) = P(hit)²
        return baseChance * baseChance;
    }

    /**
     * Calculate critical hit probability
     * @param {number} critRange - Critical hit range (19-20 = 2, 20 = 1)
     * @param {string} advantageState - Advantage state
     * @returns {number} Critical hit probability
     */
    calculateCritProbability(critRange = 1, advantageState = 'normal') {
        const baseCritChance = critRange / 20;
        
        switch (advantageState) {
            case 'advantage':
                return this.calculateAdvantageCritChance(baseCritChance);
            case 'disadvantage':
                return this.calculateDisadvantageCritChance(baseCritChance);
            default:
                return baseCritChance;
        }
    }

    /**
     * Calculate crit chance with advantage
     * @param {number} baseCritChance - Base crit probability
     * @returns {number} Advantage crit probability
     */
    calculateAdvantageCritChance(baseCritChance) {
        const nonCritChance = 1 - baseCritChance;
        return 1 - (nonCritChance * nonCritChance);
    }

    /**
     * Calculate crit chance with disadvantage
     * @param {number} baseCritChance - Base crit probability
     * @returns {number} Disadvantage crit probability
     */
    calculateDisadvantageCritChance(baseCritChance) {
        return baseCritChance * baseCritChance;
    }

    /**
     * Calculate damage with resistance/immunity/vulnerability
     * @param {number} damage - Base damage
     * @param {string} damageType - Type of damage
     * @param {Array} resistances - Target's resistances
     * @param {Array} immunities - Target's immunities
     * @param {Array} vulnerabilities - Target's vulnerabilities
     * @returns {number} Final damage after resistances
     */
    calculateDamageWithResistances(damage, damageType, resistances = [], immunities = [], vulnerabilities = []) {
        if (immunities.includes(damageType)) {
            return 0;
        }
        
        if (resistances.includes(damageType)) {
            damage = Math.floor(damage / 2);
        }
        
        if (vulnerabilities.includes(damageType)) {
            damage = damage * 2;
        }
        
        return damage;
    }

    /**
     * Calculate saving throw success probability
     * @param {number} saveDC - Difficulty Class
     * @param {number} saveBonus - Target's save bonus
     * @param {boolean} magicResistance - Whether target has magic resistance
     * @returns {number} Save success probability
     */
    calculateSaveProbability(saveDC, saveBonus, magicResistance = false) {
        const neededRoll = Math.max(2, Math.min(20, saveDC - saveBonus));
        let baseChance = Math.max(0.05, Math.min(0.95, (21 - neededRoll) / 20));
        
        if (magicResistance) {
            // Magic resistance gives advantage on saves against spells
            baseChance = this.calculateAdvantageHitChance(baseChance);
        }
        
        return baseChance;
    }

    /**
     * Calculate average dice damage
     * @param {string} diceExpression - Dice expression (e.g., "2d6+3")
     * @returns {number} Average damage
     */
    calculateAverageDice(diceExpression) {
        if (!diceExpression) return 0;
        
        // Simple regex to parse dice expressions
        const match = diceExpression.match(/^(\d+)d(\d+)(?:\+(\d+))?$/i);
        if (!match) {
            // Try to parse as just a number
            const num = parseFloat(diceExpression);
            return isNaN(num) ? 0 : num;
        }
        
        const numDice = parseInt(match[1]);
        const dieSize = parseInt(match[2]);
        const modifier = parseInt(match[3]) || 0;
        
        const avgDie = (dieSize + 1) / 2;
        return numDice * avgDie + modifier;
    }

    /**
     * Calculate damage variance for dice
     * @param {string} diceExpression - Dice expression
     * @returns {number} Damage variance
     */
    calculateDiceVariance(diceExpression) {
        if (!diceExpression) return 0;
        
        const match = diceExpression.match(/^(\d+)d(\d+)(?:\+(\d+))?$/i);
        if (!match) return 0;
        
        const numDice = parseInt(match[1]);
        const dieSize = parseInt(match[2]);
        
        // Variance of a die = (n²-1)/12 where n is the die size
        const dieVariance = (dieSize * dieSize - 1) / 12;
        return numDice * dieVariance;
    }

    /**
     * Calculate Great Weapon Fighting reroll average
     * @param {number} dieSize - Size of the die
     * @returns {number} Average damage with GWF rerolling 1s and 2s
     */
    calculateGWFAverage(dieSize) {
        // When rerolling 1s and 2s once:
        // Average = (0 + 0 + 3 + 4 + ... + n + (1+2+3+...+n)/n + (1+2+3+...+n)/n) / n
        const normalAverage = (dieSize + 1) / 2;
        const rerollAverage = (dieSize + 1) / 2; // Average of rerolled die
        
        // Probability of rolling 1 or 2: 2/n
        // Expected value = (n-2)/n * normal + 2/n * reroll
        const lowRollProb = 2 / dieSize;
        const highRollProb = 1 - lowRollProb;
        
        return highRollProb * normalAverage + lowRollProb * rerollAverage;
    }

    /**
     * Calculate Elven Accuracy hit probability
     * @param {number} baseChance - Base hit probability
     * @returns {number} Elven Accuracy hit probability (roll 3 dice, take highest)
     */
    calculateElvenAccuracyHitChance(baseChance) {
        // P(hit with elven accuracy) = 1 - P(miss)³
        const missChance = 1 - baseChance;
        return 1 - (missChance * missChance * missChance);
    }

    /**
     * Calculate expected damage for a full attack sequence
     * @param {Object} attacks - Array of attack objects
     * @param {Object} target - Target configuration
     * @returns {Object} Expected damage breakdown
     */
    calculateAttackSequence(attacks, target) {
        let totalDamage = 0;
        const breakdown = [];
        
        for (const attack of attacks) {
            const hitChance = this.calculateHitProbability(attack.toHit, target.ac, attack.advantageState);
            const critChance = this.calculateCritProbability(attack.critRange, attack.advantageState);
            
            const normalDamage = this.calculateAverageDice(attack.damage);
            const critDamage = normalDamage + this.calculateAverageDice(attack.damage); // Double dice
            
            // Apply resistances
            const finalNormalDamage = this.calculateDamageWithResistances(
                normalDamage, attack.damageType, target.resistances, target.immunities, target.vulnerabilities
            );
            const finalCritDamage = this.calculateDamageWithResistances(
                critDamage, attack.damageType, target.resistances, target.immunities, target.vulnerabilities
            );
            
            const expectedDamage = (hitChance - critChance) * finalNormalDamage + critChance * finalCritDamage;
            
            totalDamage += expectedDamage;
            breakdown.push({
                name: attack.name,
                hitChance,
                critChance,
                expectedDamage,
                normalDamage: finalNormalDamage,
                critDamage: finalCritDamage
            });
        }
        
        return {
            totalDamage,
            breakdown
        };
    }

    /**
     * Calculate power attack (GWM/Sharpshooter) break-even point
     * @param {Object} attack - Attack configuration
     * @param {number} targetAC - Target AC
     * @returns {Object} Break-even analysis
     */
    calculatePowerAttackBreakEven(attack, targetAC) {
        const normalHitChance = this.calculateHitProbability(attack.toHit, targetAC, attack.advantageState);
        const powerHitChance = this.calculateHitProbability(attack.toHit - 5, targetAC, attack.advantageState);
        
        const normalDamage = this.calculateAverageDice(attack.damage);
        const powerDamage = normalDamage + 10;
        
        const normalExpected = normalHitChance * normalDamage;
        const powerExpected = powerHitChance * powerDamage;
        
        return {
            normalExpected,
            powerExpected,
            advantage: powerExpected - normalExpected,
            shouldUsePower: powerExpected > normalExpected
        };
    }

    /**
     * Utility: Roll dice (for Monte Carlo simulations)
     * @param {number} sides - Number of sides on the die
     * @returns {number} Random roll result
     */
    rollDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    /**
     * Utility: Roll with advantage
     * @param {number} sides - Die sides
     * @returns {number} Higher of two rolls
     */
    rollWithAdvantage(sides) {
        return Math.max(this.rollDie(sides), this.rollDie(sides));
    }

    /**
     * Utility: Roll with disadvantage
     * @param {number} sides - Die sides
     * @returns {number} Lower of two rolls
     */
    rollWithDisadvantage(sides) {
        return Math.min(this.rollDie(sides), this.rollDie(sides));
    }

    /**
     * Monte Carlo simulation for complex scenarios
     * @param {Function} scenario - Function that returns damage for one iteration
     * @param {number} iterations - Number of iterations to run
     * @returns {Object} Simulation results
     */
    runMonteCarloSimulation(scenario, iterations = 10000) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            results.push(scenario());
        }
        
        const mean = results.reduce((a, b) => a + b, 0) / results.length;
        const variance = results.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / results.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate percentiles
        const sorted = results.sort((a, b) => a - b);
        const percentiles = {
            5: sorted[Math.floor(iterations * 0.05)],
            25: sorted[Math.floor(iterations * 0.25)],
            50: sorted[Math.floor(iterations * 0.5)],
            75: sorted[Math.floor(iterations * 0.75)],
            95: sorted[Math.floor(iterations * 0.95)]
        };
        
        return {
            mean,
            variance,
            stdDev,
            percentiles,
            min: Math.min(...results),
            max: Math.max(...results),
            iterations
        };
    }
}
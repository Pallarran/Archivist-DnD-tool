/**
 * Seeded Random Number Generator for reproducible Monte Carlo simulations
 * Uses a Linear Congruential Generator (LCG) for deterministic randomness
 */

export class SeededRandom {
  private seed: number;
  private current: number;
  
  // LCG parameters (same as used by Numerical Recipes)
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = Math.pow(2, 32);

  constructor(seed: number = Date.now()) {
    this.seed = seed;
    this.current = seed;
  }

  /**
   * Generate next random number in sequence [0, 1)
   */
  next(): number {
    this.current = (this.a * this.current + this.c) % this.m;
    return this.current / this.m;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Roll a die with given number of sides (1-based)
   */
  rollDie(sides: number): number {
    return this.nextInt(1, sides);
  }

  /**
   * Roll multiple dice and return sum
   */
  rollDice(count: number, sides: number): number {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += this.rollDie(sides);
    }
    return sum;
  }

  /**
   * Roll advantage (2d20, take higher)
   */
  rollAdvantage(): number {
    return Math.max(this.rollDie(20), this.rollDie(20));
  }

  /**
   * Roll disadvantage (2d20, take lower)
   */
  rollDisadvantage(): number {
    return Math.min(this.rollDie(20), this.rollDie(20));
  }

  /**
   * Generate random boolean with given probability
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Reset to initial seed
   */
  reset(): void {
    this.current = this.seed;
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Set new seed and reset
   */
  setSeed(seed: number): void {
    this.seed = seed;
    this.current = seed;
  }
}

/**
 * Dice notation parser for Monte Carlo simulations
 */
export class DiceRoller {
  private rng: SeededRandom;

  constructor(rng: SeededRandom) {
    this.rng = rng;
  }

  /**
   * Roll dice from notation string (e.g., "2d6+3", "1d8", "3d4+2")
   */
  roll(notation: string): number {
    try {
      // Handle special cases like "3*(1d4+1)" for Magic Missile
      if (notation.includes('*')) {
        const parts = notation.split('*');
        if (parts.length === 2) {
          const multiplier = parseInt(parts[0]);
          const dicePart = parts[1].replace(/[()]/g, '');
          return multiplier * this.roll(dicePart);
        }
      }

      // Standard dice notation: XdY+Z or XdY-Z
      const match = notation.match(/(\d+)d(\d+)(?:\+(\d+))?(?:\-(\d+))?/);
      if (match) {
        const [, numDice, dieSize, bonus, penalty] = match;
        const diceResult = this.rng.rollDice(parseInt(numDice), parseInt(dieSize));
        const totalBonus = (parseInt(bonus) || 0) - (parseInt(penalty) || 0);
        return diceResult + totalBonus;
      }

      // Plain numbers
      const plainNumber = parseFloat(notation);
      if (!isNaN(plainNumber)) {
        return plainNumber;
      }

      return 0;
    } catch (e) {
      console.warn('Failed to roll dice notation:', notation);
      return 0;
    }
  }

  /**
   * Roll with advantage/disadvantage modifiers
   */
  rollWithAdvantage(notation: string, advantage: 'normal' | 'advantage' | 'disadvantage'): number {
    const baseRoll = this.roll(notation);
    
    // For attack rolls, modify the d20 portion
    if (notation.includes('d20')) {
      const d20Result = advantage === 'advantage' 
        ? this.rng.rollAdvantage()
        : advantage === 'disadvantage'
        ? this.rng.rollDisadvantage()
        : this.rng.rollDie(20);
      
      // Replace the d20 roll in the notation result
      const match = notation.match(/(\d+)d20(?:\+(\d+))?(?:\-(\d+))?/);
      if (match) {
        const [, numDice, bonus, penalty] = match;
        const totalBonus = (parseInt(bonus) || 0) - (parseInt(penalty) || 0);
        return d20Result + totalBonus;
      }
    }

    return baseRoll;
  }

  /**
   * Roll damage with reroll mechanics (Great Weapon Fighting, etc.)
   */
  rollDamageWithRerolls(notation: string, rerollOnes: boolean = false, rerollTwos: boolean = false): number {
    try {
      const match = notation.match(/(\d+)d(\d+)(?:\+(\d+))?(?:\-(\d+))?/);
      if (match) {
        const [, numDice, dieSize, bonus, penalty] = match;
        let total = 0;
        
        for (let i = 0; i < parseInt(numDice); i++) {
          let roll = this.rng.rollDie(parseInt(dieSize));
          
          // Apply reroll mechanics
          if ((rerollOnes && roll === 1) || (rerollTwos && roll <= 2)) {
            roll = this.rng.rollDie(parseInt(dieSize));
          }
          
          total += roll;
        }

        const totalBonus = (parseInt(bonus) || 0) - (parseInt(penalty) || 0);
        return total + totalBonus;
      }

      return parseFloat(notation) || 0;
    } catch (e) {
      return 0;
    }
  }
}

/**
 * Statistical utilities for Monte Carlo results
 */
export class Statistics {
  /**
   * Calculate mean of array
   */
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  static standardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    const mean = this.mean(values);
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Calculate confidence interval
   */
  static confidenceInterval(values: number[], confidence: number = 0.95): { lower: number; upper: number; margin: number } {
    if (values.length === 0) return { lower: 0, upper: 0, margin: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const mean = this.mean(values);
    const stdDev = this.standardDeviation(values);
    
    // Use t-distribution for small samples, normal for large samples
    const tValue = values.length >= 30 ? this.normalInverse((1 + confidence) / 2) : this.tValue(values.length - 1, confidence);
    const standardError = stdDev / Math.sqrt(values.length);
    const margin = tValue * standardError;
    
    return {
      lower: mean - margin,
      upper: mean + margin,
      margin
    };
  }

  /**
   * Calculate percentiles
   */
  static percentiles(values: number[], percentiles: number[] = [5, 25, 50, 75, 95]): Record<number, number> {
    if (values.length === 0) return {};
    
    const sorted = [...values].sort((a, b) => a - b);
    const result: Record<number, number> = {};
    
    for (const p of percentiles) {
      const index = (p / 100) * (sorted.length - 1);
      if (index % 1 === 0) {
        result[p] = sorted[index];
      } else {
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        result[p] = sorted[lower] * (1 - weight) + sorted[upper] * weight;
      }
    }
    
    return result;
  }

  /**
   * Approximate normal distribution inverse (for z-scores)
   */
  private static normalInverse(p: number): number {
    // Beasley-Springer-Moro approximation
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
    if (p < pLow) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
             ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    }
    if (p <= pHigh) {
      const q = p - 0.5;
      const r = q * q;
      return (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q /
             (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
    }
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
            ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
  }

  /**
   * Approximate t-distribution critical value
   */
  private static tValue(df: number, confidence: number): number {
    // Simplified approximation for common confidence levels
    const alpha = 1 - confidence;
    if (df >= 30) return this.normalInverse(1 - alpha / 2);
    
    // Lookup table for small degrees of freedom (approximation)
    const tTable: Record<number, Record<number, number>> = {
      1: { 0.90: 6.314, 0.95: 12.706, 0.99: 63.657 },
      2: { 0.90: 2.920, 0.95: 4.303, 0.99: 9.925 },
      3: { 0.90: 2.353, 0.95: 3.182, 0.99: 5.841 },
      4: { 0.90: 2.132, 0.95: 2.776, 0.99: 4.604 },
      5: { 0.90: 2.015, 0.95: 2.571, 0.99: 4.032 },
      10: { 0.90: 1.812, 0.95: 2.228, 0.99: 3.169 },
      20: { 0.90: 1.725, 0.95: 2.086, 0.99: 2.845 },
      30: { 0.90: 1.697, 0.95: 2.042, 0.99: 2.750 }
    };

    // Find closest df
    const dfKeys = Object.keys(tTable).map(Number).sort((a, b) => a - b);
    const closestDf = dfKeys.reduce((prev, curr) => 
      Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev
    );

    return tTable[closestDf][confidence] || 2.0;
  }
}
/**
 * Performance Optimizations for Intensive Calculations
 * Web Workers, Memoization, and Batch Processing
 */

// Memoization cache for expensive calculations
class MemoizationCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 1000, ttlMinutes: number = 5) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Clean up expired entries and manage size
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    // Remove expired entries
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));

    // If still over limit, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global caches for different calculation types
export const dprCache = new MemoizationCache<number>(2000, 10);
export const probabilityCache = new MemoizationCache<number>(5000, 30);
export const buildAnalysisCache = new MemoizationCache<any>(500, 15);

/**
 * Memoization decorator for expensive functions
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  cache: MemoizationCache<ReturnType<T>>,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator 
      ? keyGenerator(...args)
      : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch processing for multiple calculations
 */
export class BatchProcessor<TInput, TOutput> {
  private batchSize: number;
  private processFn: (batch: TInput[]) => Promise<TOutput[]>;
  private queue: Array<{
    input: TInput;
    resolve: (value: TOutput) => void;
    reject: (reason?: any) => void;
  }> = [];
  private processing = false;

  constructor(
    batchSize: number,
    processFn: (batch: TInput[]) => Promise<TOutput[]>
  ) {
    this.batchSize = batchSize;
    this.processFn = processFn;
  }

  async process(input: TInput): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      this.queue.push({ input, resolve, reject });
      this.scheduleProcessing();
    });
  }

  private scheduleProcessing(): void {
    if (this.processing) return;

    // Process immediately if batch is full, or schedule for next tick
    if (this.queue.length >= this.batchSize) {
      this.processBatch();
    } else {
      setTimeout(() => this.processBatch(), 0);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    const inputs = batch.map(item => item.input);

    try {
      const results = await this.processFn(inputs);
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    } finally {
      this.processing = false;
      
      // Process remaining items if any
      if (this.queue.length > 0) {
        setTimeout(() => this.processBatch(), 0);
      }
    }
  }
}

/**
 * Web Worker for intensive Monte Carlo calculations
 */
export class MonteCarloWorker {
  private worker: Worker | null = null;
  private nextRequestId = 1;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }>();

  async initialize(): Promise<void> {
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers not supported');
    }

    // Create worker from inline script
    const workerScript = `
      // Monte Carlo calculation worker
      let seededRandom = null;
      
      class SeededRandom {
        constructor(seed) {
          this.seed = seed;
          this.current = seed;
          this.a = 1664525;
          this.c = 1013904223;
          this.m = Math.pow(2, 32);
        }
        
        next() {
          this.current = (this.a * this.current + this.c) % this.m;
          return this.current / this.m;
        }
        
        rollDie(sides) {
          return Math.floor(this.next() * sides) + 1;
        }
        
        rollDice(count, sides) {
          let sum = 0;
          for (let i = 0; i < count; i++) {
            sum += this.rollDie(sides);
          }
          return sum;
        }
      }
      
      function runMonteCarloSimulation({ iterations, seed, config }) {
        seededRandom = new SeededRandom(seed);
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
          // Simplified simulation - would be expanded with full logic
          const damage = simulateSingleRound(config);
          results.push(damage);
          
          // Report progress every 1000 iterations
          if (i % 1000 === 0) {
            self.postMessage({
              type: 'progress',
              requestId: config.requestId,
              progress: i / iterations
            });
          }
        }
        
        return {
          results,
          mean: results.reduce((sum, val) => sum + val, 0) / results.length,
          min: Math.min(...results),
          max: Math.max(...results)
        };
      }
      
      function simulateSingleRound(config) {
        // Simplified single round simulation
        const attackBonus = config.attackBonus || 5;
        const damage = config.damage || 8;
        const ac = config.targetAC || 15;
        const attacks = config.attacks || 1;
        
        let totalDamage = 0;
        
        for (let i = 0; i < attacks; i++) {
          const attackRoll = seededRandom.rollDie(20);
          const totalRoll = attackRoll + attackBonus;
          
          if (totalRoll >= ac || attackRoll === 20) {
            let damageRoll = seededRandom.rollDice(1, damage);
            
            // Critical hit
            if (attackRoll === 20) {
              damageRoll += seededRandom.rollDice(1, damage);
            }
            
            totalDamage += damageRoll;
          }
        }
        
        return totalDamage;
      }
      
      self.onmessage = function(e) {
        const { type, requestId, ...data } = e.data;
        
        try {
          if (type === 'simulate') {
            const result = runMonteCarloSimulation({
              ...data,
              config: { ...data.config, requestId }
            });
            
            self.postMessage({
              type: 'result',
              requestId,
              result
            });
          }
        } catch (error) {
          self.postMessage({
            type: 'error',
            requestId,
            error: error.message
          });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e) => {
      const { type, requestId, result, error, progress } = e.data;
      
      if (type === 'progress') {
        // Handle progress updates
        const request = this.pendingRequests.get(requestId);
        if (request && 'onProgress' in request) {
          (request as any).onProgress(progress);
        }
        return;
      }
      
      const request = this.pendingRequests.get(requestId);
      if (!request) return;

      this.pendingRequests.delete(requestId);

      if (type === 'result') {
        request.resolve(result);
      } else if (type === 'error') {
        request.reject(new Error(error));
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
    };
  }

  async runSimulation(
    config: any,
    iterations: number = 10000,
    seed: number = Date.now(),
    onProgress?: (progress: number) => void
  ): Promise<any> {
    if (!this.worker) {
      await this.initialize();
    }

    const requestId = this.nextRequestId++;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject, onProgress } as any);

      this.worker!.postMessage({
        type: 'simulate',
        requestId,
        iterations,
        seed,
        config
      });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

/**
 * Performance monitoring and optimization suggestions
 */
export class PerformanceMonitor {
  private metrics: Array<{
    operation: string;
    duration: number;
    timestamp: number;
    size?: number;
  }> = [];

  startTimer(operation: string): () => number {
    const start = performance.now();
    
    return (size?: number) => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration, size);
      return duration;
    };
  }

  private recordMetric(operation: string, duration: number, size?: number): void {
    this.metrics.push({
      operation,
      duration,
      timestamp: Date.now(),
      size
    });

    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  getStats(operation?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    totalDuration: number;
  } {
    const relevantMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalDuration: 0
      };
    }

    const durations = relevantMetrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      count: relevantMetrics.length,
      avgDuration: totalDuration / relevantMetrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalDuration
    };
  }

  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - m.timestamp < 60000 // Last minute
    );

    // Analyze for slow operations
    const operationStats = new Map<string, number[]>();
    recentMetrics.forEach(metric => {
      if (!operationStats.has(metric.operation)) {
        operationStats.set(metric.operation, []);
      }
      operationStats.get(metric.operation)!.push(metric.duration);
    });

    operationStats.forEach((durations, operation) => {
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      
      if (avg > 100) { // Operations taking more than 100ms on average
        suggestions.push(`Consider optimizing ${operation} (avg: ${avg.toFixed(1)}ms)`);
      }
      
      if (durations.length > 50) { // Frequently called operations
        suggestions.push(`${operation} called frequently (${durations.length} times), consider caching`);
      }
    });

    // Memory usage suggestions
    const cacheSize = dprCache.size() + probabilityCache.size() + buildAnalysisCache.size();
    if (cacheSize > 5000) {
      suggestions.push(`Large cache size (${cacheSize} entries), consider clearing old entries`);
    }

    return suggestions;
  }

  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  clear(): void {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Optimized probability calculations with memoization
 */
export const calculateHitProbability = memoize(
  (attackBonus: number, targetAC: number, advantage: 'normal' | 'advantage' | 'disadvantage'): number => {
    const timer = performanceMonitor.startTimer('calculateHitProbability');
    
    const baseChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - attackBonus)) / 20));
    
    let result: number;
    switch (advantage) {
      case 'advantage':
        result = 1 - Math.pow(1 - baseChance, 2);
        break;
      case 'disadvantage':
        result = Math.pow(baseChance, 2);
        break;
      default:
        result = baseChance;
    }
    
    timer();
    return result;
  },
  probabilityCache,
  (attackBonus, targetAC, advantage) => `hit_${attackBonus}_${targetAC}_${advantage}`
);

/**
 * Optimized DPR calculation with caching
 */
export const calculateOptimizedDPR = memoize(
  (buildHash: string, targetHash: string, conditions: string[]): number => {
    const timer = performanceMonitor.startTimer('calculateOptimizedDPR');
    
    // Simplified DPR calculation - would be expanded
    const baseDPR = 15; // Placeholder calculation
    const conditionMultiplier = conditions.includes('advantage') ? 1.3 : 1.0;
    const result = baseDPR * conditionMultiplier;
    
    timer();
    return result;
  },
  dprCache,
  (buildHash, targetHash, conditions) => `dpr_${buildHash}_${targetHash}_${conditions.sort().join('_')}`
);

/**
 * Batch DPR calculations for multiple scenarios
 */
export const batchDPRProcessor = new BatchProcessor<
  { buildId: string; targetId: string; conditions: string[] },
  number
>(
  10, // Batch size
  async (batch) => {
    const timer = performanceMonitor.startTimer('batchDPRCalculation');
    
    // Process batch efficiently
    const results = batch.map(({ buildId, targetId, conditions }) => {
      // Simplified batch calculation
      return calculateOptimizedDPR(buildId, targetId, conditions);
    });
    
    timer(batch.length);
    return results;
  }
);

/**
 * Optimized build comparison with result caching
 */
export const compareBuildsOptimized = memoize(
  (buildA: any, buildB: any, scenarios: any[]): any => {
    const timer = performanceMonitor.startTimer('compareBuildsl');
    
    // Simplified comparison logic
    const comparison = {
      winner: buildA.id,
      margin: 2.5,
      scenarios: scenarios.length
    };
    
    timer();
    return comparison;
  },
  buildAnalysisCache,
  (buildA, buildB, scenarios) => `compare_${buildA.id}_${buildB.id}_${scenarios.length}`
);

/**
 * Utility function to clear all caches
 */
export const clearAllCaches = (): void => {
  dprCache.clear();
  probabilityCache.clear();
  buildAnalysisCache.clear();
  performanceMonitor.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => ({
  dpr: { size: dprCache.size() },
  probability: { size: probabilityCache.size() },
  buildAnalysis: { size: buildAnalysisCache.size() },
  performance: performanceMonitor.getStats()
});

/**
 * Performance optimization helper for React components
 */
export const usePerformanceOptimization = () => {
  const [stats, setStats] = React.useState(getCacheStats());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    stats,
    clearCaches: clearAllCaches,
    suggestions: performanceMonitor.getOptimizationSuggestions()
  };
};
/**
 * Archivist DnD Tools - State Management
 * Handles application state, persistence, and state changes
 */

export class StateManager {
    constructor() {
        this.state = {
            target: {
                ac: 15,
                save_str: 0,
                save_dex: 2,
                save_con: 1,
                save_int: -1,
                save_wis: 3,
                save_cha: 0,
                resistances: [],
                immunities: [],
                vulnerabilities: [],
                magic_resistance: false,
                legendary_resistances: 3,
                aoe_targets: 1
            },
            builds: {
                a: null,
                b: null,
                c: null
            },
            settings: {
                theme: 'light',
                advantageState: 'normal',
                monteCarloRuns: 100000,
                explainCalculations: true,
                roundsToCalculate: 3
            }
        };
        
        this.listeners = [];
        this.storageKey = 'archivist-dnd-tools-state';
    }

    /**
     * Initialize state management
     */
    async init() {
        // Load state from localStorage
        this.loadFromStorage();
        
        // Set up auto-save
        this.setupAutoSave();
        
        console.log('State manager initialized');
    }

    /**
     * Load state from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsedState = JSON.parse(saved);
                
                // Merge saved state with defaults (in case new properties were added)
                this.state = this.mergeState(this.state, parsedState);
                
                console.log('State loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
            // Continue with default state
        }
    }

    /**
     * Save state to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    /**
     * Set up automatic saving on state changes
     */
    setupAutoSave() {
        // Save to localStorage on state changes
        this.subscribe(() => {
            this.saveToStorage();
        });
        
        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
    }

    /**
     * Merge two state objects recursively
     */
    mergeState(defaultState, savedState) {
        const merged = { ...defaultState };
        
        for (const key in savedState) {
            if (savedState.hasOwnProperty(key)) {
                if (typeof savedState[key] === 'object' && savedState[key] !== null && !Array.isArray(savedState[key])) {
                    merged[key] = this.mergeState(defaultState[key] || {}, savedState[key]);
                } else {
                    merged[key] = savedState[key];
                }
            }
        }
        
        return merged;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
        this.listeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners of state changes
     */
    notifyListeners(type, data) {
        this.listeners.forEach(callback => {
            try {
                callback(type, data);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }

    /**
     * Get the complete state
     */
    getState() {
        return this.state;
    }

    /**
     * Get target configuration
     */
    getTarget() {
        return { ...this.state.target };
    }

    /**
     * Update target configuration
     */
    updateTarget(property, value) {
        const oldValue = this.state.target[property];
        this.state.target[property] = value;
        
        this.notifyListeners('target_updated', {
            property,
            oldValue,
            newValue: value
        });
    }

    /**
     * Get a specific build
     */
    getBuild(buildId) {
        if (!['a', 'b', 'c'].includes(buildId)) {
            throw new Error(`Invalid build ID: ${buildId}`);
        }
        
        return this.state.builds[buildId] ? { ...this.state.builds[buildId] } : null;
    }

    /**
     * Get all builds
     */
    getAllBuilds() {
        return {
            a: this.getBuild('a'),
            b: this.getBuild('b'),
            c: this.getBuild('c')
        };
    }

    /**
     * Set a complete build
     */
    setBuild(buildId, buildData) {
        if (!['a', 'b', 'c'].includes(buildId)) {
            throw new Error(`Invalid build ID: ${buildId}`);
        }
        
        const oldBuild = this.state.builds[buildId];
        this.state.builds[buildId] = buildData ? { ...buildData } : null;
        
        this.notifyListeners('build_set', {
            buildId,
            oldBuild,
            newBuild: buildData
        });
    }

    /**
     * Update a specific property of a build
     */
    updateBuild(buildId, property, value) {
        if (!['a', 'b', 'c'].includes(buildId)) {
            throw new Error(`Invalid build ID: ${buildId}`);
        }
        
        // Initialize build if it doesn't exist
        if (!this.state.builds[buildId]) {
            this.state.builds[buildId] = this.createEmptyBuild();
        }
        
        const oldValue = this.state.builds[buildId][property];
        this.state.builds[buildId][property] = value;
        
        this.notifyListeners('build_updated', {
            buildId,
            property,
            oldValue,
            newValue: value
        });
    }

    /**
     * Clear a build
     */
    clearBuild(buildId) {
        if (!['a', 'b', 'c'].includes(buildId)) {
            throw new Error(`Invalid build ID: ${buildId}`);
        }
        
        const oldBuild = this.state.builds[buildId];
        this.state.builds[buildId] = null;
        
        this.notifyListeners('build_cleared', {
            buildId,
            oldBuild
        });
    }

    /**
     * Create an empty build template
     */
    createEmptyBuild() {
        return {
            name: '',
            levels: [],
            abilities: {
                STR: 10,
                DEX: 10,
                CON: 10,
                INT: 10,
                WIS: 10,
                CHA: 10
            },
            proficiencyBonus: 2,
            proficiencies: {
                weapons: [],
                armor: [],
                tools: [],
                saves: [],
                skills: []
            },
            feats: [],
            fightingStyle: null,
            features: [],
            equipment: {
                mainHand: null,
                offHand: null,
                armor: null,
                shield: null,
                ranged: null
            },
            spellsKnown: [],
            spellSlots: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
                6: 0,
                7: 0,
                8: 0,
                9: 0
            },
            policies: {
                powerAttackThresholdEV: 0.5,
                smitePolicy: 'never',
                oncePerTurnPriority: 'firstHit',
                bonusActionPriority: [],
                precast: [],
                resourceBudget: {
                    slotsPerFight: {
                        1: 0,
                        2: 0,
                        3: 0,
                        4: 0,
                        5: 0,
                        6: 0,
                        7: 0,
                        8: 0,
                        9: 0
                    },
                    pointsPerFight: 0,
                    ragesPerFight: 0
                }
            },
            advantageState: 'normal'
        };
    }

    /**
     * Get application settings
     */
    getSettings() {
        return { ...this.state.settings };
    }

    /**
     * Update application settings
     */
    updateSettings(property, value) {
        const oldValue = this.state.settings[property];
        this.state.settings[property] = value;
        
        this.notifyListeners('settings_updated', {
            property,
            oldValue,
            newValue: value
        });
    }

    /**
     * Export state as JSON
     */
    exportState() {
        return JSON.stringify(this.state, null, 2);
    }

    /**
     * Import state from JSON
     */
    importState(jsonData) {
        try {
            const importedState = JSON.parse(jsonData);
            
            // Validate imported state structure
            if (this.validateStateStructure(importedState)) {
                this.state = this.mergeState(this.state, importedState);
                this.notifyListeners('state_imported', importedState);
                console.log('State imported successfully');
                return true;
            } else {
                throw new Error('Invalid state structure');
            }
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }

    /**
     * Validate state structure
     */
    validateStateStructure(state) {
        // Basic structure validation
        if (!state || typeof state !== 'object') {
            return false;
        }
        
        // Check for required top-level properties
        const requiredProps = ['target', 'builds', 'settings'];
        for (const prop of requiredProps) {
            if (!state.hasOwnProperty(prop)) {
                return false;
            }
        }
        
        // Validate target structure
        if (!state.target || typeof state.target !== 'object') {
            return false;
        }
        
        // Validate builds structure
        if (!state.builds || typeof state.builds !== 'object') {
            return false;
        }
        
        // Validate settings structure
        if (!state.settings || typeof state.settings !== 'object') {
            return false;
        }
        
        return true;
    }

    /**
     * Reset state to defaults
     */
    resetState() {
        const defaultState = {
            target: {
                ac: 15,
                save_str: 0,
                save_dex: 2,
                save_con: 1,
                save_int: -1,
                save_wis: 3,
                save_cha: 0,
                resistances: [],
                immunities: [],
                vulnerabilities: [],
                magic_resistance: false,
                legendary_resistances: 3,
                aoe_targets: 1
            },
            builds: {
                a: null,
                b: null,
                c: null
            },
            settings: {
                theme: 'light',
                advantageState: 'normal',
                monteCarloRuns: 100000,
                explainCalculations: true,
                roundsToCalculate: 3
            }
        };
        
        this.state = defaultState;
        this.notifyListeners('state_reset', null);
        console.log('State reset to defaults');
    }

    /**
     * Get state summary for debugging
     */
    getStateSummary() {
        return {
            target: {
                ac: this.state.target.ac,
                resistanceCount: this.state.target.resistances.length,
                magicResistance: this.state.target.magic_resistance
            },
            builds: {
                a: this.state.builds.a?.name || null,
                b: this.state.builds.b?.name || null,
                c: this.state.builds.c?.name || null
            },
            settings: this.state.settings
        };
    }

    /**
     * Check if a build is configured
     */
    isBuildConfigured(buildId) {
        const build = this.getBuild(buildId);
        return build && build.name && build.name.trim() !== '';
    }

    /**
     * Get configured builds count
     */
    getConfiguredBuildsCount() {
        let count = 0;
        ['a', 'b', 'c'].forEach(buildId => {
            if (this.isBuildConfigured(buildId)) {
                count++;
            }
        });
        return count;
    }

    /**
     * Clone a build to another slot
     */
    cloneBuild(fromBuildId, toBuildId) {
        if (!['a', 'b', 'c'].includes(fromBuildId) || !['a', 'b', 'c'].includes(toBuildId)) {
            throw new Error('Invalid build IDs');
        }
        
        const sourceBuild = this.getBuild(fromBuildId);
        if (!sourceBuild) {
            throw new Error('Source build does not exist');
        }
        
        // Create a copy with a modified name
        const clonedBuild = { 
            ...sourceBuild, 
            name: `${sourceBuild.name} (Copy)` 
        };
        
        this.setBuild(toBuildId, clonedBuild);
    }
}
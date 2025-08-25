/**
 * Archivist DnD Tools - D&D Rules Engine
 * Handles D&D 5e rules, validation, and game mechanics
 */

export class DnDRules {
    constructor() {
        this.classes = new Map();
        this.subclasses = new Map();
        this.spells = new Map();
        this.feats = new Map();
        this.equipment = new Map();
        this.conditions = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the D&D rules engine
     */
    async init() {
        console.log('Initializing D&D rules engine...');
        
        // Load core data (for now, we'll initialize with minimal SRD data)
        this.initializeClasses();
        this.initializeSpells();
        this.initializeFeats();
        this.initializeEquipment();
        this.initializeConditions();
        
        this.initialized = true;
        console.log('D&D rules engine initialized');
    }

    /**
     * Initialize basic class data (SRD-compliant)
     */
    initializeClasses() {
        // Fighter class with basic progression
        this.classes.set('fighter', {
            name: 'Fighter',
            hitDie: 10,
            primaryAbilities: ['STR', 'DEX'],
            savingThrows: ['STR', 'CON'],
            skillChoices: 2,
            skillOptions: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
            proficiencies: {
                armor: ['light', 'medium', 'heavy', 'shields'],
                weapons: ['simple', 'martial'],
                tools: [],
                languages: []
            },
            features: {
                1: ['Fighting Style', 'Second Wind'],
                2: ['Action Surge'],
                3: ['Martial Archetype'],
                4: ['Ability Score Improvement'],
                5: ['Extra Attack'],
                6: ['Ability Score Improvement'],
                7: ['Martial Archetype Feature'],
                8: ['Ability Score Improvement'],
                9: ['Indomitable'],
                10: ['Martial Archetype Feature'],
                11: ['Extra Attack (2)'],
                12: ['Ability Score Improvement'],
                13: ['Indomitable (2)'],
                14: ['Ability Score Improvement'],
                15: ['Martial Archetype Feature'],
                16: ['Ability Score Improvement'],
                17: ['Action Surge (2)', 'Indomitable (3)'],
                18: ['Martial Archetype Feature'],
                19: ['Ability Score Improvement'],
                20: ['Extra Attack (3)']
            },
            spellcasting: null
        });

        // Rogue class
        this.classes.set('rogue', {
            name: 'Rogue',
            hitDie: 8,
            primaryAbilities: ['DEX'],
            savingThrows: ['DEX', 'INT'],
            skillChoices: 4,
            skillOptions: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
            proficiencies: {
                armor: ['light'],
                weapons: ['simple', 'hand crossbows', 'longswords', 'rapiers', 'shortswords'],
                tools: ['thieves\' tools'],
                languages: []
            },
            features: {
                1: ['Expertise', 'Sneak Attack', 'Thieves\' Cant'],
                2: ['Cunning Action'],
                3: ['Roguish Archetype'],
                4: ['Ability Score Improvement'],
                5: ['Uncanny Dodge'],
                6: ['Expertise'],
                7: ['Evasion'],
                8: ['Ability Score Improvement'],
                9: ['Roguish Archetype Feature'],
                10: ['Ability Score Improvement'],
                11: ['Reliable Talent'],
                12: ['Ability Score Improvement'],
                13: ['Roguish Archetype Feature'],
                14: ['Blindsense'],
                15: ['Slippery Mind'],
                16: ['Ability Score Improvement'],
                17: ['Roguish Archetype Feature'],
                18: ['Elusive'],
                19: ['Ability Score Improvement'],
                20: ['Stroke of Luck']
            },
            spellcasting: null
        });

        // Basic subclasses
        this.subclasses.set('champion', {
            name: 'Champion',
            class: 'fighter',
            features: {
                3: ['Improved Critical'],
                7: ['Remarkable Athlete'],
                10: ['Additional Fighting Style'],
                15: ['Superior Critical'],
                18: ['Survivor']
            }
        });

        this.subclasses.set('scout', {
            name: 'Scout',
            class: 'rogue',
            features: {
                3: ['Skirmisher', 'Survivalist'],
                9: ['Superior Mobility'],
                13: ['Ambush Master'],
                17: ['Sudden Strike']
            }
        });
    }

    /**
     * Initialize basic spell data
     */
    initializeSpells() {
        this.spells.set('shield', {
            name: 'Shield',
            level: 1,
            school: 'abjuration',
            castingTime: '1 reaction',
            range: 'self',
            components: ['V', 'S'],
            duration: '1 round',
            description: '+5 AC until start of your next turn',
            effect: {
                type: 'ac_bonus',
                value: 5,
                duration: 1
            }
        });

        this.spells.set('hex', {
            name: 'Hex',
            level: 1,
            school: 'enchantment',
            castingTime: '1 bonus action',
            range: '90 feet',
            components: ['V', 'S', 'M'],
            duration: 'Concentration, up to 1 hour',
            description: '+1d6 necrotic damage on attacks against target',
            effect: {
                type: 'damage_bonus',
                dice: '1d6',
                damageType: 'necrotic',
                target: 'single'
            }
        });

        this.spells.set('haste', {
            name: 'Haste',
            level: 3,
            school: 'transmutation',
            castingTime: '1 action',
            range: '30 feet',
            components: ['V', 'S', 'M'],
            duration: 'Concentration, up to 1 minute',
            description: '+2 AC, advantage on Dex saves, doubled speed, additional action',
            effect: {
                type: 'multiple',
                effects: [
                    { type: 'ac_bonus', value: 2 },
                    { type: 'advantage', saveType: 'DEX' },
                    { type: 'speed_double' },
                    { type: 'extra_action', limited: true }
                ]
            }
        });
    }

    /**
     * Initialize feat data
     */
    initializeFeats() {
        this.feats.set('sharpshooter', {
            name: 'Sharpshooter',
            prerequisite: null,
            description: 'Master of ranged combat',
            benefits: [
                'Ignore half and three-quarters cover',
                'No disadvantage at long range',
                'Power attack: -5 to hit, +10 damage with ranged weapons'
            ],
            effects: {
                ignoreCover: true,
                noLongRangeDisadvantage: true,
                powerAttack: {
                    toHitPenalty: -5,
                    damageBonus: 10,
                    weaponTypes: ['ranged']
                }
            }
        });

        this.feats.set('great-weapon-master', {
            name: 'Great Weapon Master',
            prerequisite: null,
            description: 'Master of heavy melee weapons',
            benefits: [
                'Bonus action attack on crit or kill',
                'Power attack: -5 to hit, +10 damage with heavy melee weapons'
            ],
            effects: {
                bonusActionOnCrit: true,
                bonusActionOnKill: true,
                powerAttack: {
                    toHitPenalty: -5,
                    damageBonus: 10,
                    weaponTypes: ['heavy', 'melee']
                }
            }
        });

        this.feats.set('elven-accuracy', {
            name: 'Elven Accuracy',
            prerequisite: 'Elf or half-elf',
            description: 'Uncanny aim of the elves',
            benefits: [
                '+1 to DEX, INT, WIS, or CHA',
                'Reroll one attack die when you have advantage'
            ],
            effects: {
                abilityIncrease: 1,
                advantageReroll: true
            }
        });
    }

    /**
     * Initialize equipment data
     */
    initializeEquipment() {
        // Weapons
        this.equipment.set('longbow', {
            name: 'Longbow',
            type: 'weapon',
            category: 'ranged',
            damage: '1d8',
            damageType: 'piercing',
            properties: ['ammunition', 'heavy', 'two-handed'],
            range: {
                normal: 150,
                long: 600
            },
            weight: 2,
            cost: '50 gp'
        });

        this.equipment.set('greatsword', {
            name: 'Greatsword',
            type: 'weapon',
            category: 'melee',
            damage: '2d6',
            damageType: 'slashing',
            properties: ['heavy', 'two-handed'],
            weight: 6,
            cost: '50 gp'
        });

        this.equipment.set('rapier', {
            name: 'Rapier',
            type: 'weapon',
            category: 'melee',
            damage: '1d8',
            damageType: 'piercing',
            properties: ['finesse'],
            weight: 2,
            cost: '25 gp'
        });

        // Armor
        this.equipment.set('chain-mail', {
            name: 'Chain Mail',
            type: 'armor',
            category: 'heavy',
            ac: 16,
            stealthDisadvantage: true,
            strengthRequirement: 13,
            weight: 55,
            cost: '75 gp'
        });

        this.equipment.set('leather-armor', {
            name: 'Leather Armor',
            type: 'armor',
            category: 'light',
            ac: 11,
            maxDexBonus: null,
            weight: 10,
            cost: '10 gp'
        });
    }

    /**
     * Initialize condition data
     */
    initializeConditions() {
        this.conditions.set('poisoned', {
            name: 'Poisoned',
            description: 'Disadvantage on attack rolls and ability checks',
            effects: {
                attackDisadvantage: true,
                abilityCheckDisadvantage: true
            }
        });

        this.conditions.set('frightened', {
            name: 'Frightened',
            description: 'Disadvantage on ability checks and attack rolls while source is in sight',
            effects: {
                attackDisadvantage: true,
                abilityCheckDisadvantage: true,
                cannotMoveCloser: true
            }
        });

        this.conditions.set('prone', {
            name: 'Prone',
            description: 'Disadvantage on attack rolls, attacks within 5 feet have advantage',
            effects: {
                attackDisadvantage: true,
                meleeAttacksAgainstAdvantage: true,
                rangedAttacksAgainstDisadvantage: true,
                movementCostDouble: true
            }
        });
    }

    /**
     * Validate a build object structure
     * @param {Object} build - Build to validate
     * @returns {boolean} Whether build is valid
     */
    validateBuild(build) {
        if (!build || typeof build !== 'object') {
            return false;
        }

        // Check required properties
        const requiredProps = ['name', 'levels', 'abilities'];
        for (const prop of requiredProps) {
            if (!build.hasOwnProperty(prop)) {
                console.warn(`Build missing required property: ${prop}`);
                return false;
            }
        }

        // Validate levels array
        if (!Array.isArray(build.levels)) {
            console.warn('Build levels must be an array');
            return false;
        }

        // Validate total level doesn't exceed 20
        const totalLevel = build.levels.reduce((sum, level) => sum + (level.level || 0), 0);
        if (totalLevel > 20) {
            console.warn('Build total level cannot exceed 20');
            return false;
        }

        // Validate abilities object
        if (!build.abilities || typeof build.abilities !== 'object') {
            console.warn('Build abilities must be an object');
            return false;
        }

        const requiredAbilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        for (const ability of requiredAbilities) {
            if (typeof build.abilities[ability] !== 'number') {
                console.warn(`Build missing or invalid ability score: ${ability}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate ability modifier
     * @param {number} score - Ability score
     * @returns {number} Ability modifier
     */
    getAbilityModifier(score) {
        return Math.floor((score - 10) / 2);
    }

    /**
     * Calculate proficiency bonus by total level
     * @param {number} level - Character level
     * @returns {number} Proficiency bonus
     */
    getProficiencyBonus(level) {
        return Math.ceil(level / 4) + 1;
    }

    /**
     * Get class by name
     * @param {string} className - Name of the class
     * @returns {Object|null} Class data
     */
    getClass(className) {
        return this.classes.get(className.toLowerCase()) || null;
    }

    /**
     * Get subclass by name
     * @param {string} subclassName - Name of the subclass
     * @returns {Object|null} Subclass data
     */
    getSubclass(subclassName) {
        return this.subclasses.get(subclassName.toLowerCase()) || null;
    }

    /**
     * Get spell by name
     * @param {string} spellName - Name of the spell
     * @returns {Object|null} Spell data
     */
    getSpell(spellName) {
        return this.spells.get(spellName.toLowerCase()) || null;
    }

    /**
     * Get feat by name
     * @param {string} featName - Name of the feat
     * @returns {Object|null} Feat data
     */
    getFeat(featName) {
        return this.feats.get(featName.toLowerCase()) || null;
    }

    /**
     * Get equipment by name
     * @param {string} itemName - Name of the equipment
     * @returns {Object|null} Equipment data
     */
    getEquipment(itemName) {
        return this.equipment.get(itemName.toLowerCase()) || null;
    }

    /**
     * Get condition by name
     * @param {string} conditionName - Name of the condition
     * @returns {Object|null} Condition data
     */
    getCondition(conditionName) {
        return this.conditions.get(conditionName.toLowerCase()) || null;
    }

    /**
     * Calculate build's total level
     * @param {Object} build - Character build
     * @returns {number} Total character level
     */
    getTotalLevel(build) {
        if (!build.levels || !Array.isArray(build.levels)) {
            return 1;
        }
        
        return build.levels.reduce((total, levelEntry) => {
            return total + (levelEntry.level || 0);
        }, 0);
    }

    /**
     * Get all features available to a build at its current level
     * @param {Object} build - Character build
     * @returns {Array} Array of available features
     */
    getBuildFeatures(build) {
        const features = [];
        
        if (!build.levels || !Array.isArray(build.levels)) {
            return features;
        }

        for (const levelEntry of build.levels) {
            const classData = this.getClass(levelEntry.class);
            if (!classData) continue;

            // Add class features
            for (let level = 1; level <= levelEntry.level; level++) {
                if (classData.features[level]) {
                    features.push(...classData.features[level].map(feature => ({
                        name: feature,
                        source: levelEntry.class,
                        level: level
                    })));
                }
            }

            // Add subclass features if applicable
            if (levelEntry.subclass) {
                const subclassData = this.getSubclass(levelEntry.subclass);
                if (subclassData && subclassData.features) {
                    for (let level = 1; level <= levelEntry.level; level++) {
                        if (subclassData.features[level]) {
                            features.push(...subclassData.features[level].map(feature => ({
                                name: feature,
                                source: `${levelEntry.class} (${levelEntry.subclass})`,
                                level: level
                            })));
                        }
                    }
                }
            }
        }

        return features;
    }

    /**
     * Check if build meets feat prerequisites
     * @param {Object} build - Character build
     * @param {string} featName - Name of the feat
     * @returns {boolean} Whether prerequisites are met
     */
    meetsFeatPrerequisites(build, featName) {
        const feat = this.getFeat(featName);
        if (!feat) return false;
        
        if (!feat.prerequisite) return true;
        
        // Basic prerequisite checking (could be expanded)
        if (feat.prerequisite.includes('Elf') || feat.prerequisite.includes('half-elf')) {
            // Would need race data to check this properly
            return true; // For now, assume met
        }
        
        return true;
    }

    /**
     * Calculate AC for a build
     * @param {Object} build - Character build
     * @returns {number} Armor Class
     */
    calculateAC(build) {
        let baseAC = 10;
        let dexModifier = this.getAbilityModifier(build.abilities?.DEX || 10);
        let maxDexBonus = null;
        let armorBonus = 0;
        let shieldBonus = 0;
        
        // Check for armor
        if (build.equipment?.armor) {
            const armor = this.getEquipment(build.equipment.armor);
            if (armor) {
                baseAC = armor.ac;
                maxDexBonus = armor.maxDexBonus;
            }
        }
        
        // Check for shield
        if (build.equipment?.shield) {
            shieldBonus = 2; // Standard shield bonus
        }
        
        // Apply Dex modifier with limits
        if (maxDexBonus !== null) {
            dexModifier = Math.min(dexModifier, maxDexBonus);
        }
        
        return baseAC + dexModifier + armorBonus + shieldBonus;
    }

    /**
     * Calculate attack bonus for a weapon
     * @param {Object} build - Character build
     * @param {string} weaponName - Name of the weapon
     * @returns {number} Attack bonus
     */
    calculateAttackBonus(build, weaponName) {
        const weapon = this.getEquipment(weaponName);
        if (!weapon) return 0;
        
        const totalLevel = this.getTotalLevel(build);
        const proficiencyBonus = build.proficiencyBonus || this.getProficiencyBonus(totalLevel);
        
        let abilityModifier = 0;
        
        // Determine which ability to use
        if (weapon.properties?.includes('finesse')) {
            // Use higher of STR or DEX for finesse weapons
            const strMod = this.getAbilityModifier(build.abilities?.STR || 10);
            const dexMod = this.getAbilityModifier(build.abilities?.DEX || 10);
            abilityModifier = Math.max(strMod, dexMod);
        } else if (weapon.category === 'ranged') {
            abilityModifier = this.getAbilityModifier(build.abilities?.DEX || 10);
        } else {
            abilityModifier = this.getAbilityModifier(build.abilities?.STR || 10);
        }
        
        // Add fighting style bonus (Archery gives +2 to ranged attacks)
        let fightingStyleBonus = 0;
        if (build.fightingStyle === 'Archery' && weapon.category === 'ranged') {
            fightingStyleBonus = 2;
        }
        
        return abilityModifier + proficiencyBonus + fightingStyleBonus;
    }

    /**
     * Get all available classes
     * @returns {Array} Array of class names
     */
    getAvailableClasses() {
        return Array.from(this.classes.keys());
    }

    /**
     * Get available subclasses for a class
     * @param {string} className - Name of the class
     * @returns {Array} Array of subclass names
     */
    getAvailableSubclasses(className) {
        return Array.from(this.subclasses.values())
            .filter(subclass => subclass.class === className.toLowerCase())
            .map(subclass => subclass.name);
    }

    /**
     * Get all available spells
     * @returns {Array} Array of spell names
     */
    getAvailableSpells() {
        return Array.from(this.spells.keys());
    }

    /**
     * Get all available feats
     * @returns {Array} Array of feat names
     */
    getAvailableFeats() {
        return Array.from(this.feats.keys());
    }

    /**
     * Get all available equipment
     * @param {string} type - Equipment type filter ('weapon', 'armor', etc.)
     * @returns {Array} Array of equipment names
     */
    getAvailableEquipment(type = null) {
        if (type) {
            return Array.from(this.equipment.values())
                .filter(item => item.type === type)
                .map(item => item.name);
        }
        return Array.from(this.equipment.keys());
    }
}
/**
 * Archivist DnD Tools - Main Application Controller
 * Entry point for the application, handles initialization and routing
 */

import { StateManager } from './state-manager.js';
import { UIComponents } from './ui-components.js';
import { MathEngine } from './math-engine.js';
import { DnDRules } from './dnd-rules.js';
import { Utils } from './utils.js';

class ArchivistApp {
    constructor() {
        this.state = new StateManager();
        this.ui = new UIComponents();
        this.mathEngine = new MathEngine();
        this.dndRules = new DnDRules();
        this.utils = new Utils();
        
        this.currentView = 'dpr-simulator';
        this.initialized = false;
        
        // Bind methods to preserve context
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleTargetChange = this.handleTargetChange.bind(this);
        this.handleBuildChange = this.handleBuildChange.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Archivist DnD Tools...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize state management
            await this.state.init();
            
            // Initialize UI components
            await this.ui.init();
            
            // Load D&D rules data
            await this.dndRules.init();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize the current view
            this.initializeView();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.handleError('Failed to initialize application', error);
        }
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            // Remove from DOM after transition
            setTimeout(() => {
                if (loadingScreen.parentNode) {
                    loadingScreen.parentNode.removeChild(loadingScreen);
                }
            }, 300);
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Navigation events
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', this.handleNavigation);
        });
        
        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('open');
                navToggle.setAttribute('aria-expanded', 
                    navMenu.classList.contains('open').toString()
                );
            });
        }
        
        // Target panel events
        this.setupTargetPanelListeners();
        
        // Build comparison events
        this.setupBuildComparisonListeners();
        
        // Modal events
        this.setupModalListeners();
        
        // Global error handler
        window.addEventListener('error', this.handleError);
        window.addEventListener('unhandledrejection', this.handleError);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    /**
     * Set up target panel event listeners
     */
    setupTargetPanelListeners() {
        // AC slider and input synchronization
        const acSlider = document.getElementById('target-ac');
        const acInput = document.getElementById('target-ac-value');
        
        if (acSlider && acInput) {
            acSlider.addEventListener('input', (e) => {
                acInput.value = e.target.value;
                this.handleTargetChange('ac', parseInt(e.target.value));
            });
            
            acInput.addEventListener('input', (e) => {
                const value = Math.max(8, Math.min(25, parseInt(e.target.value) || 15));
                acSlider.value = value;
                e.target.value = value;
                this.handleTargetChange('ac', value);
            });
        }
        
        // Save modifiers
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
            const input = document.getElementById(`save-${ability}`);
            if (input) {
                input.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value) || 0;
                    this.handleTargetChange(`save_${ability}`, value);
                });
            }
        });
        
        // Resistances
        document.querySelectorAll('input[name="resistance"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleTargetChange('resistances', this.getSelectedResistances());
            });
        });
        
        // Enemy traits
        const magicResistance = document.getElementById('magic-resistance');
        const legendaryResistances = document.getElementById('legendary-resistances');
        const aoeTargets = document.getElementById('aoe-targets');
        
        if (magicResistance) {
            magicResistance.addEventListener('change', (e) => {
                this.handleTargetChange('magic_resistance', e.target.checked);
            });
        }
        
        if (legendaryResistances) {
            legendaryResistances.addEventListener('input', (e) => {
                this.handleTargetChange('legendary_resistances', parseInt(e.target.value) || 0);
            });
        }
        
        if (aoeTargets) {
            aoeTargets.addEventListener('input', (e) => {
                this.handleTargetChange('aoe_targets', parseInt(e.target.value) || 1);
            });
        }
        
        // Panel toggle
        const panelToggle = document.querySelector('.panel-toggle');
        const panelContent = document.querySelector('.panel-content');
        if (panelToggle && panelContent) {
            panelToggle.addEventListener('click', () => {
                const isExpanded = panelToggle.getAttribute('aria-expanded') === 'true';
                panelToggle.setAttribute('aria-expanded', (!isExpanded).toString());
                panelContent.style.display = isExpanded ? 'none' : 'block';
            });
        }
    }

    /**
     * Set up build comparison event listeners
     */
    setupBuildComparisonListeners() {
        ['a', 'b', 'c'].forEach(buildId => {
            // Build name inputs
            const nameInput = document.getElementById(`build-${buildId}-name`);
            if (nameInput) {
                nameInput.addEventListener('input', (e) => {
                    this.handleBuildChange(buildId, 'name', e.target.value);
                });
            }
            
            // Action buttons
            const importBtn = document.getElementById(`import-build-${buildId}`);
            const exportBtn = document.getElementById(`export-build-${buildId}`);
            const clearBtn = document.getElementById(`clear-build-${buildId}`);
            
            if (importBtn) {
                importBtn.addEventListener('click', () => this.importBuild(buildId));
            }
            
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportBuild(buildId));
            }
            
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearBuild(buildId));
            }
        });
    }

    /**
     * Set up modal event listeners
     */
    setupModalListeners() {
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    this.closeModal(activeModal.id);
                }
            }
        });
    }

    /**
     * Handle navigation between different views
     */
    handleNavigation(e) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        const viewId = href.substring(1); // Remove # from href
        this.navigateToView(viewId);
    }

    /**
     * Navigate to a specific view
     */
    navigateToView(viewId) {
        if (viewId === this.currentView) return;
        
        // Update navigation state
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${viewId}`) {
                link.classList.add('active');
            }
        });
        
        this.currentView = viewId;
        
        // Handle view-specific logic
        switch (viewId) {
            case 'build-lab':
                this.showBuildLab();
                break;
            case 'dpr-simulator':
                this.initializeDPRSimulator();
                break;
            case 'leveling-explorer':
                this.initializeLevelingExplorer();
                break;
            case 'compare':
                this.initializeCharacterCompare();
                break;
            case 'library':
                this.initializeLibrary();
                break;
            case 'exports':
                this.initializeExports();
                break;
        }
    }

    /**
     * Initialize the current view
     */
    initializeView() {
        this.navigateToView(this.currentView);
    }

    /**
     * Initialize DPR Simulator view
     */
    initializeDPRSimulator() {
        console.log('Initializing DPR Simulator');
        // This is where we'll add DPR-specific initialization
        this.recalculateAllBuilds();
    }

    /**
     * Initialize Leveling Explorer view
     */
    initializeLevelingExplorer() {
        console.log('Initializing Leveling Explorer');
        // Placeholder for future implementation
    }

    /**
     * Initialize Character Compare view
     */
    initializeCharacterCompare() {
        console.log('Initializing Character Compare');
        // Placeholder for future implementation
    }

    /**
     * Initialize Library view
     */
    initializeLibrary() {
        console.log('Initializing Library');
        // Placeholder for future implementation
    }

    /**
     * Initialize Exports view
     */
    initializeExports() {
        console.log('Initializing Exports');
        // Placeholder for future implementation
    }

    /**
     * Handle target configuration changes
     */
    handleTargetChange(property, value) {
        this.state.updateTarget(property, value);
        this.recalculateAllBuilds();
    }

    /**
     * Handle build configuration changes
     */
    handleBuildChange(buildId, property, value) {
        this.state.updateBuild(buildId, property, value);
        this.recalculateBuild(buildId);
    }

    /**
     * Get selected resistances from checkboxes
     */
    getSelectedResistances() {
        const resistances = [];
        document.querySelectorAll('input[name="resistance"]:checked').forEach(checkbox => {
            resistances.push(checkbox.value);
        });
        return resistances;
    }

    /**
     * Recalculate DPR for all builds
     */
    recalculateAllBuilds() {
        if (!this.initialized) return;
        
        ['a', 'b', 'c'].forEach(buildId => {
            this.recalculateBuild(buildId);
        });
    }

    /**
     * Recalculate DPR for a specific build
     */
    recalculateBuild(buildId) {
        if (!this.initialized) return;
        
        const build = this.state.getBuild(buildId);
        const target = this.state.getTarget();
        
        if (!build || !build.name) {
            // No build configured, show placeholder
            this.showBuildPlaceholder(buildId);
            return;
        }
        
        try {
            // Calculate DPR using math engine
            const results = this.mathEngine.calculateDPR(build, target);
            
            // Update UI with results
            this.displayBuildResults(buildId, results);
            
        } catch (error) {
            console.error(`Error calculating DPR for build ${buildId}:`, error);
            this.showBuildError(buildId, error.message);
        }
    }

    /**
     * Show placeholder for unconfigured build
     */
    showBuildPlaceholder(buildId) {
        const resultsSection = document.querySelector(`#build-${buildId} .build-results`);
        if (resultsSection) {
            resultsSection.innerHTML = `
                <h3>DPR Results</h3>
                <div class="results-placeholder">
                    <p>Results will appear here once a build is configured</p>
                </div>
            `;
        }
    }

    /**
     * Show error message for build calculation
     */
    showBuildError(buildId, message) {
        const resultsSection = document.querySelector(`#build-${buildId} .build-results`);
        if (resultsSection) {
            resultsSection.innerHTML = `
                <h3>DPR Results</h3>
                <div class="results-placeholder">
                    <p style="color: var(--danger-color);">Error: ${message}</p>
                </div>
            `;
        }
    }

    /**
     * Display DPR results for a build
     */
    displayBuildResults(buildId, results) {
        const resultsSection = document.querySelector(`#build-${buildId} .build-results`);
        if (!resultsSection) return;
        
        resultsSection.innerHTML = `
            <h3>DPR Results</h3>
            <div class="dpr-summary">
                <div class="dpr-metric">
                    <div class="dpr-metric-value">${results.round1.toFixed(1)}</div>
                    <div class="dpr-metric-label">Round 1</div>
                </div>
                <div class="dpr-metric">
                    <div class="dpr-metric-value">${results.round2.toFixed(1)}</div>
                    <div class="dpr-metric-label">Round 2</div>
                </div>
                <div class="dpr-metric">
                    <div class="dpr-metric-value">${results.round3.toFixed(1)}</div>
                    <div class="dpr-metric-label">Round 3</div>
                </div>
                <div class="dpr-metric">
                    <div class="dpr-metric-value">${results.sustained.toFixed(1)}</div>
                    <div class="dpr-metric-label">Sustained</div>
                </div>
            </div>
            
            <div class="advantage-states">
                <div class="advantage-state ${results.advantageState === 'normal' ? 'active' : ''}" 
                     data-state="normal">
                    <div>Normal</div>
                    <div>${results.normal.toFixed(1)} DPR</div>
                </div>
                <div class="advantage-state ${results.advantageState === 'advantage' ? 'active' : ''}" 
                     data-state="advantage">
                    <div>Advantage</div>
                    <div>${results.advantage.toFixed(1)} DPR</div>
                </div>
                <div class="advantage-state ${results.advantageState === 'disadvantage' ? 'active' : ''}" 
                     data-state="disadvantage">
                    <div>Disadvantage</div>
                    <div>${results.disadvantage.toFixed(1)} DPR</div>
                </div>
            </div>
        `;
        
        // Add event listeners for advantage state toggles
        resultsSection.querySelectorAll('.advantage-state').forEach(stateDiv => {
            stateDiv.addEventListener('click', (e) => {
                const state = e.currentTarget.dataset.state;
                this.handleBuildChange(buildId, 'advantageState', state);
            });
        });
    }

    /**
     * Show Build Lab modal
     */
    showBuildLab(buildId = null) {
        const modal = document.getElementById('build-lab-modal');
        if (modal) {
            this.openModal('build-lab-modal');
            // Future: Initialize build lab with specific build if provided
        }
    }

    /**
     * Open a modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            // Focus management
            const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }

    /**
     * Close a modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Import a build from JSON
     */
    async importBuild(buildId) {
        try {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const text = await file.text();
                    const buildData = JSON.parse(text);
                    
                    // Validate build data
                    if (this.dndRules.validateBuild(buildData)) {
                        this.state.setBuild(buildId, buildData);
                        this.updateBuildUI(buildId);
                        console.log(`Build ${buildId} imported successfully`);
                    } else {
                        throw new Error('Invalid build data format');
                    }
                }
            };
            
            fileInput.click();
            
        } catch (error) {
            console.error(`Error importing build ${buildId}:`, error);
            this.handleError('Import failed', error);
        }
    }

    /**
     * Export a build to JSON
     */
    exportBuild(buildId) {
        try {
            const build = this.state.getBuild(buildId);
            if (!build || !build.name) {
                throw new Error('No build to export');
            }
            
            const buildData = JSON.stringify(build, null, 2);
            const blob = new Blob([buildData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${build.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            console.log(`Build ${buildId} exported successfully`);
            
        } catch (error) {
            console.error(`Error exporting build ${buildId}:`, error);
            this.handleError('Export failed', error);
        }
    }

    /**
     * Clear a build
     */
    clearBuild(buildId) {
        if (confirm('Are you sure you want to clear this build?')) {
            this.state.clearBuild(buildId);
            this.updateBuildUI(buildId);
            console.log(`Build ${buildId} cleared`);
        }
    }

    /**
     * Update build UI after data change
     */
    updateBuildUI(buildId) {
        const build = this.state.getBuild(buildId);
        const nameInput = document.getElementById(`build-${buildId}-name`);
        
        if (nameInput) {
            nameInput.value = build?.name || '';
        }
        
        this.recalculateBuild(buildId);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: Quick save (export all builds)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.exportAllBuilds();
        }
        
        // Ctrl/Cmd + O: Quick import
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            // Focus on first import button
            const firstImportBtn = document.querySelector('[id^="import-build-"]');
            if (firstImportBtn) {
                firstImportBtn.click();
            }
        }
        
        // Ctrl/Cmd + R: Recalculate all (prevent default browser refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.recalculateAllBuilds();
        }
    }

    /**
     * Export all builds as a single file
     */
    exportAllBuilds() {
        try {
            const allBuilds = {
                buildA: this.state.getBuild('a'),
                buildB: this.state.getBuild('b'),
                buildC: this.state.getBuild('c'),
                target: this.state.getTarget(),
                exportDate: new Date().toISOString()
            };
            
            const buildData = JSON.stringify(allBuilds, null, 2);
            const blob = new Blob([buildData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `archivist_builds_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            console.log('All builds exported successfully');
            
        } catch (error) {
            console.error('Error exporting all builds:', error);
            this.handleError('Export failed', error);
        }
    }

    /**
     * Global error handler
     */
    handleError(message, error) {
        console.error('Application Error:', message, error);
        
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        
        if (errorBoundary && errorMessage) {
            errorMessage.textContent = `${message}: ${error?.message || 'Unknown error'}`;
            errorBoundary.classList.remove('hidden');
        }
        
        // In development, we might want to show more detailed error info
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.trace(error);
        }
    }
}

// Make showBuildLab globally available for inline handlers
window.showBuildLab = (buildId) => {
    if (window.app) {
        window.app.showBuildLab(buildId);
    }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new ArchivistApp();
    await window.app.init();
});

// Export for module use
export { ArchivistApp };
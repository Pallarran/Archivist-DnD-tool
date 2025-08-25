/**
 * Archivist DnD Tools - UI Components
 * Custom UI component system built with vanilla JavaScript
 */

export class UIComponents {
    constructor() {
        this.components = new Map();
        this.initialized = false;
    }

    /**
     * Initialize UI components system
     */
    async init() {
        console.log('Initializing UI components...');
        
        // Initialize component registry
        this.initializeComponentRegistry();
        
        // Set up component event delegation
        this.setupEventDelegation();
        
        this.initialized = true;
        console.log('UI components initialized');
    }

    /**
     * Initialize component registry
     */
    initializeComponentRegistry() {
        // Register built-in components
        this.register('modal', ModalComponent);
        this.register('tooltip', TooltipComponent);
        this.register('collapsible', CollapsibleComponent);
        this.register('chart', ChartComponent);
        this.register('slider', SliderComponent);
        this.register('build-card', BuildCardComponent);
        this.register('results-display', ResultsDisplayComponent);
    }

    /**
     * Set up global event delegation for components
     */
    setupEventDelegation() {
        document.addEventListener('click', this.handleComponentClick.bind(this));
        document.addEventListener('change', this.handleComponentChange.bind(this));
        document.addEventListener('input', this.handleComponentInput.bind(this));
        document.addEventListener('mouseover', this.handleComponentMouseOver.bind(this));
        document.addEventListener('mouseout', this.handleComponentMouseOut.bind(this));
    }

    /**
     * Register a new component type
     */
    register(name, componentClass) {
        this.components.set(name, componentClass);
    }

    /**
     * Create a new component instance
     */
    create(type, element, options = {}) {
        const ComponentClass = this.components.get(type);
        if (!ComponentClass) {
            throw new Error(`Unknown component type: ${type}`);
        }

        return new ComponentClass(element, options);
    }

    /**
     * Initialize all components in the DOM
     */
    initializeAll() {
        // Initialize components based on data attributes
        document.querySelectorAll('[data-component]').forEach(element => {
            const type = element.dataset.component;
            const options = this.parseOptions(element.dataset.options);
            
            try {
                this.create(type, element, options);
            } catch (error) {
                console.warn(`Failed to initialize component ${type}:`, error);
            }
        });
    }

    /**
     * Parse component options from string
     */
    parseOptions(optionsString) {
        if (!optionsString) return {};
        
        try {
            return JSON.parse(optionsString);
        } catch (error) {
            console.warn('Invalid component options:', optionsString);
            return {};
        }
    }

    /**
     * Handle component click events
     */
    handleComponentClick(e) {
        const componentElement = e.target.closest('[data-component]');
        if (!componentElement) return;

        const type = componentElement.dataset.component;
        const action = e.target.dataset.action;

        if (action) {
            this.triggerComponentAction(componentElement, action, e);
        }
    }

    /**
     * Handle component change events
     */
    handleComponentChange(e) {
        const componentElement = e.target.closest('[data-component]');
        if (!componentElement) return;

        this.triggerComponentAction(componentElement, 'change', e);
    }

    /**
     * Handle component input events
     */
    handleComponentInput(e) {
        const componentElement = e.target.closest('[data-component]');
        if (!componentElement) return;

        this.triggerComponentAction(componentElement, 'input', e);
    }

    /**
     * Handle component mouse over events
     */
    handleComponentMouseOver(e) {
        if (e.target.dataset.tooltip) {
            this.showTooltip(e.target, e.target.dataset.tooltip);
        }
    }

    /**
     * Handle component mouse out events
     */
    handleComponentMouseOut(e) {
        if (e.target.dataset.tooltip) {
            this.hideTooltip(e.target);
        }
    }

    /**
     * Trigger a component action
     */
    triggerComponentAction(element, action, event) {
        const customEvent = new CustomEvent(`component:${action}`, {
            detail: { element, originalEvent: event },
            bubbles: true
        });
        
        element.dispatchEvent(customEvent);
    }

    /**
     * Show tooltip
     */
    showTooltip(element, content) {
        const existingTooltip = document.querySelector('.tooltip-popup');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-popup';
        tooltip.textContent = content;
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '1000';
        tooltip.style.background = 'var(--text-primary)';
        tooltip.style.color = 'white';
        tooltip.style.padding = 'var(--spacing-2) var(--spacing-3)';
        tooltip.style.borderRadius = 'var(--radius-md)';
        tooltip.style.fontSize = 'var(--text-sm)';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.pointerEvents = 'none';

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;

        // Adjust if tooltip would go off screen
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }
        if (top < 8) {
            top = rect.bottom + 8;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    /**
     * Hide tooltip
     */
    hideTooltip(element) {
        const tooltip = document.querySelector('.tooltip-popup');
        if (tooltip) {
            tooltip.remove();
        }
    }
}

/**
 * Base Component Class
 */
class Component {
    constructor(element, options = {}) {
        this.element = element;
        this.options = { ...this.defaultOptions, ...options };
        this.initialized = false;
        
        this.init();
    }

    get defaultOptions() {
        return {};
    }

    init() {
        this.setupEventListeners();
        this.initialized = true;
    }

    setupEventListeners() {
        // Override in subclasses
    }

    destroy() {
        // Override in subclasses
        this.initialized = false;
    }

    emit(eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: { component: this, ...data },
            bubbles: true
        });
        
        this.element.dispatchEvent(event);
    }
}

/**
 * Modal Component
 */
class ModalComponent extends Component {
    get defaultOptions() {
        return {
            closeOnEscape: true,
            closeOnBackdrop: true,
            focusOnOpen: true
        };
    }

    setupEventListeners() {
        // Close button
        const closeBtn = this.element.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Backdrop click
        if (this.options.closeOnBackdrop) {
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.close();
                }
            });
        }

        // Escape key
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen()) {
                    this.close();
                }
            });
        }
    }

    open() {
        this.element.classList.add('active');
        this.element.setAttribute('aria-hidden', 'false');
        
        if (this.options.focusOnOpen) {
            const firstFocusable = this.element.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }

        this.emit('modal:opened');
    }

    close() {
        this.element.classList.remove('active');
        this.element.setAttribute('aria-hidden', 'true');
        this.emit('modal:closed');
    }

    isOpen() {
        return this.element.classList.contains('active');
    }
}

/**
 * Tooltip Component
 */
class TooltipComponent extends Component {
    get defaultOptions() {
        return {
            placement: 'top',
            delay: 500,
            content: ''
        };
    }

    setupEventListeners() {
        this.element.addEventListener('mouseenter', () => this.show());
        this.element.addEventListener('mouseleave', () => this.hide());
        this.element.addEventListener('focus', () => this.show());
        this.element.addEventListener('blur', () => this.hide());
    }

    show() {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }

        this.showTimeout = setTimeout(() => {
            this.createTooltip();
        }, this.options.delay);
    }

    hide() {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }

        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    createTooltip() {
        if (this.tooltip) return;

        const content = this.options.content || this.element.dataset.tooltip;
        if (!content) return;

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip-popup';
        this.tooltip.textContent = content;
        
        // Apply styles
        Object.assign(this.tooltip.style, {
            position: 'absolute',
            zIndex: '1000',
            background: 'var(--text-primary)',
            color: 'white',
            padding: 'var(--spacing-2) var(--spacing-3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
        });

        document.body.appendChild(this.tooltip);
        this.positionTooltip();
    }

    positionTooltip() {
        if (!this.tooltip) return;

        const rect = this.element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;

        // Adjust positioning based on placement and screen boundaries
        if (this.options.placement === 'bottom') {
            top = rect.bottom + 8;
        }

        // Prevent overflow
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }
        if (top < 8) {
            top = rect.bottom + 8;
        }

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }
}

/**
 * Collapsible Component
 */
class CollapsibleComponent extends Component {
    get defaultOptions() {
        return {
            expanded: false,
            animationDuration: 300
        };
    }

    init() {
        super.init();
        
        this.header = this.element.querySelector('.collapsible-header');
        this.content = this.element.querySelector('.collapsible-content');
        
        if (!this.header || !this.content) {
            console.warn('Collapsible component missing header or content');
            return;
        }

        // Set initial state
        this.setExpanded(this.options.expanded);
    }

    setupEventListeners() {
        if (this.header) {
            this.header.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.setExpanded(!this.isExpanded());
    }

    expand() {
        this.setExpanded(true);
    }

    collapse() {
        this.setExpanded(false);
    }

    isExpanded() {
        return this.content.classList.contains('expanded');
    }

    setExpanded(expanded) {
        if (expanded) {
            this.content.classList.add('expanded');
            this.content.style.maxHeight = this.content.scrollHeight + 'px';
            this.header.setAttribute('aria-expanded', 'true');
        } else {
            this.content.classList.remove('expanded');
            this.content.style.maxHeight = '0';
            this.header.setAttribute('aria-expanded', 'false');
        }

        this.emit('collapsible:toggled', { expanded });
    }
}

/**
 * Chart Component
 */
class ChartComponent extends Component {
    get defaultOptions() {
        return {
            type: 'line',
            width: 400,
            height: 300,
            responsive: true
        };
    }

    init() {
        super.init();
        
        this.canvas = this.element.querySelector('canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.element.appendChild(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        
        this.setupCanvas();
    }

    setupCanvas() {
        if (this.options.responsive) {
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        } else {
            this.canvas.width = this.options.width;
            this.canvas.height = this.options.height;
        }
    }

    resizeCanvas() {
        const rect = this.element.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = (this.options.height || 300) * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = (this.options.height || 300) + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        // Redraw if we have data
        if (this.data.length > 0) {
            this.render();
        }
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Basic line chart implementation
        if (this.options.type === 'line' && this.data.length > 0) {
            this.renderLineChart();
        }
    }

    renderLineChart() {
        const padding = 40;
        const width = this.canvas.width / (window.devicePixelRatio || 1) - padding * 2;
        const height = this.canvas.height / (window.devicePixelRatio || 1) - padding * 2;
        
        // Find min/max values
        const values = this.data.map(d => d.y);
        const minY = Math.min(...values);
        const maxY = Math.max(...values);
        const range = maxY - minY || 1;
        
        // Draw axes
        this.ctx.strokeStyle = '#ccc';
        this.ctx.beginPath();
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, height + padding);
        this.ctx.lineTo(width + padding, height + padding);
        this.ctx.stroke();
        
        // Draw line
        if (this.data.length > 1) {
            this.ctx.strokeStyle = 'var(--primary-color)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            this.data.forEach((point, index) => {
                const x = padding + (index / (this.data.length - 1)) * width;
                const y = padding + height - ((point.y - minY) / range) * height;
                
                if (index === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            
            this.ctx.stroke();
        }
        
        // Draw points
        this.ctx.fillStyle = 'var(--primary-color)';
        this.data.forEach((point, index) => {
            const x = padding + (index / (this.data.length - 1 || 1)) * width;
            const y = padding + height - ((point.y - minY) / range) * height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

/**
 * Slider Component
 */
class SliderComponent extends Component {
    get defaultOptions() {
        return {
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            showValue: true
        };
    }

    init() {
        super.init();
        
        this.input = this.element.querySelector('input[type="range"]');
        if (!this.input) {
            console.warn('Slider component missing range input');
            return;
        }

        this.valueDisplay = this.element.querySelector('.slider-value');
        this.setupSlider();
    }

    setupEventListeners() {
        if (this.input) {
            this.input.addEventListener('input', (e) => {
                this.updateValue(e.target.value);
            });
        }
    }

    setupSlider() {
        this.input.min = this.options.min;
        this.input.max = this.options.max;
        this.input.step = this.options.step;
        this.input.value = this.options.value;

        if (this.options.showValue && !this.valueDisplay) {
            this.valueDisplay = document.createElement('span');
            this.valueDisplay.className = 'slider-value';
            this.element.appendChild(this.valueDisplay);
        }

        this.updateValue(this.options.value);
    }

    updateValue(value) {
        this.input.value = value;
        
        if (this.valueDisplay) {
            this.valueDisplay.textContent = value;
        }

        this.emit('slider:changed', { value: parseFloat(value) });
    }

    getValue() {
        return parseFloat(this.input.value);
    }

    setValue(value) {
        this.updateValue(value);
    }
}

/**
 * Build Card Component
 */
class BuildCardComponent extends Component {
    get defaultOptions() {
        return {
            buildId: '',
            editable: true
        };
    }

    init() {
        super.init();
        this.buildId = this.options.buildId || this.element.dataset.buildId;
    }

    setupEventListeners() {
        // Handle build actions
        const importBtn = this.element.querySelector('.import-build');
        const exportBtn = this.element.querySelector('.export-build');
        const clearBtn = this.element.querySelector('.clear-build');

        if (importBtn) {
            importBtn.addEventListener('click', () => this.emit('build:import', { buildId: this.buildId }));
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.emit('build:export', { buildId: this.buildId }));
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.emit('build:clear', { buildId: this.buildId }));
        }
    }
}

/**
 * Results Display Component
 */
class ResultsDisplayComponent extends Component {
    get defaultOptions() {
        return {
            animated: true,
            showBreakdown: true
        };
    }

    setResults(results) {
        this.results = results;
        this.render();
    }

    render() {
        if (!this.results) {
            this.element.innerHTML = '<p>No results to display</p>';
            return;
        }

        const html = `
            <div class="results-summary">
                <div class="metric">
                    <span class="value">${this.results.dpr.toFixed(1)}</span>
                    <span class="label">Average DPR</span>
                </div>
                <div class="metric">
                    <span class="value">${this.results.hitChance.toFixed(0)}%</span>
                    <span class="label">Hit Chance</span>
                </div>
                <div class="metric">
                    <span class="value">${this.results.critChance.toFixed(1)}%</span>
                    <span class="label">Crit Chance</span>
                </div>
            </div>
        `;

        this.element.innerHTML = html;

        if (this.options.animated) {
            this.animateValues();
        }
    }

    animateValues() {
        // Simple animation for numeric values
        const values = this.element.querySelectorAll('.value');
        values.forEach(valueEl => {
            valueEl.style.transform = 'scale(1.1)';
            setTimeout(() => {
                valueEl.style.transform = 'scale(1)';
            }, 150);
        });
    }
}
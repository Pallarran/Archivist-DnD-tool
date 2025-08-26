# Archivist D&D Tools Development Plan

## Phase 1: Project Foundation (Week 1)

### 1. Repository Setup & Infrastructure
- Initialize Vite + React + TypeScript project with PWA support
- Configure GitHub Pages deployment with GitHub Actions workflow
- Set up project structure with proper folder organization
- Install core dependencies: React, TypeScript, Zustand, Zod, Vite PWA plugin
- Configure Vite for GitHub Pages deployment (base path, SPA routing)
- Set up basic PWA manifest and service worker

### 2. Core Architecture & Data Models  
- Define TypeScript interfaces for Build object schema (as per spec)
- Create Zod schemas for validation
- Set up Zustand store structure for state management
- Implement basic effects-as-objects system for features/spells/feats
- Create localStorage persistence layer with JSON import/export

### 3. Basic UI Foundation
- Implement responsive 3-column layout for build comparison
- Create reusable UI components (buttons, sliders, inputs, panels)
- Set up routing structure for different modules
- Implement basic Target Panel with AC slider and resistance toggles

## Phase 2: DPR Simulator Core (Week 2)

### 4. Math Engine Development
- Implement deterministic probability calculations (hit, crit, advantage/disadvantage)
- Build dice rolling and damage calculation systems
- Create advantage state handling (normal/advantage/disadvantage, Elven Accuracy)
- Implement power attack (Sharpshooter/GWM) EV calculations
- Add once-per-turn effect logic with proper priority handling

### 5. DPR Simulator MVP
- Build input forms for attack profiles and character stats
- Implement basic policy engine for automated decision making
- Create results display with DPR breakdown by round
- Add advantage state sweep comparison
- Implement Sharpshooter/GWM advisor with break-even AC calculations

### 6. Build Lab Module
- Create character builder interface with class/subclass selection
- Implement feat and feature selection system
- Add equipment and spell management
- Build JSON import/export functionality for builds

## Phase 3: Leveling Explorer & Enhanced Features (Week 3)

### 7. Leveling DPR Explorer
- Implement level 1-20 progression system
- Create multi-line DPR chart visualization
- Add feature timeline with breakpoint indicators
- Implement automatic class table population (attacks, spell slots, etc.)
- Add advantage state toggles and export functionality

### 8. Enhanced DPR Features
- Add spell attack and save-based effect support
- Implement AoE multi-target calculations
- Create off-turn action system (opportunity attacks, reactions)
- Add sensitivity analysis graphs across AC ranges
- Build detailed trace panel for step-by-step math explanation

## Phase 4: Character Compare & Polish (Week 4+)

### 9. Character Compare Module
- Implement multi-dimensional comparison system (defense, control, utility, etc.)
- Create radar chart visualization with user-weighted categories
- Build feature & spell diff panel with filtering
- Add resource economy timeline visualization

### 10. Testing & Validation
- Implement comprehensive test suite with Vitest
- Create golden case validation tests against known scenarios
- Add property tests for probability invariants
- Test PWA functionality and offline capabilities

### 11. UI/UX Polish & Accessibility
- Implement responsive mobile design with card stack layout
- Add keyboard navigation and ARIA labels
- Create proper color-safe chart themes
- Add loading states and error handling
- Implement shareable links functionality

## Phase 5: Advanced Features (Future)

### 12. Monte Carlo System
- Implement seeded RNG for complex stateful scenarios
- Add confidence intervals and statistical reporting
- Create encounter simulation with multiple rounds

### 13. Library Expansion
- Build comprehensive effects library for 2014-era content
- Implement homebrew editor for custom effects
- Add preset encounter packs and enemy templates

## Technical Considerations

- **Frontend Stack**: React 18 + TypeScript + Zustand + Zod + Vite
- **Deployment**: GitHub Pages with automated CI/CD via GitHub Actions
- **PWA**: Offline-first with service worker, installable on desktop/mobile
- **Math Engine**: Pure TypeScript for tree-shaking, future WebAssembly optimization
- **Data Persistence**: localStorage with JSON import/export, no backend required
- **Testing**: Vitest for unit tests, comprehensive validation suite

## Project Structure
```
archivist-dnd-tools/
├── src/
│   ├── components/          # Reusable UI components
│   ├── modules/            # Core app modules (DPR, Leveling, Compare)
│   ├── engine/             # Math and calculation engine
│   ├── types/              # TypeScript type definitions
│   ├── store/              # Zustand state management
│   ├── utils/              # Helper functions
│   └── data/               # Static game data and effects
├── public/                 # PWA assets and manifest
├── tests/                  # Test suites
├── .github/workflows/      # CI/CD configuration
└── docs/                   # Documentation
```

## Core Data Models

### Build Object Schema
```typescript
interface Build {
  name: string;
  levels: Array<{
    class: string;
    subclass: string;
    level: number;
  }>;
  abilities: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  proficiencyBonus: number;
  proficiencies: {
    weapons: string[];
    saves: string[];
  };
  feats: string[];
  fightingStyle?: string;
  features: string[];
  equipment: {
    mainHand?: Weapon;
    offHand?: Weapon;
    armor?: Armor;
  };
  spellsKnown: string[];
  spellSlots: Record<string, number>;
  policies: {
    powerAttackThresholdEV: number;
    smitePolicy: "never" | "firstHit" | "onCrit" | "onlyAboveCR";
    oncePerTurnPriority: "firstHit" | "bestHit";
    bonusActionPriority: string[];
    precast: string[];
    resourceBudget: {
      slotsPerFight: Record<string, number>;
    };
  };
}
```

### Effect Object Schema
```typescript
interface Effect {
  id: string;
  name: string;
  description: string;
  source: {
    book: string;
    page: number;
  };
  prerequisites?: string[];
  hooks: {
    onAttackRoll?: (context: AttackContext) => AttackModifier;
    onHit?: (context: HitContext) => DamageModifier;
    onCrit?: (context: CritContext) => DamageModifier;
    onDamageRoll?: (context: DamageContext) => DamageModifier;
    onSave?: (context: SaveContext) => SaveModifier;
  };
  modifiers: {
    toHit?: number;
    damageDice?: string;
    damageBonus?: number;
    critRange?: number;
    advantageState?: "advantage" | "disadvantage";
    saveMode?: "negates" | "half" | "evasion";
  };
  stacking: {
    replaces?: boolean;
    mutuallyExclusive?: string[];
  };
  duration?: {
    rounds?: number;
    concentration?: boolean;
  };
  resourceCost?: {
    type: "spellSlot" | "superiorityDie" | "ki" | "rage";
    amount: number;
  };
}
```

## Success Metrics

- Functional 3-build DPR comparison with accurate math
- Complete level 1-20 progression visualization
- PWA installation and offline functionality
- Comprehensive 2014-era D&D 5e rule coverage
- Export functionality for builds and results
- Mobile-responsive design

## MVP Acceptance Criteria

### DPR Simulator
- [ ] 3-column build comparison interface
- [ ] Target panel with AC, saves, resistances
- [ ] Attack profile inputs with advantage states
- [ ] Policy engine for automated decisions
- [ ] Results display with round-by-round breakdown
- [ ] Sharpshooter/GWM break-even calculations
- [ ] Advantage state sweep comparison

### Leveling DPR Explorer
- [ ] Level 1-20 DPR progression charts
- [ ] Feature timeline with breakpoints
- [ ] Class table auto-population
- [ ] Export functionality

### Build Lab
- [ ] Character builder interface
- [ ] Class/subclass selection with multiclassing
- [ ] Feat and feature management
- [ ] JSON import/export

### Technical Requirements
- [ ] GitHub Pages deployment
- [ ] PWA functionality with offline support
- [ ] Responsive mobile design
- [ ] Comprehensive test coverage
- [ ] Accessibility compliance

## Development Guidelines

1. **Rules-First Approach**: Implement 2014-era D&D 5e rules accurately with clear source attribution
2. **Deterministic Math**: Use analytical probability calculations with Monte Carlo as fallback
3. **Explainable Results**: Every calculation should be traceable and breakdownable
4. **Mobile-First**: Design for mobile with desktop enhancements
5. **Offline-First**: Full functionality without internet connection
6. **Type Safety**: Comprehensive TypeScript coverage with Zod validation
7. **Performance**: Tree-shakeable modules, lazy loading, efficient re-renders
8. **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support

## Risk Mitigation

- **Content Licensing**: Use only SRD-safe content, allow user imports for additional content
- **Complexity Management**: Modular architecture with clear separation of concerns
- **Performance**: Optimize calculations, implement virtual scrolling for large lists
- **Browser Compatibility**: Target modern browsers, progressive enhancement
- **Maintenance**: Comprehensive documentation and test coverage for long-term sustainability
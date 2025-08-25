# Archivist DnD Tools - Development Plan

## Project Overview
A pure vanilla web application for D&D 5e character optimization, featuring DPR simulation, leveling analysis, and character comparison. Built without frameworks or build tools for easy browser hosting.

## Technical Stack
- **Core Technologies**: Vanilla HTML5, CSS3, ES6+ JavaScript
- **Storage**: localStorage + JSON export/import
- **Charts**: HTML5 Canvas or SVG with custom drawing
- **Deployment**: Static hosting (GitHub Pages, Netlify, etc.)
- **PWA**: Service Worker + Web App Manifest
- **Dependencies**: Zero npm packages or build tools

## File Structure
```
/
├── index.html                 # Main application entry point
├── manifest.json             # PWA manifest
├── service-worker.js         # Offline functionality
├── css/
│   ├── styles.css           # Main stylesheet
│   ├── components.css       # Component-specific styles
│   └── responsive.css       # Mobile responsive styles
├── js/
│   ├── app.js              # Main application controller
│   ├── math-engine.js      # Probability and DPR calculations
│   ├── dnd-rules.js        # Game rules and mechanics
│   ├── ui-components.js    # Custom UI components
│   ├── charts.js           # Visualization library
│   ├── state-manager.js    # Application state management
│   └── utils.js            # Utility functions
├── data/
│   ├── classes.json        # Character classes and subclasses
│   ├── spells.json         # Spell database (SRD-compliant)
│   ├── equipment.json      # Weapons, armor, and gear
│   ├── feats.json          # Available feats
│   └── conditions.json     # Buffs, debuffs, conditions
└── assets/
    ├── icons/              # UI icons and symbols
    └── images/             # Background images, logos
```

## Development Phases

### Phase 1: Foundation & Setup (Week 1)

#### 1.1 Project Structure Setup
- [ ] Create basic HTML structure with semantic markup
- [ ] Set up CSS architecture with modular stylesheets
- [ ] Initialize JavaScript module system (ES6 imports/exports)
- [ ] Create development environment without build tools

#### 1.2 Core Architecture
- [ ] Implement custom state management system
- [ ] Create component-based architecture using vanilla JS
- [ ] Set up event system for component communication
- [ ] Establish data validation patterns

#### 1.3 UI Foundation
- [ ] Build three-column responsive layout
- [ ] Create Target Panel component
- [ ] Implement Build Input cards
- [ ] Set up mobile card-stack view with touch gestures
- [ ] Create basic routing system

#### 1.4 Data Models
- [ ] Define TypeScript-style interfaces in JSDoc
- [ ] Create Build object schema (matching product spec)
- [ ] Implement validation functions
- [ ] Set up localStorage persistence layer

### Phase 2: Math Engine & DPR Core (Week 2)

#### 2.1 Probability Mathematics
- [ ] Implement basic dice probability calculations
- [ ] Create advantage/disadvantage mechanics
- [ ] Add Elven Accuracy and Halfling Luck support
- [ ] Build bonus dice system (Bless, Bardic Inspiration)
- [ ] Implement discrete convolution for complex dice

#### 2.2 Combat Mechanics
- [ ] Create hit/crit calculation engine
- [ ] Implement damage calculation with all modifiers
- [ ] Add once-per-turn effect logic
- [ ] Build power attack (Sharpshooter/GWM) EV calculations
- [ ] Create reroll mechanics (Great Weapon Fighting, etc.)

#### 2.3 DPR Simulator Core
- [ ] Implement basic attack sequence simulation
- [ ] Add policy engine for automated decisions
- [ ] Create advantage state sweep functionality
- [ ] Build results calculation and aggregation
- [ ] Implement AC sensitivity analysis

#### 2.4 Target System
- [ ] Create AC and save modifier inputs
- [ ] Implement resistance/immunity toggles
- [ ] Add enemy trait support (Magic Resistance, etc.)
- [ ] Build AoE target count handling

### Phase 3: Advanced Features & Visualization (Week 3)

#### 3.1 Leveling DPR Explorer
- [ ] Implement 1-20 level progression system
- [ ] Create class progression data structures
- [ ] Build level timeline with breakpoint detection
- [ ] Add feature acquisition tracking
- [ ] Implement multi-build level comparison

#### 3.2 Enhanced DPR Features
- [ ] Add spell attack calculations
- [ ] Implement save-based effects
- [ ] Create off-turn action system (OA, reactions)
- [ ] Build round scripting functionality
- [ ] Add Monte Carlo simulation mode

#### 3.3 Custom Chart Library
- [ ] Create base chart rendering system (Canvas/SVG)
- [ ] Implement line charts for DPR progression
- [ ] Add sensitivity micro-graphs
- [ ] Build radar charts for character comparison
- [ ] Create interactive chart controls

#### 3.4 Data Import/Export
- [ ] Implement JSON build export/import
- [ ] Create shareable URL system
- [ ] Add file drag-and-drop support
- [ ] Build backup/restore functionality

### Phase 4: Character Comparison & Polish (Week 4+)

#### 4.1 Character Compare Module
- [ ] Build weighted comparison system
- [ ] Create defense/control/utility metrics
- [ ] Implement radar chart visualization
- [ ] Add Feature & Spell Diff panel
- [ ] Build resource economy timeline

#### 4.2 Library System
- [ ] Populate SRD-compliant spell database
- [ ] Create feature/feat effect objects
- [ ] Implement search and filtering
- [ ] Add homebrew toggle system
- [ ] Create effect composition engine

#### 4.3 UI/UX Polish
- [ ] Implement smooth animations and transitions
- [ ] Add keyboard navigation support
- [ ] Create loading states and progress indicators
- [ ] Build help tooltips and documentation
- [ ] Optimize for screen readers (accessibility)

#### 4.4 PWA Implementation
- [ ] Create service worker for offline functionality
- [ ] Implement app manifest for installation
- [ ] Add caching strategies
- [ ] Build update notification system

## Testing Strategy

### Unit Testing
- [ ] Mathematical accuracy tests (golden cases)
- [ ] Probability distribution validation
- [ ] Edge case handling verification
- [ ] Performance benchmarks

### Integration Testing
- [ ] End-to-end build comparison scenarios
- [ ] Cross-browser compatibility testing
- [ ] Mobile device testing
- [ ] Offline functionality validation

### Validation Suite (Golden Cases)
- [ ] Basic weapon attacks vs AC 10-22
- [ ] Advantage/disadvantage & Elven Accuracy
- [ ] Bless/Bane/Bardic Inspiration mechanics
- [ ] Once-per-turn effects (Sneak Attack)
- [ ] Save-for-half and Evasion interactions
- [ ] Power-attack EV switching thresholds
- [ ] Crit-triggered bonus actions

## Deployment Plan

### Hosting Options
1. **GitHub Pages** - Free static hosting with custom domain support
2. **Netlify** - Free tier with form handling and edge functions
3. **Vercel** - Free static hosting with global CDN
4. **Firebase Hosting** - Google's static hosting solution

### Deployment Steps
- [ ] Set up automated deployment pipeline
- [ ] Configure custom domain and SSL
- [ ] Implement CDN for asset delivery
- [ ] Set up analytics and error tracking
- [ ] Create backup and version management

## Performance Targets
- **Initial Load**: < 3 seconds on 3G connection
- **Time to Interactive**: < 5 seconds
- **Bundle Size**: < 500KB total (uncompressed)
- **Lighthouse Score**: > 90 in all categories
- **Memory Usage**: < 50MB typical usage

## Accessibility Requirements
- **WCAG 2.1 AA Compliance**: All interactive elements
- **Keyboard Navigation**: Complete app navigable without mouse
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: 4.5:1 minimum ratio
- **Focus Management**: Clear visual focus indicators

## Browser Support
- **Chrome**: 80+ (95% of users)
- **Firefox**: 75+ (4% of users)
- **Safari**: 13+ (iOS and macOS)
- **Edge**: 80+ (Chromium-based)
- **Mobile**: iOS Safari 13+, Chrome Android 80+

## Success Criteria

### MVP Deliverables
- [ ] Functional 3-build DPR comparison
- [ ] Leveling Explorer with 1-20 progression curves
- [ ] Mobile-responsive design
- [ ] Offline functionality (PWA)
- [ ] JSON import/export

### Quality Metrics
- [ ] All golden case tests pass
- [ ] No console errors in supported browsers
- [ ] Lighthouse performance score > 90
- [ ] Works offline after initial load
- [ ] Responsive on screen sizes 320px to 1920px+

### User Experience Goals
- [ ] Intuitive three-column comparison interface
- [ ] Real-time calculation updates
- [ ] Smooth animations and transitions
- [ ] Clear explanation of all numbers (explainable outputs)
- [ ] Easy build sharing via URLs

## Risk Mitigation

### Technical Risks
- **Browser Compatibility**: Regular testing across target browsers
- **Performance**: Lazy loading and code splitting strategies
- **Math Accuracy**: Comprehensive test suite with known results
- **State Management**: Clear data flow patterns and validation

### Scope Risks
- **Feature Creep**: Strict adherence to MVP requirements
- **Complexity**: Modular architecture for maintainability
- **Timeline**: Regular milestone reviews and adjustments

## Future Enhancements (Post-MVP)
- Monster database for encounter building
- Party synergy analysis
- Multi-encounter resource management
- Advanced homebrew editor
- Community build sharing
- Mobile app wrapper (Capacitor/Cordova)

## Resources & References
- **D&D 5e SRD**: [Open Gaming License content](https://dnd.wizards.com/resources/systems-reference-document)
- **Math References**: Probability theory and discrete mathematics
- **Web APIs**: Canvas, ServiceWorker, Web App Manifest
- **Accessibility**: WCAG 2.1 guidelines and ARIA best practices
/**
 * Enhanced Export/Import System for Build Sharing
 * Supports multiple formats, validation, and sharing features
 */

import type { Build } from '../types/build';
import type { Effect } from '../types/effects';
import type { MonteCarloResults } from '../engine/monteCarlo';

// Export format types
export type ExportFormat = 'json' | 'csv' | 'pdf' | 'url' | 'qr';

// Export options
export interface ExportOptions {
  format: ExportFormat;
  includeResults?: boolean;
  includeHomebrewEffects?: boolean;
  compression?: boolean;
  sharing?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}

// Import validation result
export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  version?: string;
  buildCount?: number;
}

// Shareable build package
export interface BuildPackage {
  version: string;
  timestamp: string;
  application: string;
  builds: Build[];
  homebrewEffects?: Effect[];
  simulationResults?: MonteCarloResults[];
  metadata: {
    title: string;
    description: string;
    author?: string;
    tags: string[];
    sourceBooks: string[];
  };
  checksum: string;
}

/**
 * Enhanced Export/Import Manager
 */
export class ExportImportManager {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly APP_NAME = 'Archivist D&D Tools';

  /**
   * Export builds to specified format
   */
  static async exportBuilds(
    builds: Build[], 
    options: ExportOptions,
    homebrewEffects: Effect[] = [],
    simulationResults: MonteCarloResults[] = []
  ): Promise<string | Blob> {
    switch (options.format) {
      case 'json':
        return this.exportToJSON(builds, options, homebrewEffects, simulationResults);
      case 'csv':
        return this.exportToCSV(builds, options);
      case 'pdf':
        return await this.exportToPDF(builds, options, simulationResults);
      case 'url':
        return this.exportToURL(builds, options);
      case 'qr':
        return await this.exportToQR(builds, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export to JSON with comprehensive package
   */
  private static exportToJSON(
    builds: Build[], 
    options: ExportOptions,
    homebrewEffects: Effect[] = [],
    simulationResults: MonteCarloResults[] = []
  ): string {
    const packageData: BuildPackage = {
      version: this.CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      application: this.APP_NAME,
      builds: builds.map(build => this.sanitizeBuild(build)),
      homebrewEffects: options.includeHomebrewEffects ? homebrewEffects : undefined,
      simulationResults: options.includeResults ? simulationResults : undefined,
      metadata: {
        title: options.sharing?.title || `${builds.length} Character Build${builds.length !== 1 ? 's' : ''}`,
        description: options.sharing?.description || 'Exported from Archivist D&D Tools',
        tags: options.sharing?.tags || [],
        sourceBooks: this.extractSourceBooks(builds, homebrewEffects)
      },
      checksum: '' // Will be calculated after JSON creation
    };

    // Calculate checksum
    const jsonData = JSON.stringify(packageData, null, 2);
    packageData.checksum = this.calculateChecksum(jsonData);

    const finalJson = JSON.stringify(packageData, null, 2);

    return options.compression ? this.compressJSON(finalJson) : finalJson;
  }

  /**
   * Export to CSV format for spreadsheet analysis
   */
  private static exportToCSV(builds: Build[], options: ExportOptions): string {
    const headers = [
      'Name',
      'Total Level',
      'Classes',
      'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA',
      'Proficiency Bonus',
      'AC (estimated)',
      'HP (estimated)',
      'Main Weapon',
      'Fighting Style',
      'Feats',
      'Spells Known',
      'Created Date',
      'Last Modified'
    ];

    const rows = builds.map(build => [
      build.name,
      build.levels.reduce((sum, level) => sum + level.level, 0),
      build.levels.map(l => `${l.class} ${l.level}`).join('; '),
      build.abilities.strength,
      build.abilities.dexterity,
      build.abilities.constitution,
      build.abilities.intelligence,
      build.abilities.wisdom,
      build.abilities.charisma,
      build.proficiencyBonus,
      this.estimateAC(build),
      this.estimateHP(build),
      build.equipment.mainHand?.name || 'None',
      build.fightingStyles?.join(', ') || 'None',
      build.features.filter(f => f.includes('feat')).join(', ') || 'None',
      build.spells.length,
      build.createdAt,
      build.lastModified
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Export to PDF format (returns blob)
   */
  private static async exportToPDF(
    builds: Build[], 
    options: ExportOptions,
    simulationResults: MonteCarloResults[] = []
  ): Promise<Blob> {
    // This would typically use a library like jsPDF or PDFKit
    // For now, we'll create a simple HTML-to-PDF conversion
    
    const htmlContent = this.generatePDFHTML(builds, simulationResults, options);
    
    // In a real implementation, you'd use html2pdf or similar
    // For now, return a blob with the HTML content
    return new Blob([htmlContent], { type: 'text/html' });
  }

  /**
   * Export to shareable URL
   */
  private static exportToURL(builds: Build[], options: ExportOptions): string {
    const compactData = {
      v: this.CURRENT_VERSION,
      b: builds.map(build => this.compactBuild(build))
    };

    const encoded = this.encodeForURL(JSON.stringify(compactData));
    const baseUrl = window.location.origin + window.location.pathname;
    
    return `${baseUrl}#share=${encoded}`;
  }

  /**
   * Export to QR code (returns blob with QR code image)
   */
  private static async exportToQR(builds: Build[], options: ExportOptions): Promise<Blob> {
    const url = this.exportToURL(builds, options);
    
    // Generate QR code (would typically use QR.js or similar library)
    const qrData = this.generateQRCode(url);
    
    // Return as image blob
    return new Blob([qrData], { type: 'image/png' });
  }

  /**
   * Import builds from various formats
   */
  static async importBuilds(data: string | File): Promise<{
    builds: Build[];
    homebrewEffects?: Effect[];
    simulationResults?: MonteCarloResults[];
    metadata?: BuildPackage['metadata'];
  }> {
    let content: string;

    if (data instanceof File) {
      content = await this.readFile(data);
      
      // Handle different file types
      if (data.name.endsWith('.csv')) {
        return this.importFromCSV(content);
      } else if (data.name.endsWith('.json')) {
        return this.importFromJSON(content);
      }
    } else if (typeof data === 'string') {
      // Handle URL sharing format
      if (data.startsWith('#share=')) {
        return this.importFromURL(data);
      } else {
        return this.importFromJSON(data);
      }
    }

    throw new Error('Unsupported import format');
  }

  /**
   * Import from JSON package
   */
  private static importFromJSON(jsonData: string): {
    builds: Build[];
    homebrewEffects?: Effect[];
    simulationResults?: MonteCarloResults[];
    metadata?: BuildPackage['metadata'];
  } {
    try {
      // Try decompression first
      let data: string;
      try {
        data = this.decompressJSON(jsonData);
      } catch {
        data = jsonData;
      }

      const packageData: BuildPackage = JSON.parse(data);
      
      // Validate package
      const validation = this.validatePackage(packageData);
      if (!validation.valid) {
        throw new Error(`Invalid package: ${validation.errors.join(', ')}`);
      }

      // Verify checksum if present
      if (packageData.checksum) {
        const calculatedChecksum = this.calculateChecksum(
          JSON.stringify({ ...packageData, checksum: '' }, null, 2)
        );
        if (calculatedChecksum !== packageData.checksum) {
          console.warn('Package checksum mismatch - data may be corrupted');
        }
      }

      return {
        builds: packageData.builds.map(build => this.validateAndUpgradeBuild(build)),
        homebrewEffects: packageData.homebrewEffects,
        simulationResults: packageData.simulationResults,
        metadata: packageData.metadata
      };
    } catch (error) {
      throw new Error(`Failed to import JSON: ${error.message}`);
    }
  }

  /**
   * Import from CSV format
   */
  private static importFromCSV(csvData: string): { builds: Build[] } {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least header and one data row');

    const headers = this.parseCSVRow(lines[0]);
    const builds: Build[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVRow(lines[i]);
      const build = this.csvRowToBuild(headers, values, i);
      if (build) builds.push(build);
    }

    return { builds };
  }

  /**
   * Import from URL sharing format
   */
  private static importFromURL(urlData: string): { builds: Build[] } {
    try {
      const encoded = urlData.replace('#share=', '');
      const decoded = this.decodeFromURL(encoded);
      const compactData = JSON.parse(decoded);

      return {
        builds: compactData.b.map((compactBuild: any) => this.expandBuild(compactBuild))
      };
    } catch (error) {
      throw new Error(`Failed to import from URL: ${error.message}`);
    }
  }

  /**
   * Validate import data
   */
  static validateImportData(data: string): ImportValidationResult {
    try {
      let parsedData: any;

      // Try different formats
      try {
        parsedData = JSON.parse(data);
      } catch {
        // Try as compressed
        try {
          const decompressed = this.decompressJSON(data);
          parsedData = JSON.parse(decompressed);
        } catch {
          return {
            valid: false,
            errors: ['Invalid JSON format'],
            warnings: []
          };
        }
      }

      return this.validatePackage(parsedData);
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }

  // Helper methods

  private static sanitizeBuild(build: Build): Build {
    // Remove sensitive or unnecessary data
    return {
      ...build,
      // Remove any computed or cached values
    };
  }

  private static compactBuild(build: Build): any {
    // Create minimal representation for URL sharing
    return {
      n: build.name,
      l: build.levels,
      a: build.abilities,
      pb: build.proficiencyBonus,
      e: build.equipment,
      f: build.features,
      s: build.spells
    };
  }

  private static expandBuild(compact: any): Build {
    // Expand from compact format
    return {
      id: this.generateId(),
      name: compact.n,
      levels: compact.l,
      abilities: compact.a,
      proficiencyBonus: compact.pb,
      equipment: compact.e,
      features: compact.f || [],
      fightingStyles: [],
      spells: compact.s || [],
      conditions: [],
      policies: {
        smitePolicy: 'optimal',
        oncePerTurnPriority: 'optimal',
        precast: [],
        buffAssumptions: 'moderate',
        powerAttackThresholdEV: 0.5
      },
      spellSlots: {},
      version: this.CURRENT_VERSION,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
  }

  private static validatePackage(packageData: any): ImportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!packageData.version) {
      warnings.push('No version information found');
    } else if (packageData.version !== this.CURRENT_VERSION) {
      warnings.push(`Version mismatch: expected ${this.CURRENT_VERSION}, got ${packageData.version}`);
    }

    if (!packageData.builds || !Array.isArray(packageData.builds)) {
      errors.push('No valid builds found');
    } else {
      packageData.builds.forEach((build: any, index: number) => {
        const buildErrors = this.validateBuild(build);
        buildErrors.forEach(error => 
          errors.push(`Build ${index + 1}: ${error}`)
        );
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      version: packageData.version,
      buildCount: packageData.builds?.length || 0
    };
  }

  private static validateBuild(build: any): string[] {
    const errors: string[] = [];

    if (!build.name) errors.push('Build name is required');
    if (!build.levels || !Array.isArray(build.levels)) errors.push('Build levels are required');
    if (!build.abilities) errors.push('Ability scores are required');

    return errors;
  }

  private static validateAndUpgradeBuild(build: any): Build {
    // Validate and upgrade build format if necessary
    return {
      id: build.id || this.generateId(),
      name: build.name,
      description: build.description,
      levels: build.levels,
      abilities: build.abilities,
      proficiencyBonus: build.proficiencyBonus,
      equipment: build.equipment || { mainHand: null, offHand: null, armor: null },
      features: build.features || [],
      fightingStyles: build.fightingStyles || [],
      spells: build.spells || [],
      conditions: build.conditions || [],
      policies: build.policies || {
        smitePolicy: 'optimal',
        oncePerTurnPriority: 'optimal',
        precast: [],
        buffAssumptions: 'moderate',
        powerAttackThresholdEV: 0.5
      },
      spellSlots: build.spellSlots || {},
      version: this.CURRENT_VERSION,
      createdAt: build.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
  }

  private static extractSourceBooks(builds: Build[], homebrewEffects: Effect[] = []): string[] {
    const books = new Set<string>();
    
    // Add books from builds (would need to analyze features, spells, etc.)
    books.add('Player\'s Handbook'); // Default
    
    // Add books from homebrew effects
    homebrewEffects.forEach(effect => {
      if (effect.source?.book && effect.source.book !== 'Homebrew') {
        books.add(effect.source.book);
      }
    });

    return Array.from(books).sort();
  }

  private static estimateAC(build: Build): number {
    let baseAC = 10;
    const dexMod = Math.floor((build.abilities.dexterity - 10) / 2);
    
    if (build.equipment.armor) {
      baseAC = build.equipment.armor.ac;
    } else {
      baseAC += dexMod;
    }

    return baseAC;
  }

  private static estimateHP(build: Build): number {
    const conMod = Math.floor((build.abilities.constitution - 10) / 2);
    let totalHP = 0;

    build.levels.forEach(level => {
      totalHP += (level.hitDie / 2 + 0.5) + conMod; // Average HP per level
    });

    return Math.round(totalHP);
  }

  private static generatePDFHTML(
    builds: Build[], 
    simulationResults: MonteCarloResults[], 
    options: ExportOptions
  ): string {
    // Generate HTML content for PDF conversion
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${options.sharing?.title || 'Character Builds'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .build { page-break-after: always; margin-bottom: 50px; }
        .build:last-child { page-break-after: avoid; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .stats { display: flex; justify-content: space-between; margin: 20px 0; }
        .stat-block { border: 1px solid #ccc; padding: 10px; margin: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
    </style>
</head>
<body>
    ${builds.map((build, index) => this.generateBuildHTML(build, simulationResults[index])).join('')}
</body>
</html>`;
  }

  private static generateBuildHTML(build: Build, results?: MonteCarloResults): string {
    return `
<div class="build">
    <div class="header">
        <h1>${build.name}</h1>
        <p>${build.description || ''}</p>
    </div>
    
    <div class="stats">
        <div class="stat-block">
            <h3>Ability Scores</h3>
            <p>STR: ${build.abilities.strength}</p>
            <p>DEX: ${build.abilities.dexterity}</p>
            <p>CON: ${build.abilities.constitution}</p>
            <p>INT: ${build.abilities.intelligence}</p>
            <p>WIS: ${build.abilities.wisdom}</p>
            <p>CHA: ${build.abilities.charisma}</p>
        </div>
        
        <div class="stat-block">
            <h3>Classes</h3>
            ${build.levels.map(level => 
              `<p>${level.class} ${level.level}${level.subclass ? ` (${level.subclass})` : ''}</p>`
            ).join('')}
        </div>
    </div>
    
    ${results ? `
    <div class="simulation-results">
        <h3>Simulation Results</h3>
        <p>Mean DPR: ${results.damage.mean.toFixed(2)}</p>
        <p>Standard Deviation: ${results.damage.standardDeviation.toFixed(2)}</p>
        <p>95% CI: ${results.damage.confidenceInterval.lower.toFixed(2)} - ${results.damage.confidenceInterval.upper.toFixed(2)}</p>
    </div>
    ` : ''}
</div>`;
  }

  private static parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"' && (i === 0 || row[i - 1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static csvRowToBuild(headers: string[], values: string[], rowIndex: number): Build | null {
    try {
      const getValue = (header: string) => {
        const index = headers.indexOf(header);
        return index >= 0 ? values[index] : '';
      };

      return {
        id: this.generateId(),
        name: getValue('Name') || `Imported Build ${rowIndex}`,
        levels: [{ 
          class: 'Fighter', 
          level: parseInt(getValue('Total Level')) || 1, 
          hitDie: 10 
        }],
        abilities: {
          strength: parseInt(getValue('STR')) || 10,
          dexterity: parseInt(getValue('DEX')) || 10,
          constitution: parseInt(getValue('CON')) || 10,
          intelligence: parseInt(getValue('INT')) || 10,
          wisdom: parseInt(getValue('WIS')) || 10,
          charisma: parseInt(getValue('CHA')) || 10,
        },
        proficiencyBonus: parseInt(getValue('Proficiency Bonus')) || 2,
        equipment: { mainHand: null, offHand: null, armor: null },
        features: [],
        fightingStyles: getValue('Fighting Style') ? [getValue('Fighting Style')] : [],
        spells: [],
        conditions: [],
        policies: {
          smitePolicy: 'optimal',
          oncePerTurnPriority: 'optimal',
          precast: [],
          buffAssumptions: 'moderate',
          powerAttackThresholdEV: 0.5
        },
        spellSlots: {},
        version: this.CURRENT_VERSION,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`Failed to parse CSV row ${rowIndex}:`, error);
      return null;
    }
  }

  private static calculateChecksum(data: string): string {
    // Simple checksum calculation (in production, use a proper hash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private static compressJSON(json: string): string {
    // Simple compression placeholder (would use real compression)
    return btoa(json);
  }

  private static decompressJSON(compressed: string): string {
    return atob(compressed);
  }

  private static encodeForURL(data: string): string {
    return encodeURIComponent(btoa(data));
  }

  private static decodeFromURL(encoded: string): string {
    return atob(decodeURIComponent(encoded));
  }

  private static generateQRCode(url: string): string {
    // QR code generation placeholder (would use QR.js or similar)
    return `QR Code for: ${url}`;
  }

  private static async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private static generateId(): string {
    return 'build_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }
}
import React, { useState, useEffect, useRef } from 'react';
import { useSimpleStore } from '../../store/simpleStore';
import type { SimpleBuild } from '../../store/simpleStore';

// Simplified interfaces for the working version
interface SimpleLevelAnalysis {
  level: number;
  proficiencyBonus: number;
  hitPointsAverage: number;
  attackBonus: number;
  damage: string;
  extraAttacks: number;
  dpr: {
    normal: number;
    advantage: number;
    disadvantage: number;
  };
  features: string[];
}

export const LevelingExplorer: React.FC = () => {
  // Store hooks
  const builds = useSimpleStore((state) => state.builds);
  const { addNotification } = useSimpleStore();

  // Get selected feats from build
  const getSelectedFeats = (build: SimpleBuild): string[] => {
    const feats: string[] = [];
    if (build.featureSelections) {
      Object.values(build.featureSelections).forEach(selection => {
        if (selection.improvements?.type === 'feat' && selection.improvements.feat) {
          feats.push(selection.improvements.feat);
        }
      });
    }
    return feats;
  };
  
  // Get fighting styles from build
  const getFightingStyles = (build: SimpleBuild): string[] => {
    const styles: string[] = [];
    if (build.featureSelections) {
      Object.values(build.featureSelections).forEach(selection => {
        if (selection.selections) {
          selection.selections.forEach(selectionId => {
            if (['archery', 'defense', 'dueling', 'great-weapon-fighting', 'protection', 'two-weapon-fighting'].includes(selectionId)) {
              styles.push(selectionId);
            }
          });
        }
      });
    }
    return styles;
  };
  
  // Calculate feature-based damage at a given level
  const calculateFeatureDamage = (build: SimpleBuild, characterLevel: number): { bonus: number; extraDamage: string[] } => {
    let bonus = 0;
    const extraDamage: string[] = [];
    const selectedFeats = getSelectedFeats(build);
    
    // Sneak Attack for Rogues
    const rogueLevel = build.classLevels?.find(cl => cl.class.toLowerCase() === 'rogue')?.level || 0;
    if (rogueLevel > 0) {
      const sneakDice = Math.ceil(rogueLevel / 2);
      extraDamage.push(`Sneak+${sneakDice}d6`);
    }
    
    // Rage damage for Barbarians
    const barbarianLevel = build.classLevels?.find(cl => cl.class.toLowerCase() === 'barbarian')?.level || 0;
    if (barbarianLevel > 0) {
      let rageDamage = 2; // Base rage damage
      if (barbarianLevel >= 16) rageDamage = 4;
      else if (barbarianLevel >= 9) rageDamage = 3;
      bonus += rageDamage;
      extraDamage.push(`Rage+${rageDamage}`);
    }
    
    // Divine Smite for Paladins (level 1 slot assumption)
    const paladinLevel = build.classLevels?.find(cl => cl.class.toLowerCase() === 'paladin')?.level || 0;
    if (paladinLevel >= 2) {
      extraDamage.push('Smite+2d8');
    }
    
    // Great Weapon Master / Sharpshooter feats
    const weapon = build.equipment?.mainHand;
    if (selectedFeats.includes('great-weapon-master') && weapon && weapon.properties?.some(p => ['heavy', 'two-handed'].includes(p))) {
      extraDamage.push('GWM+10');
    }
    if (selectedFeats.includes('sharpshooter') && weapon && weapon.type === 'ranged') {
      extraDamage.push('SS+10');
    }
    
    return { bonus, extraDamage };
  };

  // Enhanced build analysis function with feature integration
  const analyzeBuildProgression = (build: SimpleBuild): SimpleLevelAnalysis[] => {
    if (!build.classLevels || !build.abilityScores) {
      return [];
    }

    const results: SimpleLevelAnalysis[] = [];
    const selectedFeats = getSelectedFeats(build);
    const fightingStyles = getFightingStyles(build);
    
    for (let level = 1; level <= 20; level++) {
      const proficiencyBonus = Math.ceil(level / 4) + 1;
      
      // Calculate hit points (simplified)
      const hitDie = build.classLevels[0]?.hitDie || 8;
      const conMod = Math.floor((build.abilityScores.constitution - 10) / 2);
      const hitPointsAverage = Math.max(1, (hitDie / 2 + 0.5) + conMod) + (level - 1) * (hitDie / 2 + 0.5 + conMod);
      
      // Calculate attack bonus with fighting style bonuses
      let abilityMod = Math.floor((build.abilityScores.strength - 10) / 2);
      if (build.equipment?.mainHand?.type === 'ranged') {
        abilityMod = Math.floor((build.abilityScores.dexterity - 10) / 2);
      }
      
      let attackBonus = proficiencyBonus + abilityMod + (build.equipment?.mainHand?.magic || 0);
      
      // Apply fighting style bonuses
      if (fightingStyles.includes('archery') && build.equipment?.mainHand?.type === 'ranged') {
        attackBonus += 2;
      }
      
      // Calculate extra attacks based on class levels at this character level
      let extraAttacks = 0;
      if (build.classLevels && build.classLevels.length > 0) {
        // Scale class levels proportionally to character level
        const totalLevels = build.classLevels.reduce((sum, cl) => sum + cl.level, 0);
        const levelRatio = level / totalLevels;
        
        build.classLevels.forEach(classLevel => {
          const scaledLevel = Math.min(20, Math.floor(classLevel.level * levelRatio));
          const className = classLevel.class.toLowerCase();
          
          if (className === 'fighter') {
            if (scaledLevel >= 20) extraAttacks += 3;
            else if (scaledLevel >= 11) extraAttacks += 2;
            else if (scaledLevel >= 5) extraAttacks += 1;
          } else if (['barbarian', 'paladin', 'ranger'].includes(className) && scaledLevel >= 5) {
            extraAttacks += 1;
          }
        });
      }
      
      // Calculate feature-based damage
      const featureDamage = calculateFeatureDamage(build, level);
      
      // Calculate damage with all bonuses
      const baseDamage = build.equipment?.mainHand?.damage || '1d8';
      let damageBonus = abilityMod + featureDamage.bonus;
      
      // Apply fighting style damage bonuses
      if (fightingStyles.includes('dueling') && build.equipment?.mainHand && !build.equipment?.offHand) {
        damageBonus += 2;
      }
      
      let damage = `${baseDamage}+${damageBonus}`;
      if (featureDamage.extraDamage.length > 0) {
        damage += ` (${featureDamage.extraDamage.join(', ')})`;
      }
      if (extraAttacks > 0) {
        damage += ` (×${extraAttacks + 1} attacks)`;
      }
      
      // Enhanced DPR calculation
      const parseDamage = (damageStr: string): number => {
        let totalDamage = 0;
        
        // Base weapon damage
        const match = damageStr.match(/(\d+)d(\d+)(?:\+(\d+))?/);
        if (match) {
          const [, numDice, dieSize, bonus] = match;
          totalDamage = parseInt(numDice) * (parseInt(dieSize) + 1) / 2 + (parseInt(bonus) || 0);
        }
        
        // Add feature damage
        const extraMatch = damageStr.match(/\(([^×]+)\)/);
        if (extraMatch) {
          const extraStr = extraMatch[1];
          
          // Sneak Attack
          const sneakMatch = extraStr.match(/Sneak\+(\d+)d6/);
          if (sneakMatch) totalDamage += parseInt(sneakMatch[1]) * 3.5;
          
          // Rage
          const rageMatch = extraStr.match(/Rage\+(\d+)/);
          if (rageMatch) totalDamage += parseInt(rageMatch[1]);
          
          // Smite
          const smiteMatch = extraStr.match(/Smite\+(\d+)d8/);
          if (smiteMatch) totalDamage += parseInt(smiteMatch[1]) * 4.5;
          
          // Power attacks
          const powerMatch = extraStr.match(/(?:GWM|SS)\+(\d+)/);
          if (powerMatch) totalDamage += parseInt(powerMatch[1]);
        }
        
        return totalDamage;
      };
      
      const avgDamage = parseDamage(damage);
      const totalAttacks = extraAttacks + 1;
      const hitChance = Math.max(0.05, Math.min(0.95, (21 - (15 - attackBonus)) / 20)); // vs AC 15
      
      const normalDPR = avgDamage * totalAttacks * hitChance;
      const advantageDPR = avgDamage * totalAttacks * (1 - Math.pow(1 - hitChance, 2));
      const disadvantageDPR = avgDamage * totalAttacks * Math.pow(hitChance, 2);
      
      // Extract notable features for this level
      const features: string[] = [];
      if (level % 4 === 0) features.push('ASI/Feat');
      if (level === 5 && extraAttacks > 0) features.push('Extra Attack');
      if (level === 11 && build.classLevels?.some(cl => cl.class.toLowerCase() === 'fighter')) features.push('Extra Attack (2)');
      if (rogueLevel > 0 && level % 2 === 1) features.push(`Sneak Attack (${Math.ceil(level/2)}d6)`);
      
      results.push({
        level,
        proficiencyBonus,
        hitPointsAverage,
        attackBonus,
        damage,
        extraAttacks,
        dpr: {
          normal: normalDPR,
          advantage: advantageDPR,
          disadvantage: disadvantageDPR
        },
        features
      });
    }
    
    return results;
  };

  // State
  const [selectedBuilds, setSelectedBuilds] = useState<(string | null)[]>([null, null, null]);
  const [levelAnalyses, setLevelAnalyses] = useState<Record<string, SimpleLevelAnalysis[]>>({});
  const [advantageState, setAdvantageState] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [showPowerAttack, setShowPowerAttack] = useState<boolean>(false);
  const [currentLevel, setCurrentLevel] = useState<number>(20);
  const [showTracePanel, setShowTracePanel] = useState<boolean>(false);
  const [selectedTraceBuild, setSelectedTraceBuild] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate level analyses when builds change
  useEffect(() => {
    const analyses: Record<string, SimpleLevelAnalysis[]> = {};
    
    selectedBuilds.forEach(buildId => {
      if (buildId) {
        const simpleBuild = builds.find(b => b.id === buildId);
        if (simpleBuild) {
          try {
            analyses[buildId] = analyzeBuildProgression(simpleBuild);
          } catch (error) {
            console.error(`Error analyzing build ${simpleBuild.name}:`, error);
            addNotification({
              type: 'error',
              message: `Failed to analyze build "${simpleBuild.name}". Please check build data.`
            });
          }
        }
      }
    });
    
    setLevelAnalyses(analyses);
  }, [selectedBuilds, builds, addNotification]);

  // Draw DPR chart
  useEffect(() => {
    if (canvasRef.current && Object.keys(levelAnalyses).length > 0) {
      drawDPRChart();
    }
  }, [levelAnalyses, advantageState, showPowerAttack]);

  const drawDPRChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Chart dimensions
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Find max DPR for scaling
    let maxDPR = 0;
    Object.values(levelAnalyses).forEach(analysis => {
      analysis.forEach(level => {
        const dpr = level.dpr[advantageState];
        if (dpr > maxDPR) maxDPR = dpr;
      });
    });
    
    if (maxDPR === 0) return;
    
    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (levels)
    for (let level = 1; level <= 20; level += 2) {
      const x = margin.left + (level - 1) * (chartWidth / 19);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }
    
    // Horizontal grid lines (DPR)
    const dprStep = Math.ceil(maxDPR / 5);
    for (let dpr = 0; dpr <= maxDPR; dpr += dprStep) {
      const y = margin.top + chartHeight - (dpr / maxDPR) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }
    
    // Draw DPR lines for each build
    const colors = ['#3b82f6', '#ef4444', '#10b981']; // Blue, Red, Green
    let colorIndex = 0;
    
    Object.entries(levelAnalyses).forEach(([buildId, analysis]) => {
      const build = builds.find(b => b.id === buildId);
      if (!build) return;
      
      const color = colors[colorIndex % colors.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      let firstPoint = true;
      analysis.forEach((level, index) => {
        const x = margin.left + index * (chartWidth / 19);
        const y = margin.top + chartHeight - (level.dpr[advantageState] / maxDPR) * chartHeight;
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw level markers (simplified - every 5th level)
      ctx.fillStyle = color;
      analysis.forEach((level, index) => {
        if (level.level % 5 === 0) {
          const x = margin.left + index * (chartWidth / 19);
          const y = margin.top + chartHeight - (level.dpr[advantageState] / maxDPR) * chartHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
      
      colorIndex++;
    });
    
    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    // X-axis labels (levels)
    for (let level = 1; level <= 20; level += 4) {
      const x = margin.left + (level - 1) * (chartWidth / 19);
      const y = margin.top + chartHeight + 20;
      ctx.fillText(level.toString(), x, y);
    }
    
    // Y-axis labels (DPR)
    ctx.textAlign = 'right';
    for (let dpr = 0; dpr <= maxDPR; dpr += dprStep) {
      const x = margin.left - 10;
      const y = margin.top + chartHeight - (dpr / maxDPR) * chartHeight + 4;
      ctx.fillText(dpr.toString(), x, y);
    }
  };

  const handleBuildSelection = (index: number, buildId: string | null) => {
    const newSelectedBuilds = [...selectedBuilds];
    newSelectedBuilds[index] = buildId;
    setSelectedBuilds(newSelectedBuilds);
  };

  const exportData = () => {
    const data = {
      builds: selectedBuilds.map(buildId => {
        if (!buildId) return null;
        const build = builds.find(b => b.id === buildId);
        return build ? { id: buildId, name: build.name } : null;
      }).filter(Boolean),
      levelAnalyses,
      advantageState,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leveling-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addNotification({
      type: 'success',
      message: 'Level analysis data exported successfully'
    });
  };

  // Calculate DPR against different AC values for sensitivity analysis
  const calculateACAnalysis = (build: SimpleBuild, level: number, levelData: SimpleLevelAnalysis) => {
    const attackBonus = levelData.attackBonus;
    
    const weapon = build.equipment?.mainHand;
    const baseDamage = weapon ? parseDamageString(weapon.damage) : 4.5;
    const abilityMod = Math.floor((Math.max(build.abilityScores?.strength || 10, build.abilityScores?.dexterity || 10) - 10) / 2);
    const totalDamage = (baseDamage + abilityMod) * (levelData.extraAttacks + 1);
    
    const calculateDPRForAC = (targetAC: number) => {
      const hitChance = Math.max(0.05, Math.min(0.95, (21 - (targetAC - attackBonus)) / 20));
      return hitChance * totalDamage;
    };
    
    return {
      ac12: calculateDPRForAC(12),
      ac16: calculateDPRForAC(16),
      ac20: calculateDPRForAC(20)
    };
  };

  // Draw AC sensitivity chart
  const drawACAnalysisChart = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const margin = { top: 10, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // AC range from 10 to 25
    const acRange = Array.from({length: 16}, (_, i) => i + 10);
    
    // Find max DPR for scaling
    let maxDPR = 0;
    const chartData: Array<{buildId: string; buildName: string; data: number[]; color: string}> = [];
    
    selectedBuilds.forEach((buildId, index) => {
      if (!buildId) return;
      const build = builds.find(b => b.id === buildId);
      if (!build || !levelAnalyses[buildId]) return;
      
      const levelData = levelAnalyses[buildId][currentLevel - 1];
      if (!levelData) return;
      
      const colors = ['#3b82f6', '#ef4444', '#10b981'];
      const attackBonus = levelData.attackBonus;
      const weapon = build.equipment?.mainHand;
      const baseDamage = weapon ? parseDamageString(weapon.damage) : 4.5;
      const abilityMod = Math.floor((Math.max(build.abilityScores?.strength || 10, build.abilityScores?.dexterity || 10) - 10) / 2);
      const totalDamage = (baseDamage + abilityMod) * (levelData.extraAttacks + 1);
      
      const dprData = acRange.map(ac => {
        const hitChance = Math.max(0.05, Math.min(0.95, (21 - (ac - attackBonus)) / 20));
        return hitChance * totalDamage;
      });
      
      chartData.push({
        buildId,
        buildName: build.name,
        data: dprData,
        color: colors[index % colors.length]
      });
      
      const buildMaxDPR = Math.max(...dprData);
      if (buildMaxDPR > maxDPR) maxDPR = buildMaxDPR;
    });
    
    if (maxDPR === 0) return;
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (AC values)
    acRange.forEach((ac, index) => {
      if (index % 2 === 0) {
        const x = margin.left + (index / (acRange.length - 1)) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + chartHeight);
        ctx.stroke();
      }
    });
    
    // Draw DPR curves
    chartData.forEach(buildData => {
      ctx.strokeStyle = buildData.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      buildData.data.forEach((dpr, index) => {
        const x = margin.left + (index / (acRange.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - (dpr / maxDPR) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    });
    
    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#374151';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    // X-axis labels (AC)
    [10, 15, 20, 25].forEach(ac => {
      const index = ac - 10;
      const x = margin.left + (index / (acRange.length - 1)) * chartWidth;
      ctx.fillText(`AC${ac}`, x, margin.top + chartHeight + 20);
    });
    
    // Y-axis labels (DPR)
    ctx.textAlign = 'right';
    const dprSteps = [0, Math.round(maxDPR / 2), Math.round(maxDPR)];
    dprSteps.forEach(dpr => {
      const y = margin.top + chartHeight - (dpr / maxDPR) * chartHeight;
      ctx.fillText(dpr.toString(), margin.left - 5, y + 3);
    });
  };

  // Helper functions for calculations
  const getAbilityModifier = (str: number, dex: number): number => {
    const primaryStat = Math.max(str, dex);
    return Math.floor((primaryStat - 10) / 2);
  };

  const parseDamageString = (damage: string): number => {
    if (damage.includes('d8')) return 4.5;
    if (damage.includes('d6')) return 3.5;
    if (damage.includes('d10')) return 5.5;
    if (damage.includes('d12')) return 6.5;
    if (damage.includes('d4')) return 2.5;
    return parseFloat(damage) || 4.5;
  };

  // Generate detailed mathematical trace for DPR calculation
  const generateDPRTrace = (build: SimpleBuild, levelData: SimpleLevelAnalysis) => {
    const trace: Array<{step: string; formula: string; result: string; explanation: string}> = [];
    
    // Step 1: Basic stats
    const proficiencyBonus = levelData.proficiencyBonus;
    const strMod = Math.floor(((build.abilityScores?.strength || 10) - 10) / 2);
    const dexMod = Math.floor(((build.abilityScores?.dexterity || 10) - 10) / 2);
    const primaryMod = Math.max(strMod, dexMod);
    
    trace.push({
      step: "1. Ability Modifiers",
      formula: `STR: ${build.abilityScores?.strength || 10} → ${strMod >= 0 ? '+' : ''}${strMod}, DEX: ${build.abilityScores?.dexterity || 10} → ${dexMod >= 0 ? '+' : ''}${dexMod}`,
      result: `Primary modifier: ${primaryMod >= 0 ? '+' : ''}${primaryMod}`,
      explanation: "Calculate ability modifiers using (score - 10) / 2, rounded down"
    });
    
    // Step 2: Attack bonus
    const attackBonus = proficiencyBonus + primaryMod;
    trace.push({
      step: "2. Attack Bonus",
      formula: `${proficiencyBonus} (prof) + ${primaryMod >= 0 ? '+' : ''}${primaryMod} (ability) = ${attackBonus >= 0 ? '+' : ''}${attackBonus}`,
      result: `Attack bonus: ${attackBonus >= 0 ? '+' : ''}${attackBonus}`,
      explanation: "Attack bonus = Proficiency bonus + Primary ability modifier"
    });
    
    // Step 3: Weapon damage
    const weapon = build.equipment?.mainHand;
    const weaponDamage = weapon ? weapon.damage : '1d8';
    const avgWeaponDamage = parseDamageString(weaponDamage);
    const totalDamage = avgWeaponDamage + primaryMod;
    
    trace.push({
      step: "3. Damage Per Hit",
      formula: `${weaponDamage} (${avgWeaponDamage}) + ${primaryMod >= 0 ? '+' : ''}${primaryMod} (ability)`,
      result: `Average damage: ${totalDamage}`,
      explanation: "Average weapon damage + ability modifier"
    });
    
    // Step 4: Hit chance calculation
    const targetAC = 15;
    const rawHitChance = (21 - (targetAC - attackBonus)) / 20;
    const hitChance = Math.max(0.05, Math.min(0.95, rawHitChance));
    
    trace.push({
      step: "4. Hit Chance vs AC 15",
      formula: `(21 - (${targetAC} - ${attackBonus >= 0 ? '+' : ''}${attackBonus})) / 20 = ${rawHitChance.toFixed(3)}`,
      result: `Hit chance: ${(hitChance * 100).toFixed(1)}% (capped 5%-95%)`,
      explanation: "Hit chance = (21 - (Target AC - Attack bonus)) / 20, capped between 5% and 95%"
    });
    
    // Step 5: Multiple attacks
    const attacks = levelData.extraAttacks + 1;
    trace.push({
      step: "5. Multiple Attacks",
      formula: `${attacks} attack${attacks > 1 ? 's' : ''} per action`,
      result: `Attacks per round: ${attacks}`,
      explanation: attacks > 1 ? "Extra Attack feature provides additional attacks" : "Single attack per action"
    });
    
    // Step 6: Basic DPR
    const basicDPR = hitChance * totalDamage * attacks;
    trace.push({
      step: "6. Basic Weapon DPR",
      formula: `${(hitChance * 100).toFixed(1)}% × ${totalDamage} × ${attacks}`,
      result: `Weapon DPR: ${basicDPR.toFixed(2)}`,
      explanation: "Base DPR = Hit chance × Damage per hit × Attacks per round"
    });
    
    // Step 7: Advantage states
    const advHitChance = 1 - Math.pow(1 - hitChance, 2);
    const disadvHitChance = Math.pow(hitChance, 2);
    
    trace.push({
      step: "7. Advantage States",
      formula: `Normal: ${(hitChance * 100).toFixed(1)}%, Advantage: ${(advHitChance * 100).toFixed(1)}%, Disadvantage: ${(disadvHitChance * 100).toFixed(1)}%`,
      result: `Advantage DPR: ${(advHitChance * totalDamage * attacks).toFixed(2)}`,
      explanation: "Advantage = 1-(1-p)², Disadvantage = p²"
    });
    
    // Step 8: Off-turn actions (simplified)
    const opportunityDPR = hitChance * totalDamage * 0.3; // 30% chance
    trace.push({
      step: "8. Opportunity Attacks",
      formula: `${(hitChance * 100).toFixed(1)}% × ${totalDamage} × 30% chance`,
      result: `Opportunity DPR: ${opportunityDPR.toFixed(2)}`,
      explanation: "Estimated 30% chance per round for opportunity attack"
    });
    
    // Step 9: Total DPR
    const finalDPR = basicDPR + opportunityDPR;
    trace.push({
      step: "9. Total DPR",
      formula: `${basicDPR.toFixed(2)} (weapon) + ${opportunityDPR.toFixed(2)} (opportunity)`,
      result: `Total DPR: ${finalDPR.toFixed(2)}`,
      explanation: "Sum of all damage sources per round"
    });
    
    return trace;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leveling DPR Explorer</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Visualize how your builds perform from level 1-20 with feature breakpoints
        </p>
      </div>

      {/* Build Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Builds to Compare
          </h3>
          <button
            onClick={exportData}
            disabled={Object.keys(levelAnalyses).length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Data
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(index => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Build {String.fromCharCode(65 + index)} {/* A, B, C */}
              </label>
              <select
                value={selectedBuilds[index] || ''}
                onChange={(e) => handleBuildSelection(index, e.target.value || null)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">No build selected</option>
                {builds.map((build) => (
                  <option key={build.id} value={build.id}>
                    {build.name} (Lv.{build.level})
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* DPR Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            DPR Progression (Levels 1-20)
          </h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Level: {currentLevel}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={currentLevel}
              onChange={(e) => setCurrentLevel(parseInt(e.target.value))}
              className="w-32"
            />
          </div>
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-96 border border-gray-200 dark:border-gray-600 rounded"
          />
          
          {/* Legend */}
          {Object.keys(levelAnalyses).length > 0 && (
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-700 p-2 rounded shadow">
              {selectedBuilds.map((buildId, index) => {
                if (!buildId) return null;
                const build = builds.find(b => b.id === buildId);
                if (!build) return null;
                
                const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500'];
                return (
                  <div key={buildId} className="flex items-center space-x-2 text-xs">
                    <div className={`w-3 h-3 rounded ${colors[index]}`}></div>
                    <span className="text-gray-900 dark:text-white">{build.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feature Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Feature Breakpoints - Level {currentLevel}
        </h3>
        
        {Object.keys(levelAnalyses).length > 0 ? (
          <div className="space-y-4">
            {selectedBuilds.map((buildId, index) => {
              if (!buildId) return null;
              const build = builds.find(b => b.id === buildId);
              if (!build || !levelAnalyses[buildId]) return null;
              
              const levelData = levelAnalyses[buildId][currentLevel - 1];
              if (!levelData) return null;
              
              return (
                <div key={buildId} className="border border-gray-200 dark:border-gray-600 rounded p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{build.name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">DPR:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {levelData.dpr[advantageState].toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">HP:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {Math.round(levelData.hitPointsAverage)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Attacks:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {levelData.extraAttacks + 1}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Prof Bonus:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        +{levelData.proficiencyBonus}
                      </span>
                    </div>
                  </div>
                  
                  {levelData.features.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Features gained:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {levelData.features.map((feature, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Select builds above to see feature breakpoints
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Advantage States
          </h3>
          <div className="space-y-3">
            {(['normal', 'advantage', 'disadvantage'] as const).map((state) => (
              <label key={state} className="flex items-center">
                <input
                  type="radio"
                  name="advantage-state"
                  value={state}
                  checked={advantageState === state}
                  onChange={(e) => setAdvantageState(e.target.value as any)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 capitalize text-gray-700 dark:text-gray-300">
                  {state}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Power Attack Analysis
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showPowerAttack}
                onChange={(e) => setShowPowerAttack(e.target.checked)}
                className="form-checkbox text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Show Sharpshooter/GWM Break-even
              </span>
            </label>
            
            {showPowerAttack && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
                Power attack analysis will be overlaid on the DPR chart showing optimal usage thresholds.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AC Sensitivity Analysis */}
      {Object.keys(levelAnalyses).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AC Sensitivity Analysis - Level {currentLevel}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AC Range Chart */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                DPR vs Armor Class
              </h4>
              <canvas
                ref={(canvas) => {
                  if (canvas) drawACAnalysisChart(canvas);
                }}
                className="w-full h-48 border border-gray-200 dark:border-gray-600 rounded"
              />
            </div>
            
            {/* AC Breakpoints Table */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Optimal AC Thresholds
              </h4>
              <div className="overflow-y-auto max-h-48">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Build
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        vs AC 12
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        vs AC 16
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        vs AC 20
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {selectedBuilds.map((buildId, index) => {
                      if (!buildId) return null;
                      const build = builds.find(b => b.id === buildId);
                      if (!build || !levelAnalyses[buildId]) return null;
                      
                      const levelData = levelAnalyses[buildId][currentLevel - 1];
                      if (!levelData) return null;
                      
                      const acAnalysis = calculateACAnalysis(build, currentLevel, levelData);
                      
                      return (
                        <tr key={buildId} className="bg-white dark:bg-gray-800">
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                            {build.name}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-white">
                            {acAnalysis.ac12.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-white">
                            {acAnalysis.ac16.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-white">
                            {acAnalysis.ac20.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Math Trace Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            DPR Calculation Breakdown
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedTraceBuild || ''}
              onChange={(e) => setSelectedTraceBuild(e.target.value || null)}
              className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select build for trace...</option>
              {selectedBuilds.map((buildId, index) => {
                if (!buildId) return null;
                const build = builds.find(b => b.id === buildId);
                if (!build) return null;
                return (
                  <option key={buildId} value={buildId}>
                    {build.name} (Build {String.fromCharCode(65 + index)})
                  </option>
                );
              })}
            </select>
            <button
              onClick={() => setShowTracePanel(!showTracePanel)}
              className="px-3 py-1 text-sm bg-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-300"
            >
              {showTracePanel ? 'Hide' : 'Show'} Trace
            </button>
          </div>
        </div>

        {showTracePanel && selectedTraceBuild && (
          <div className="space-y-4">
            {(() => {
              const build = builds.find(b => b.id === selectedTraceBuild);
              if (!build || !levelAnalyses[selectedTraceBuild]) {
                return (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No analysis data available for selected build
                  </div>
                );
              }
              
              const levelData = levelAnalyses[selectedTraceBuild][currentLevel - 1];
              if (!levelData) {
                return (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No data available for level {currentLevel}
                  </div>
                );
              }
              
              const trace = generateDPRTrace(build, levelData);
              
              return (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Step-by-step DPR calculation for <span className="font-medium text-gray-900 dark:text-white">{build.name}</span> at level {currentLevel}:
                  </div>
                  
                  {trace.map((step, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                            {step.step}
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {step.explanation}
                          </p>
                        </div>
                        <div>
                          <div className="text-sm font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            {step.formula}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            {step.result}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                      📊 Mathematical Summary
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <div>• This breakdown shows the core weapon-based DPR calculation</div>
                      <div>• Spell damage, class features, and situational bonuses add to this base</div>
                      <div>• The 5%-95% hit chance cap ensures realistic combat scenarios</div>
                      <div>• Advantage/disadvantage calculations use standard D&D probability formulas</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {!showTracePanel && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🧮</div>
            <div className="text-sm">Select a build and click "Show Trace" to see detailed mathematical calculations</div>
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { useSimpleStore } from '../../store/simpleStore';
import { Build } from '../../types/build';

interface ComparisonMetrics {
  defense: number;
  control: number;
  mobility: number;
  utility: number;
  resourceEconomy: number;
  skills: number;
}

export const CharacterCompare: React.FC = () => {
  const builds = useSimpleStore((state) => state.builds);
  const { addNotification } = useSimpleStore();
  
  const [selectedBuilds, setSelectedBuilds] = useState<(string | null)[]>([null, null, null]);
  const [categoryWeights, setCategoryWeights] = useState({
    defense: 1.0,
    control: 1.0,
    mobility: 1.0,
    utility: 1.0,
    resourceEconomy: 1.0,
    skills: 1.0,
  });
  const [showFeatureDiff, setShowFeatureDiff] = useState(false);
  const [diffFilter, setDiffFilter] = useState<'all' | 'concentration' | 'reactions' | 'spells' | 'features'>('all');
  
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate comparison metrics for a build
  const calculateBuildMetrics = (build: Build): ComparisonMetrics => {
    const totalLevel = build.levels.reduce((sum, level) => sum + level.level, 0);
    
    // Defense calculation
    const baseAC = build.equipment.armor?.ac || 10;
    const dexMod = Math.floor((build.abilities.dexterity - 10) / 2);
    const estimatedAC = baseAC + (build.equipment.armor?.type === 'light' ? dexMod : 
                                build.equipment.armor?.type === 'medium' ? Math.min(2, dexMod) : 0);
    const avgHP = totalLevel * 8 + Math.floor((build.abilities.constitution - 10) / 2) * totalLevel;
    const defense = Math.min(1.0, (estimatedAC - 10) / 12 + (avgHP - 50) / 150);

    // Control calculation (based on spell save DC and control spells)
    const spellcastingMod = Math.max(
      Math.floor((build.abilities.wisdom - 10) / 2),
      Math.floor((build.abilities.intelligence - 10) / 2),
      Math.floor((build.abilities.charisma - 10) / 2)
    );
    const spellSaveDC = 8 + build.proficiencyBonus + spellcastingMod;
    const controlSpells = build.spells.filter(spell => 
      ['hold person', 'entangle', 'web', 'hypnotic pattern', 'banishment'].includes(spell.toLowerCase())
    );
    const control = Math.min(1.0, (spellSaveDC - 10) / 12 + controlSpells.length / 10);

    // Mobility calculation
    const baseSpeed = 30; // Assume human base speed
    const hasFlightSpells = build.spells.some(spell => 
      ['fly', 'misty step', 'dimension door'].includes(spell.toLowerCase())
    );
    const mobility = Math.min(1.0, (baseSpeed - 20) / 30 + (hasFlightSpells ? 0.3 : 0));

    // Utility calculation (ritual spells, skills, tools)
    const ritualSpells = build.spells.filter(spell => 
      ['detect magic', 'identify', 'comprehend languages'].includes(spell.toLowerCase())
    );
    const utility = Math.min(1.0, ritualSpells.length / 8 + build.features.length / 20);

    // Resource economy (spell slots, short rest features)
    const totalSlots = Object.values(build.spellSlots).reduce((sum, slots) => sum + slots, 0);
    const resourceEconomy = Math.min(1.0, totalSlots / 15);

    // Skills calculation
    const skillCount = build.proficiencies.skills?.length || 0;
    const skills = Math.min(1.0, skillCount / 8);

    return {
      defense,
      control,
      mobility,
      utility,
      resourceEconomy,
      skills,
    };
  };

  // Draw radar chart
  const drawRadarChart = () => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high DPI displays
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    
    const categories = ['Defense', 'Control', 'Mobility', 'Utility', 'Resources', 'Skills'];
    const angleStep = (2 * Math.PI) / categories.length;

    // Draw grid circles
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw axes and labels
    ctx.strokeStyle = '#9ca3af';
    ctx.fillStyle = '#374151';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';

    categories.forEach((category, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw label
      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      ctx.fillText(category, labelX, labelY);
    });

    // Draw build comparison data
    const colors = ['#3b82f6', '#ef4444', '#10b981']; // Blue, Red, Green
    const buildData = selectedBuilds
      .map(buildId => buildId ? builds.find(b => b.id === buildId) : null)
      .filter(build => build !== null) as Build[];

    buildData.forEach((build, buildIndex) => {
      const metrics = calculateBuildMetrics(build);
      const values = [
        metrics.defense * categoryWeights.defense,
        metrics.control * categoryWeights.control,
        metrics.mobility * categoryWeights.mobility,
        metrics.utility * categoryWeights.utility,
        metrics.resourceEconomy * categoryWeights.resourceEconomy,
        metrics.skills * categoryWeights.skills,
      ];

      ctx.strokeStyle = colors[buildIndex];
      ctx.fillStyle = colors[buildIndex] + '20'; // 20% opacity
      ctx.lineWidth = 2;

      // Draw filled area
      ctx.beginPath();
      values.forEach((value, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const distance = Math.min(value, 1) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw data points
      ctx.fillStyle = colors[buildIndex];
      values.forEach((value, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const distance = Math.min(value, 1) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };

  // Update radar chart when data changes
  useEffect(() => {
    if (radarCanvasRef.current && selectedBuilds.some(id => id !== null)) {
      drawRadarChart();
    }
  }, [selectedBuilds, categoryWeights, builds]);

  const handleBuildSelection = (index: number, buildId: string) => {
    const newSelection = [...selectedBuilds];
    newSelection[index] = buildId || null;
    setSelectedBuilds(newSelection);
  };

  const handleWeightChange = (category: keyof typeof categoryWeights, weight: number) => {
    setCategoryWeights(prev => ({ ...prev, [category]: weight }));
  };

  const getSelectedBuilds = (): Build[] => {
    return selectedBuilds
      .map(buildId => buildId ? builds.find(b => b.id === buildId) : null)
      .filter(build => build !== null) as Build[];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Character Compare</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Multi-dimensional character analysis with weighted category scoring
        </p>
      </div>

      {/* Build Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Builds to Compare
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Build {String.fromCharCode(65 + index)}
              </label>
              <select
                value={selectedBuilds[index] || ''}
                onChange={(e) => handleBuildSelection(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">No build selected</option>
                {builds.map((build) => (
                  <option key={build.id} value={build.id}>
                    {build.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Category Weights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Category Weights
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(categoryWeights).map(([category, weight]) => (
            <div key={category} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ({weight.toFixed(1)}x)
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={weight}
                onChange={(e) => handleWeightChange(category as keyof typeof categoryWeights, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Radar Chart Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Multi-Dimensional Comparison
        </h3>
        
        {getSelectedBuilds().length > 0 ? (
          <>
            <div className="flex justify-center">
              <canvas
                ref={radarCanvasRef}
                width={400}
                height={400}
                className="max-w-full"
                style={{ width: '400px', height: '400px' }}
              />
            </div>
            
            {/* Legend */}
            <div className="flex justify-center mt-4 space-x-6">
              {getSelectedBuilds().map((build, index) => {
                const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500'];
                return (
                  <div key={build.id} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded ${colors[index]}`}></div>
                    <span className="text-gray-900 dark:text-white">{build.name}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-sm">Select builds above to see radar chart comparison</div>
          </div>
        )}
      </div>

      {/* Feature & Spell Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Features & Spells Comparison
          </h3>
          <button
            onClick={() => setShowFeatureDiff(!showFeatureDiff)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showFeatureDiff ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        {showFeatureDiff && getSelectedBuilds().length > 0 ? (
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="flex space-x-4">
              <select
                value={diffFilter}
                onChange={(e) => setDiffFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Features</option>
                <option value="concentration">Concentration Spells</option>
                <option value="reactions">Reaction Features</option>
                <option value="spells">Spells Only</option>
                <option value="features">Class Features Only</option>
              </select>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Feature/Spell
                    </th>
                    {getSelectedBuilds().map((build) => (
                      <th key={build.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {build.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Features comparison */}
                  {(() => {
                    const allFeatures = new Set<string>();
                    getSelectedBuilds().forEach(build => {
                      if (diffFilter === 'all' || diffFilter === 'features') {
                        build.features.forEach(feature => allFeatures.add(feature));
                      }
                      if (diffFilter === 'all' || diffFilter === 'spells') {
                        build.spells.forEach(spell => allFeatures.add(spell));
                      }
                    });

                    if (allFeatures.size === 0) {
                      return (
                        <tr>
                          <td colSpan={getSelectedBuilds().length + 1} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            No features or spells found for the selected filter
                          </td>
                        </tr>
                      );
                    }

                    return Array.from(allFeatures).map(feature => (
                      <tr key={feature}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {feature}
                        </td>
                        {getSelectedBuilds().map((build) => (
                          <td key={build.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {(build.features.includes(feature) || build.spells.includes(feature)) ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                ✗
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        ) : !showFeatureDiff ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-sm">Click "Show Details" to compare features and spells</div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-sm">Select builds to compare features and spells</div>
          </div>
        )}
      </div>

      {/* Resource Economy Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resource Economy Timeline
        </h3>
        
        {getSelectedBuilds().length > 0 ? (
          <div className="space-y-4">
            {/* Resource comparison by level */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Build
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Spell Slots
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Highest Slot Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Short Rest Features
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {getSelectedBuilds().map((build) => {
                    const totalSlots = Object.values(build.spellSlots).reduce((sum, slots) => sum + slots, 0);
                    const highestSlot = Math.max(...Object.keys(build.spellSlots).map(Number));
                    const shortRestFeatures = build.features.filter(feature => 
                      feature.toLowerCase().includes('short rest') || 
                      feature.toLowerCase().includes('superiority') ||
                      feature.toLowerCase().includes('ki') ||
                      feature.toLowerCase().includes('warlock')
                    );

                    return (
                      <tr key={build.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {build.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {totalSlots}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {highestSlot > 0 ? `Level ${highestSlot}` : 'None'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {shortRestFeatures.length > 0 ? shortRestFeatures.join(', ') : 'None'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">⏱️</div>
            <div className="text-sm">Select builds to analyze resource economy</div>
          </div>
        )}
      </div>
    </div>
  );
};
/**
 * Inline Class Features Component
 * Shows class features directly within the class selection boxes
 */

import React from 'react';
import type { ClassLevel } from '../../types/build';
import { getClassFeatures } from '../../data/classFeatures';
import type { FeatureSelection } from './ClassFeatureDisplay';

interface InlineClassFeaturesProps {
  classLevel: ClassLevel;
  selections: { [featureId: string]: FeatureSelection };
  onSelectionChange: (featureId: string, selection: FeatureSelection) => void;
}

export const InlineClassFeatures: React.FC<InlineClassFeaturesProps> = ({
  classLevel,
  selections,
  onSelectionChange,
}) => {
  const features = getClassFeatures(classLevel.class, classLevel.level, classLevel.subclass);

  if (features.length === 0) {
    return null;
  }

  const featuresRequiringChoices = features.filter(f => f.type === 'choice' || f.type === 'improvement');
  const automaticFeatures = features.filter(f => f.type === 'automatic');

  const handleFeatureSelection = (featureId: string, choiceId: string) => {
    const existingSelection = selections[featureId] || { featureId, selections: [], improvements: {} };
    const newSelection = {
      ...existingSelection,
      selections: [choiceId] // Simple single selection for inline display
    };
    onSelectionChange(featureId, newSelection);
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Automatic Features */}
      {automaticFeatures.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Features Gained:
          </h5>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {automaticFeatures.map((feature) => (
              <div key={feature.id} className="flex items-start">
                <span className="font-medium mr-1">Level {feature.level}:</span>
                <span>{feature.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Requiring Choices */}
      {featuresRequiringChoices.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Choices Required:
          </h5>
          <div className="space-y-2">
            {featuresRequiringChoices.map((feature) => {
              const currentSelection = selections[feature.id];
              const hasSelection = currentSelection && currentSelection.selections.length > 0;

              return (
                <div key={feature.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Level {feature.level}: {feature.name}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      hasSelection 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {hasSelection ? '✓' : '!'}
                    </span>
                  </div>
                  
                  {feature.type === 'choice' && feature.choices && (
                    <select
                      value={currentSelection?.selections[0] || ''}
                      onChange={(e) => handleFeatureSelection(feature.id, e.target.value)}
                      className="w-full text-xs rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Choose {feature.name}...</option>
                      {feature.choices.map((choice) => (
                        <option key={choice.id} value={choice.id}>
                          {choice.name}
                          {choice.shortDescription && ` - ${choice.shortDescription}`}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {feature.type === 'improvement' && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Choose ability score improvement or feat
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
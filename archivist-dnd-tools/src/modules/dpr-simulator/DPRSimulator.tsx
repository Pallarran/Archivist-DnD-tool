import React from 'react';

export const DPRSimulator: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DPR Simulator</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Compare up to 3 character builds side-by-side with detailed damage analysis
        </p>
      </div>

      {/* Placeholder for 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((buildIndex) => (
          <div
            key={buildIndex}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Build {buildIndex}
              </h3>
              <div className="space-y-4">
                <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">Build Configuration</span>
                </div>
                <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">Policy Settings</span>
                </div>
                <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">Results Display</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shared Target Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Target Configuration
        </h3>
        <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400">AC, Saves, Resistances, Traits</span>
        </div>
      </div>
    </div>
  );
};
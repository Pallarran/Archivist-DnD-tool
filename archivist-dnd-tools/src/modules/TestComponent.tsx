/**
 * Simple test component to verify React app is working
 */

import React from 'react';

export const TestComponent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Archivist D&D Tools - Test Mode</h1>
          <p className="text-gray-600">Basic functionality test</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">App Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>React is working</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Tailwind CSS is working</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>TypeScript is working</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-800">Next Steps</h3>
            <p className="mt-1 text-sm text-blue-700">
              If you can see this page, the basic React app is working. 
              The issue was likely with the complex Zustand store setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
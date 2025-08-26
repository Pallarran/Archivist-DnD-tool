/**
 * Absolute minimal React app for debugging
 */

import React from 'react';

function MinimalApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎲 Archivist D&D Tools</h1>
      <p>✅ React is working!</p>
      <p>✅ JavaScript is loading!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <strong>Debug Info:</strong>
        <ul>
          <li>Location: {window.location.href}</li>
          <li>Base URL: {window.location.origin}</li>
          <li>Path: {window.location.pathname}</li>
        </ul>
      </div>
    </div>
  );
}

export default MinimalApp;
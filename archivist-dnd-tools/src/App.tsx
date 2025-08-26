import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { EnhancedDPRSimulator } from './modules/EnhancedDPRSimulator';
import { SimpleBuildLab } from './modules/SimpleBuildLab';
import { LevelingExplorer } from './modules/leveling-explorer/LevelingExplorer';
import { CharacterCompare } from './modules/character-compare/CharacterCompare';

function App() {
  return (
    <Router basename="/Archivist-DnD-tool">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dpr-simulator" replace />} />
          <Route path="/dpr-simulator" element={<EnhancedDPRSimulator />} />
          <Route path="/build-lab" element={<SimpleBuildLab />} />
          <Route path="/leveling-explorer" element={<LevelingExplorer />} />
          <Route path="/character-compare" element={<CharacterCompare />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

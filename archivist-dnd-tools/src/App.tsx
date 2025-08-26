import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SimpleDPRSimulator } from './modules/SimpleDPRSimulator';
// import { LevelingExplorer } from './modules/leveling-explorer/LevelingExplorer';
// import { CharacterCompare } from './modules/character-compare/CharacterCompare';
import { BuildLab } from './modules/build-lab/BuildLab';
// import { Library } from './modules/library/Library';

function App() {
  return (
    <Router basename="/Archivist-DnD-tool">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dpr-simulator" replace />} />
          <Route path="/dpr-simulator" element={<SimpleDPRSimulator />} />
          {/* <Route path="/leveling-explorer" element={<LevelingExplorer />} />
          <Route path="/character-compare" element={<CharacterCompare />} /> */}
          <Route path="/build-lab" element={<BuildLab />} />
          {/* <Route path="/library" element={<Library />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

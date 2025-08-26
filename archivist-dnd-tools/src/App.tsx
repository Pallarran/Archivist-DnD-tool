import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TestComponent } from './modules/TestComponent';
// Temporarily commenting out complex components to test basic functionality
// import { SimpleDPRSimulator } from './modules/SimpleDPRSimulator';
// import { BuildLab } from './modules/build-lab/BuildLab';

function App() {
  return (
    <Router basename="/Archivist-DnD-tool">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/test" replace />} />
          <Route path="/test" element={<TestComponent />} />
          {/* Temporarily disabled complex routes
          <Route path="/dpr-simulator" element={<SimpleDPRSimulator />} />
          <Route path="/build-lab" element={<BuildLab />} />
          */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

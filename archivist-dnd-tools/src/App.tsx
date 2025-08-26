import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BasicDPRSimulator } from './modules/BasicDPRSimulator';
import { BuildLab } from './modules/build-lab/BuildLab';

function App() {
  return (
    <Router basename="/Archivist-DnD-tool">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dpr-simulator" replace />} />
          <Route path="/dpr-simulator" element={<BasicDPRSimulator />} />
          <Route path="/build-lab" element={<BuildLab />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

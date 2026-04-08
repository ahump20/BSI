import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import ProjectBSI from './pages/ProjectBSI';
import ProjectSluggers from './pages/ProjectSluggers';
import ProjectBlazeCraft from './pages/ProjectBlazeCraft';

function App() {
  return (
    <div className="min-h-screen bg-midnight text-bone">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/projects/bsi" element={<ProjectBSI />} />
        <Route path="/projects/sluggers" element={<ProjectSluggers />} />
        <Route path="/projects/blazecraft" element={<ProjectBlazeCraft />} />
      </Routes>
    </div>
  );
}

export default App;

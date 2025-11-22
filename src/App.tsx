import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { ProjectManager } from './components/ProjectManager';
import { AutoSave } from './components/AutoSave';
import { useDiagramStore } from './core/store';
import './App.css';

function App() {
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const { currentProjectName } = useDiagramStore();

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Swimlane Diagrammer</h1>
        {currentProjectName && (
          <div className="current-project">
            プロジェクト: <strong>{currentProjectName}</strong>
          </div>
        )}
        <button
          className="project-manager-btn"
          onClick={() => setIsProjectManagerOpen(true)}
          title="プロジェクト管理"
        >
          <FolderOpen size={20} />
          プロジェクト
        </button>
      </div>
      <div className="app-body">
        <Toolbar />
        <div className="app-content">
          <Canvas />
        </div>
        <Sidebar />
      </div>

      <ProjectManager
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
      />
      <AutoSave />
    </div>
  );
}

export default App;

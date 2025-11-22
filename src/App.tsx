import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { AutoSave } from './components/AutoSave';
import { useDiagramStore } from './core/store';
import './App.css';

function App() {
  const { propertiesPanelVisible } = useDiagramStore();

  return (
    <div className="app">
      <Toolbar />
      <div className="app-main">
        <Sidebar />
        <Canvas />
        {propertiesPanelVisible && <PropertiesPanel />}
      </div>
      <AutoSave />
    </div>
  );
}

export default App;

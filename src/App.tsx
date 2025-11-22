import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { AutoSave } from './components/AutoSave';
import './App.css';

function App() {
  return (
    <div className="app">
      <Toolbar />
      <div className="app-main">
        <Sidebar />
        <Canvas />
      </div>
      <AutoSave />
    </div>
  );
}

export default App;

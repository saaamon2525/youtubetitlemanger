import React from 'react';
import Layout from './components/Layout';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import SettingsModal from './components/features/SettingsModal';
import Button from './components/ui/Button';
import { Settings } from 'lucide-react';
import ResearchPane from './components/features/ResearchPane';
import AnalysisPane from './components/features/AnalysisPane';
import Workspace from './components/features/Workspace';
import './styles/variables.css';

const Header = () => {
  const { openSettings } = useSettings();
  return (
    <div style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>SAMON-CORE</h1>
      <Button variant="ghost" onClick={openSettings}>
        <Settings size={20} />
      </Button>
    </div>
  );
};

function AppContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Layout
          left={<ResearchPane />}
          center={<AnalysisPane />}
          right={<Workspace />}
        />
      </div>
      <SettingsModal />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;

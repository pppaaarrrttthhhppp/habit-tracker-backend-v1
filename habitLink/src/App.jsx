import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'Home' ? (
          <Dashboard />
        ) : (
          <div className="placeholder-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '24px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {activeTab} Page Content Coming Soon...
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

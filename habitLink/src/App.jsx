import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MyHabits from './pages/MyHabits';
import NetworkGraphPage from './pages/NetworkGraphPage';
import PairingRecommendations from './pages/PairingRecommendations';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import './App.css';

const PAGES = {
  'Home': Dashboard,
  'My Habits': MyHabits,
  'Network Graph': NetworkGraphPage,
  'Pairing Recommendations': PairingRecommendations,
  'Profile': Profile,
  'Notifications': Notifications,
};

function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const ActivePage = PAGES[activeTab] || Dashboard;
  const [sidebarStats, setSidebarStats] = useState({
    habitsBadge: '0/0',
    notificationsCount: 0,
  });

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        habitsBadge={sidebarStats.habitsBadge}
        notificationsCount={sidebarStats.notificationsCount}
      />
      <main className="main-content">
        <ActivePage onNavigate={setActiveTab} />
      </main>
    </div>
  );
}

export default App;


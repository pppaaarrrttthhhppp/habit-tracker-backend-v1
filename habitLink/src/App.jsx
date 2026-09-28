import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MyHabits from './pages/MyHabits';
import NetworkGraphPage from './pages/NetworkGraphPage';
import PairingRecommendations from './pages/PairingRecommendations';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import { ToastProvider } from './components/Toast';
import { getHabits, getTodayCheckIns } from './api';
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

  const refreshSidebarStats = useCallback(async () => {
    try {
      const [habits, today] = await Promise.all([getHabits(), getTodayCheckIns()]);
      const total = Array.isArray(habits) ? habits.length : 0;
      const completed = Array.isArray(today?.habit_ids)
        ? today.habit_ids.length
        : Number(today?.completed || 0);
      const remaining = Math.max(0, total - completed);
      setSidebarStats({
        habitsBadge: `${completed}/${total}`,
        notificationsCount: remaining > 0 ? remaining : 0,
      });
    } catch {
      // Keep last known badge stats if backend is temporarily unreachable
    }
  }, []);

  useEffect(() => {
    refreshSidebarStats();
  }, [refreshSidebarStats, activeTab]);

  return (
    <ToastProvider>
      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          habitsBadge={sidebarStats.habitsBadge}
          notificationsCount={sidebarStats.notificationsCount}
        />
        <main className="main-content" id="main-content" tabIndex={-1}>
          <ActivePage onNavigate={setActiveTab} onStatsChange={refreshSidebarStats} />
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;

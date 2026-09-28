import React from 'react';
import { Home, CheckCircle2, Share2, Sparkles, User, Bell, Share } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab, habitsBadge = '0/0', notificationsCount = 0 }) => {
  const navItems = [
    { name: 'Home', icon: Home },
    { name: 'My Habits', icon: CheckCircle2, badge: habitsBadge },
    { name: 'Network Graph', icon: Share2 },
    { name: 'Pairing Recommendations', icon: Sparkles, badge: 'NEW', badgeClass: 'new' },
    { name: 'Profile', icon: User },
    {
      name: 'Notifications',
      icon: Bell,
      badge: notificationsCount > 0 ? String(notificationsCount) : undefined,
      badgeClass: 'notification',
    },
  ];

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="logo-icon" aria-hidden="true">
          <Share size={20} color="#4f46e5" />
        </div>
        <div className="logo-text">
          <h2>HabitLink</h2>
          <p>Better Habits. Together.</p>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary pages">
        <ul>
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            const IconComponent = item.icon;
            return (
              <li key={item.name}>
                <button
                  type="button"
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.name)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <IconComponent size={18} aria-hidden="true" />
                  <span className="sidebar-nav-label">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`badge ${item.badgeClass || ''}`}
                      aria-label={`${item.name} badge: ${item.badge}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="contagion-card">
          <div className="contagion-header">
            <Sparkles size={16} className="text-yellow" aria-hidden="true" />
            <h4>Contagion Effect</h4>
          </div>
          <p>"Small habits create big changes when shared in a network."</p>
          <div className="contagion-badge">Group Boost: +42% Consistency</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

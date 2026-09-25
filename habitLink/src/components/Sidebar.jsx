import React, { useState } from 'react';
import { Home, CheckCircle2, Share2, Sparkles, User, Bell, Share } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {


  const navItems = [
    { name: 'Home', icon: Home },
    { name: 'My Habits', icon: CheckCircle2, badge: '1/4' },
    { name: 'Network Graph', icon: Share2 },
    { name: 'Pairing Recommendations', icon: Sparkles, badge: 'NEW', badgeClass: 'new' },
    { name: 'Profile', icon: User },
    { name: 'Notifications', icon: Bell, badge: '3', badgeClass: 'notification' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <Share size={20} color="#000" />
        </div>
        <div className="logo-text">
          <h2>HabitLink</h2>
          <p>Better Habits. Together.</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map(item => (
            <li 
              key={item.name} 
              className={activeTab === item.name ? 'active' : ''}
              onClick={() => setActiveTab(item.name)}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
              {item.badge && <span className={`badge ${item.badgeClass || ''}`}>{item.badge}</span>}
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="contagion-card">
          <div className="contagion-header">
            <Sparkles size={16} className="text-yellow" />
            <h4>Contagion Effect</h4>
          </div>
          <p>"Small habits create big changes when shared in a network."</p>
          <div className="contagion-badge">
            Group Boost: +42% Consistency
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

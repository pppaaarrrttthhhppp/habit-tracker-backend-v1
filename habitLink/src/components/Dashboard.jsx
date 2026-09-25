import React, { useState } from 'react';
import { CheckCircle, Users, Flame, Award, ChevronDown, ZoomIn, ZoomOut, RotateCcw, Sparkles, ArrowRight, Brain, Activity, Clock, Plus } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [isSyncing, setIsSyncing] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ marginBottom: '32px' }}>
        <div className="greeting">
          <h1>Good evening, Pallavi!</h1>
          <p>Your habits are more powerful when shared. Let's build a healthier you, together.</p>
        </div>
        <div className="header-actions">
          <div className="icon-wrapper" style={{ width: '40px', height: '40px', background: 'var(--bg-glass)', borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--border-glass)' }}>
            <span style={{ position: 'relative' }}>
              🔔
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: 'red', borderRadius: '50%' }}></span>
            </span>
          </div>
          <div className="user-profile" style={{ background: 'var(--bg-glass)', padding: '6px 16px 6px 6px', borderRadius: '30px', border: '1px solid var(--border-glass)', cursor: 'pointer' }}>
            <img src="https://ui-avatars.com/api/?name=Pallavi&background=c7d2fe&color=3730a3" alt="Pallavi" className="avatar" style={{ width: '32px', height: '32px', border: 'none' }} />
            <div className="user-info">
              <span className="user-name" style={{ fontSize: '13px' }}>Pallavi</span>
            </div>
            <ChevronDown size={14} style={{ marginLeft: '8px', color: 'var(--text-secondary)' }} />
          </div>
        </div>
      </header>

      {/* Top Stats Grid */}
      <section className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-header">
            <h3>Today's Check-ins</h3>
            <div className="icon-wrapper success">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value">3/5</div>
          <div className="stat-footer success-text">
            ↗ Keep going!
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-header">
            <h3>Total Friends</h3>
            <div className="icon-wrapper blue">
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">12</div>
          <div className="stat-footer text-muted">
            More connections, more impact!
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-header">
            <h3>Active Habits</h3>
            <div className="icon-wrapper purple">
              <Flame size={20} />
            </div>
          </div>
          <div className="stat-value">4</div>
          <div className="stat-footer success-text">
            ↑ +1 from last week
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-header">
            <h3>Top Influence</h3>
            <div className="icon-wrapper orange">
              <Award size={20} />
            </div>
          </div>
          <div className="stat-value text-lg">Arjun</div>
          <div className="stat-footer text-muted">
            (Running)
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="main-widgets">
        {/* Left Column */}
        <div className="left-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card widget-card">
            <div className="widget-header">
              <div className="widget-title">
                <h2>Habit Influence Network</h2>
                <p>See how your habits spread through your friend circle</p>
              </div>
              <div className="widget-controls">
                <button className="btn-filter">
                  All Habits <ChevronDown size={16} />
                </button>
              </div>
            </div>
            
            <div className="network-chart-placeholder" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'var(--text-secondary)', background: 'transparent'
            }}>
              {/* Fake Network Graph Image or SVG placeholder */}
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', zIndex: 2, border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                   You
                 </div>
                 {/* Decorative connecting lines for glass effect */}
                 <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                   <circle cx="50%" cy="50%" r="120" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                   <circle cx="50%" cy="50%" r="200" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="1" fill="none" />
                 </svg>
              </div>
            </div>
          </div>

          <div className="glass-card widget-card">
            <div className="section-header">
              <h3>Your Habits</h3>
              <span className="view-all">View All</span>
            </div>
            <div className="habits-list">
              <div className="habit-card">
                <div className="habit-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>🏃</div>
                <div>
                  <h4>Running</h4>
                  <p>3/7 days</p>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: '40%', background: '#10b981' }}></div></div>
              </div>
              <div className="habit-card">
                <div className="habit-icon" style={{ background: '#fae8ff', color: '#c026d3' }}>🧘‍♀️</div>
                <div>
                  <h4>Meditation</h4>
                  <p>2/5 days</p>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: '40%', background: '#8b5cf6' }}></div></div>
              </div>
              <div className="habit-card">
                <div className="habit-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>📖</div>
                <div>
                  <h4>Reading</h4>
                  <p>4/7 days</p>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: '60%', background: '#3b82f6' }}></div></div>
              </div>
              <div className="habit-card" style={{ justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', cursor: 'pointer' }}>
                <Plus size={24} color="#94a3b8" />
                <h4 style={{ color: '#64748b', marginTop: '8px' }}>Add Habit</h4>
              </div>
            </div>
          </div>

          <div className="ai-promo-banner glass-card" style={{ padding: '24px' }}>
            <div className="promo-content">
              <div className="promo-icon">
                <Brain size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e1b4b', marginBottom: '4px' }}>Let AI find your perfect habit partners!</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Get personalized recommendations based on your goals, habits and friend network.</p>
              </div>
            </div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Get Recommendations <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card widget-card">
            <div className="section-header">
              <h3><Sparkles size={18} color="#6366f1" /> AI Pairing Recommendation</h3>
              <span className="view-all">View All</span>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <img src="https://ui-avatars.com/api/?name=Arjun&background=c7d2fe&color=3730a3" className="avatar" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e1b4b' }}>Pair with Arjun</h4>
                    <span style={{ fontSize: '10px', background: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>High Match (92%)</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Your running patterns show a strong temporal association, and your goals and schedules are well aligned.
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '8px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>Similar Goal<br/><span style={{color:'#1e1b4b'}}>(Running)</span></div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '8px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>Schedule Match<br/><span style={{color:'#1e1b4b'}}>(4/5)</span></div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '8px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>Influence Score<br/><span style={{color:'#1e1b4b'}}>(0.72)</span></div>
              </div>
              <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                View Full Explanation <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="glass-card widget-card">
            <div className="section-header">
              <h3><Users size={18} color="#6366f1" /> Top Influencers for Your Habits</h3>
            </div>
            <div className="side-widgets">
              <div className="side-widget-item">
                <span style={{ fontWeight: '800', color: '#94a3b8', width: '16px' }}>1</span>
                <img src="https://ui-avatars.com/api/?name=Arjun" className="avatar" />
                <div className="item-info">
                  <h4>Arjun</h4>
                  <p>Running</p>
                </div>
                <div className="item-score">0.72</div>
              </div>
              <div className="side-widget-item">
                <span style={{ fontWeight: '800', color: '#94a3b8', width: '16px' }}>2</span>
                <img src="https://ui-avatars.com/api/?name=Meera" className="avatar" />
                <div className="item-info">
                  <h4>Meera</h4>
                  <p>Yoga</p>
                </div>
                <div className="item-score">0.68</div>
              </div>
              <div className="side-widget-item">
                <span style={{ fontWeight: '800', color: '#94a3b8', width: '16px' }}>3</span>
                <img src="https://ui-avatars.com/api/?name=Priya" className="avatar" />
                <div className="item-info">
                  <h4>Priya</h4>
                  <p>Meditation</p>
                </div>
                <div className="item-score">0.61</div>
              </div>
            </div>
          </div>

          <div className="glass-card widget-card">
            <div className="section-header">
              <h3><Clock size={18} color="#6366f1" /> Recent Activity</h3>
              <span className="view-all">View All</span>
            </div>
            <div className="side-widgets">
              <div className="side-widget-item">
                <div className="icon-wrapper success" style={{ width: '32px', height: '32px' }}><CheckCircle size={14}/></div>
                <div className="item-info">
                  <h4 style={{ fontSize: '13px' }}>You completed Running</h4>
                  <p style={{ fontSize: '11px' }}>2 hours ago</p>
                </div>
              </div>
              <div className="side-widget-item">
                <div className="icon-wrapper purple" style={{ width: '32px', height: '32px' }}><CheckCircle size={14}/></div>
                <div className="item-info">
                  <h4 style={{ fontSize: '13px' }}>Priya completed Meditation</h4>
                  <p style={{ fontSize: '11px' }}>4 hours ago</p>
                </div>
              </div>
              <div className="side-widget-item">
                <img src="https://ui-avatars.com/api/?name=Arjun" className="avatar" style={{ width: '32px', height: '32px' }} />
                <div className="item-info">
                  <h4 style={{ fontSize: '13px' }}>Arjun completed Running</h4>
                  <p style={{ fontSize: '11px' }}>6 hours ago</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Dashboard;

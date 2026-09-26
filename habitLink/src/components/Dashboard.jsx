import React, { useEffect, useState } from 'react';
import { CheckCircle, Users, Flame, Award, ChevronDown, Sparkles, ArrowRight, Brain, Clock, Plus } from 'lucide-react';
import NetworkGraph from './NetworkGraph';
import { getUserStats, getHabits, getTodayCheckIns, getInfluencers, getPairingRecommendation, logHabitCheckIn } from '../api';
import './Dashboard.css';

const Dashboard = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [habits, setHabits] = useState([]);
  const [todayCheckIns, setTodayCheckIns] = useState({ completed: 0, habit_ids: [] });
  const [influencers, setInfluencers] = useState([]);
  const [pairing, setPairing] = useState(null);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      const [statsData, habitsData, checkInsData, influencersData, pairingData] = await Promise.all([
        getUserStats(),
        getHabits(),
        getTodayCheckIns(),
        getInfluencers(),
        getPairingRecommendation(),
      ]);

      setStats(statsData);
      setHabits(habitsData);
      setTodayCheckIns(checkInsData);
      setInfluencers(influencersData);
      setPairing(pairingData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const logHabit = async (habitId) => {
    try {
      await logHabitCheckIn(habitId);
      await loadDashboard();
    } catch (logError) {
      setError(logError.message);
    }
  };

  const quickStats = stats?.quick_stats || {};
  const topInfluencer = influencers[0];
  const recommendation = pairing?.recommendation;

  // Recent activity is built from data the app already has (which habits
  // were checked in today) rather than a separate activity-feed endpoint,
  // since the backend doesn't expose one.
  const checkedInHabits = habits.filter((habit) => todayCheckIns.habit_ids?.includes(habit.id));

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ marginBottom: '32px' }}>
        <div className="greeting">
          <h1>Good evening, Pallavi!</h1>
          <p>{loading ? 'Syncing your data…' : "Your habits are more powerful when shared. Let's build a healthier you, together."}</p>
        </div>
        <div className="header-actions">
          <div
            className="icon-wrapper"
            style={{ width: '40px', height: '40px', background: 'var(--bg-glass)', borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--border-glass)' }}
            onClick={() => onNavigate?.('Notifications')}
            role="button"
            tabIndex={0}
          >
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
          <div className="stat-value">{quickStats.today_check_ins || todayCheckIns.completed}/{habits.length}</div>
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
          <div className="stat-value">{quickStats.friends_count || 0}</div>
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
          <div className="stat-value">{quickStats.active_habits || habits.length}</div>
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
          <div className="stat-value text-lg">{topInfluencer?.name || 'None yet'}</div>
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
            
            <NetworkGraph height={340} />
          </div>

          <div className="glass-card widget-card">
            <div className="section-header">
              <h3>Your Habits</h3>
              <span className="view-all" onClick={() => onNavigate?.('My Habits')}>View All</span>
            </div>
            <div className="habits-list">
              {habits.map(habit => (
                <button className="habit-card" key={habit.id} onClick={() => logHabit(habit.id)} type="button">
                  <div className="habit-icon" style={{ background: '#e0f2fe', color: habit.color }}>✓</div>
                  <div>
                    <h4>{habit.title}</h4>
                    <p>{habit.completed}/{habit.target_days} days</p>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${habit.progress}%`, background: habit.color }}></div></div>
                </button>
              ))}
              <div className="habit-card" style={{ justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', cursor: 'pointer' }}>
                <Plus size={24} color="#94a3b8" />
                <h4 style={{ color: '#64748b', marginTop: '8px' }}>Add Habit</h4>
              </div>
            </div>
            {error && <p className="text-muted" role="alert">{error}. Start the FastAPI server on port 8000.</p>}
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
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => onNavigate?.('Pairing Recommendations')} type="button">
              Get Recommendations <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card widget-card">
            <div className="section-header">
              <h3><Sparkles size={18} color="#6366f1" /> AI Pairing Recommendation</h3>
              <span className="view-all" onClick={() => onNavigate?.('Pairing Recommendations')}>View All</span>
            </div>
            
            {recommendation ? (
              <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.8)' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(recommendation.name)}&background=c7d2fe&color=3730a3`} className="avatar" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e1b4b' }}>Pair with {recommendation.name}</h4>
                      <span style={{ fontSize: '10px', background: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>{Math.round(recommendation.pairing_score * 100)}% match</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {recommendation.explanation}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '8px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>Influence Score<br/><span style={{color:'#1e1b4b'}}>{Number(recommendation.score).toFixed(2)}</span></div>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '8px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>Pairing Score<br/><span style={{color:'#1e1b4b'}}>{Number(recommendation.pairing_score).toFixed(2)}</span></div>
                </div>
              </div>
            ) : (
              <p className="text-muted">{pairing?.message || 'Connect with a friend to receive a pairing recommendation.'}</p>
            )}
          </div>

          <div className="glass-card widget-card">
            <div className="section-header">
              <h3><Users size={18} color="#6366f1" /> Top Influencers for Your Habits</h3>
            </div>
            <div className="side-widgets">
              {influencers.map((influencer, index) => (
                <div className="side-widget-item" key={influencer.id}>
                  <span style={{ fontWeight: '800', color: '#94a3b8', width: '16px' }}>{index + 1}</span>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.name)}`} className="avatar" />
                  <div className="item-info">
                    <h4>{influencer.name}</h4>
                    <p>Habit influence</p>
                  </div>
                  <div className="item-score">{Number(influencer.score).toFixed(2)}</div>
                </div>
              ))}
              {!influencers.length && <p className="text-muted">No influencers yet.</p>}
            </div>
          </div>

          <div className="glass-card widget-card">
            <div className="section-header">
              <h3><Clock size={18} color="#6366f1" /> Recent Activity</h3>
            </div>
            <div className="side-widgets">
              {checkedInHabits.length ? checkedInHabits.map((habit) => (
                <div className="side-widget-item" key={habit.id}>
                  <div className="icon-wrapper success" style={{ width: '32px', height: '32px' }}><CheckCircle size={14}/></div>
                  <div className="item-info">
                    <h4 style={{ fontSize: '13px' }}>You completed {habit.name}</h4>
                    <p style={{ fontSize: '11px' }}>Today</p>
                  </div>
                </div>
              )) : (
                <p className="text-muted">No check-ins yet today.</p>
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState } from 'react';
import { CheckCircle, Users, Sparkles, Bell } from 'lucide-react';
import { getUserStats, getHabits, getTodayCheckIns, getPairingRecommendation } from '../api';
import './Pages.css';

// There is no notifications endpoint in the backend. This page builds a
// simple activity summary from data the app already has (habits, today's
// check-ins, influencers, pairing recommendation) rather than a live
// notification feed. Nothing here represents a push/email notification
// that was actually sent.
const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getUserStats(), getHabits(), getTodayCheckIns(), getPairingRecommendation()])
      .then(([stats, habits, today, pairing]) => {
        const built = [];
        const remaining = habits.length - (today.habit_ids?.length || 0);

        if (remaining > 0) {
          built.push({
            icon: <Bell size={16} />,
            tone: 'orange',
            title: `${remaining} habit${remaining === 1 ? '' : 's'} still need a check-in today`,
            detail: 'Head to My Habits to log them before the day resets.',
          });
        } else if (habits.length) {
          built.push({
            icon: <CheckCircle size={16} />,
            tone: 'success',
            title: 'All habits checked in for today',
            detail: 'Nice work — your streaks are on track.',
          });
        }

        if (stats.top_influencer) {
          built.push({
            icon: <Users size={16} />,
            tone: 'blue',
            title: `${stats.top_influencer.name} is your top habit influence`,
            detail: `Contagion score of ${Number(stats.top_influencer.score).toFixed(2)} based on shared check-in activity.`,
          });
        }

        if (pairing?.recommendation) {
          built.push({
            icon: <Sparkles size={16} />,
            tone: 'purple',
            title: `New pairing suggestion: ${pairing.recommendation.name}`,
            detail: pairing.recommendation.explanation,
          });
        }

        setItems(built);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>A summary of your current activity — generated from your live habit and network data.</p>
      </div>

      {loading && <p className="page-loading">Loading activity…</p>}
      {!loading && error && <p className="page-error">{error}. Start the FastAPI server on port 8000.</p>}

      {!loading && !error && (
        items.length ? (
          <div className="glass-card">
            <div className="notification-list">
              {items.map((item, index) => (
                <div className="notification-item" key={index}>
                  <div className={`notification-icon icon-wrapper ${item.tone}`}>{item.icon}</div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card empty-state">
            <p>Nothing to show yet — add a habit or a friend to see activity here.</p>
          </div>
        )
      )}

      <p className="notification-disclaimer">This is an in-app activity summary, not a push or email notification.</p>
    </div>
  );
};

export default Notifications;

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Users, Sparkles, Bell, ArrowRight } from 'lucide-react';
import {
  getUserStats,
  getHabits,
  getTodayCheckIns,
  getPairingRecommendation,
} from '../api';
import { EmptyState, SkeletonSideList } from '../components/UIComponents';
import { useToast } from '../components/Toast';
import '../components/Dashboard.css';
import './Pages.css';

// There is no notifications endpoint in the backend. This page builds a
// simple activity summary from data the app already has (habits, today's
// check-ins, influencers, pairing recommendation) rather than a live
// notification feed. Nothing here represents a push/email notification
// that was actually sent.
const Notifications = ({ onNavigate }) => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [stats, habits, today, pairing] = await Promise.all([
        getUserStats(),
        getHabits(),
        getTodayCheckIns(),
        getPairingRecommendation(),
      ]);

      const built = [];
      const remaining = habits.length - (today.habit_ids?.length || 0);

      if (remaining > 0) {
        built.push({
          icon: <Bell size={16} />,
          tone: 'orange',
          title: `${remaining} habit${
            remaining === 1 ? '' : 's'
          } still need a check-in today`,
          detail: 'Head to My Habits to log them before the day resets.',
          actionLabel: 'Check In Now',
          targetPage: 'My Habits',
        });
      } else if (habits.length) {
        built.push({
          icon: <CheckCircle size={16} />,
          tone: 'success',
          title: 'All habits checked in for today',
          detail: 'Nice work — your streaks are on track.',
          actionLabel: 'View My Habits',
          targetPage: 'My Habits',
        });
      }

      if (stats.top_influencer) {
        built.push({
          icon: <Users size={16} />,
          tone: 'blue',
          title: `${stats.top_influencer.name} is your top habit influence`,
          detail: `Contagion score of ${Number(
            stats.top_influencer.score
          ).toFixed(2)} based on shared check-in activity.`,
          actionLabel: 'View Network',
          targetPage: 'Network Graph',
        });
      }

      if (pairing?.recommendation) {
        built.push({
          icon: <Sparkles size={16} />,
          tone: 'purple',
          title: `New pairing suggestion: ${pairing.recommendation.name}`,
          detail: pairing.recommendation.explanation,
          actionLabel: 'View Match',
          targetPage: 'Pairing Recommendations',
        });
      }

      setItems(built);
    } catch (err) {
      setError(err.message);
      toast.error(err.message, 'Failed to Load Activity');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>
          A summary of your current activity — generated from your live habit and
          network data.
        </p>
      </div>

      {loading && (
        <div className="glass-card">
          <SkeletonSideList rows={3} />
        </div>
      )}

      {!loading && error && (
        <div className="glass-card">
          <EmptyState
            icon={Bell}
            title="Unable to Load Activity Summary"
            description={`${error}. Ensure the FastAPI server is running on port 8000.`}
            actionLabel="Retry"
            onAction={loadNotifications}
          />
        </div>
      )}

      {!loading &&
        !error &&
        (items.length ? (
          <div className="glass-card">
            <div className="notification-list">
              {items.map((item, index) => (
                <div className="notification-item" key={index}>
                  <div
                    className={`notification-icon icon-wrapper ${item.tone}`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                  </div>
                  {item.actionLabel && item.targetPage && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm notification-action-btn"
                      onClick={() => onNavigate?.(item.targetPage)}
                    >
                      {item.actionLabel} <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card">
            <EmptyState
              icon={Bell}
              title="No Notifications Right Now"
              description="Nothing to show yet — add a habit or check in with your friend network to see activity summaries here."
              actionLabel="Go to My Habits"
              onAction={() => onNavigate?.('My Habits')}
            />
          </div>
        ))}

      <p className="notification-disclaimer">
        This is an in-app activity summary, not a push or email notification.
      </p>
    </div>
  );
};

export default Notifications;

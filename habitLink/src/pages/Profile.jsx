import React, { useEffect, useState, useCallback } from 'react';
import { Pencil, Plus, Flame, ArrowRight } from 'lucide-react';
import { getUserStats, getHabits, updateHabit } from '../api';
import { HabitIconBadge, EditHabitModal } from '../components/HabitModals';
import { EmptyState, SkeletonStatCards } from '../components/UIComponents';
import { useToast } from '../components/Toast';
import '../components/Dashboard.css';
import './Pages.css';

const Profile = ({ onNavigate, onStatsChange }) => {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [habitToEdit, setHabitToEdit] = useState(null);
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      setError('');
      const [statsData, habitsData] = await Promise.all([
        getUserStats(),
        getHabits(),
      ]);
      setStats(statsData);
      setHabits(Array.isArray(habitsData) ? habitsData : []);
      onStatsChange?.();
    } catch (err) {
      setError(err.message);
      toast.error(err.message, 'Failed to Load Profile');
    } finally {
      setLoading(false);
    }
  }, [onStatsChange, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpdateHabit = async (habitId, payload) => {
    if (isEditingHabit) return;
    setIsEditingHabit(true);
    setEditModalError('');
    try {
      const updated = await updateHabit(habitId, payload);
      setHabitToEdit(null);
      await loadProfile();
      toast.success(
        `Habit "${updated.name}" updated successfully!`,
        'Habit Updated'
      );
    } catch (err) {
      const msg = err.message || 'Failed to update habit.';
      setEditModalError(msg);
      toast.error(msg, 'Failed to Edit Habit');
    } finally {
      setIsEditingHabit(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>Profile</h1>
          <p>
            Your account overview, based on your current habit and connection data.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onNavigate?.('My Habits')}
        >
          Manage Habits <ArrowRight size={16} />
        </button>
      </div>

      {loading && <SkeletonStatCards count={4} />}

      {!loading && error && (
        <div className="glass-card">
          <EmptyState
            icon={Flame}
            title="Unable to Load Profile"
            description={`${error}. Ensure the FastAPI server is running on port 8000.`}
            actionLabel="Retry"
            onAction={loadProfile}
          />
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="glass-card profile-header">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                stats.display_name
              )}&background=c7d2fe&color=3730a3`}
              alt={stats.display_name}
              className="avatar"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2>{stats.display_name}</h2>
              <p>
                User ID #{stats.user_id} · Active in the HabitLink Contagion Network
              </p>
            </div>
          </div>

          <div className="glass-card">
            <div className="section-header">
              <h3>Account Stats</h3>
            </div>
            <div className="profile-stats-grid">
              <div className="profile-stat">
                <span>Total check-ins</span>
                <strong>{stats.check_ins}</strong>
              </div>
              <div className="profile-stat">
                <span>Active habits</span>
                <strong>{stats.active_habits_count}</strong>
              </div>
              <div className="profile-stat">
                <span>Friends</span>
                <strong>{stats.total_friends}</strong>
              </div>
              <div className="profile-stat">
                <span>Top influencer</span>
                <strong style={{ fontSize: '18px' }}>
                  {stats.top_influencer?.name || 'None yet'}
                </strong>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="section-header">
              <div>
                <h3>Tracked Habits ({habits.length})</h3>
                <span className="section-subtitle">
                  Click the edit button on any habit to customize its name, icon, or
                  frequency
                </span>
              </div>
              <button
                type="button"
                className="view-all"
                onClick={() => onNavigate?.('My Habits')}
              >
                Open My Habits
              </button>
            </div>

            {habits.length > 0 ? (
              <div className="profile-habits-detailed-grid">
                {habits.map((habit) => (
                  <div className="profile-habit-row-card" key={habit.id}>
                    <HabitIconBadge
                      icon={habit.icon}
                      color={habit.color}
                      size={18}
                    />
                    <div className="profile-habit-row-info">
                      <div className="profile-habit-row-top">
                        <h4>{habit.name}</h4>
                        <span className="habit-freq-tag">
                          {habit.frequency === 'weekly' ? 'Weekly' : 'Daily'}
                        </span>
                      </div>
                      <p>
                        {habit.completed}/{habit.target_days} days (7d) ·{' '}
                        {habit.progress}%
                      </p>
                    </div>
                    <button
                      type="button"
                      className="habit-action-btn edit"
                      onClick={() => {
                        setEditModalError('');
                        setHabitToEdit(habit);
                      }}
                      aria-label={`Edit ${habit.name}`}
                      title={`Edit ${habit.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Plus}
                title="No Habits Added Yet"
                description="Add your first habit to start building consistency across your network."
                actionLabel="Go to My Habits"
                onAction={() => onNavigate?.('My Habits')}
                compact
              />
            )}
          </div>
        </>
      )}

      <EditHabitModal
        habit={habitToEdit}
        isOpen={Boolean(habitToEdit)}
        onClose={() => setHabitToEdit(null)}
        onSubmit={handleUpdateHabit}
        isSubmitting={isEditingHabit}
        apiError={editModalError}
      />
    </div>
  );
};

export default Profile;

import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle,
  Users,
  Flame,
  Award,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Brain,
  Clock,
  Plus,
  Trash2,
  Pencil,
  Check,
  Loader2,
  Bell,
} from 'lucide-react';
import NetworkGraph from './NetworkGraph';
import {
  HabitIconBadge,
  AddHabitModal,
  EditHabitModal,
  DeleteHabitModal,
} from './HabitModals';
import {
  EmptyState,
  SkeletonStatCards,
  SkeletonHabitCards,
  SkeletonSideList,
} from './UIComponents';
import { useToast } from './Toast';
import {
  getUserStats,
  getHabits,
  getTodayCheckIns,
  getInfluencers,
  getPairingRecommendation,
  getRecentActivity,
  toggleHabitCheckIn,
  createHabit,
  updateHabit,
  deleteHabit,
} from '../api';
import './Dashboard.css';

const Dashboard = ({ onNavigate, onStatsChange }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [habits, setHabits] = useState([]);
  const [todayCheckIns, setTodayCheckIns] = useState({ completed: 0, habit_ids: [] });
  const [influencers, setInfluencers] = useState([]);
  const [pairing, setPairing] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState('');

  // Network graph habit filter
  const [networkHabitFilter, setNetworkHabitFilter] = useState('all');

  // Add Habit states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingHabit, setIsSubmittingHabit] = useState(false);
  const [addModalError, setAddModalError] = useState('');

  // Edit Habit states
  const [habitToEdit, setHabitToEdit] = useState(null);
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  // Delete Habit states
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [isDeletingHabit, setIsDeletingHabit] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState('');

  // Check-in toggle state
  const [togglingHabitId, setTogglingHabitId] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError('');
      const [
        statsData,
        habitsData,
        checkInsData,
        influencersData,
        pairingData,
        activityData,
      ] = await Promise.all([
        getUserStats(),
        getHabits(),
        getTodayCheckIns(),
        getInfluencers(),
        getPairingRecommendation(),
        getRecentActivity(6).catch(() => []),
      ]);

      setStats(statsData);
      setHabits(Array.isArray(habitsData) ? habitsData : []);
      setTodayCheckIns(checkInsData || { completed: 0, habit_ids: [] });
      setInfluencers(Array.isArray(influencersData) ? influencersData : []);
      setPairing(pairingData);
      setRecentActivity(Array.isArray(activityData) ? activityData : []);
      onStatsChange?.();
    } catch (loadError) {
      setError(loadError.message);
      toast.error(loadError.message, 'Connection Error');
    } finally {
      setLoading(false);
    }
  }, [onStatsChange, toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleToggleHabit = async (habitId) => {
    if (togglingHabitId !== null) return;
    setTogglingHabitId(habitId);
    try {
      const result = await toggleHabitCheckIn(habitId);
      await loadDashboard();
      if (result?.completed_today) {
        toast.success(
          `Checked in for "${result.habit_name || 'habit'}"! Keep the streak going.`,
          'Habit Completed'
        );
      } else {
        toast.info(
          `Check-in undone for "${result?.habit_name || 'habit'}".`,
          'Check-in Removed'
        );
      }
    } catch (logError) {
      toast.error(logError.message || 'Could not update check-in status.', 'Check-in Failed');
    } finally {
      setTogglingHabitId(null);
    }
  };

  const handleCreateHabit = async (payload) => {
    if (isSubmittingHabit) return;
    setIsSubmittingHabit(true);
    setAddModalError('');
    try {
      const created = await createHabit(payload);
      setIsAddModalOpen(false);
      await loadDashboard();
      toast.success(
        `"${created.name}" has been added to your habits.`,
        'Habit Added'
      );
    } catch (createError) {
      const msg = createError.message || 'Failed to create habit.';
      setAddModalError(msg);
      toast.error(msg, 'Failed to Add Habit');
    } finally {
      setIsSubmittingHabit(false);
    }
  };

  const handleUpdateHabit = async (habitId, payload) => {
    if (isEditingHabit) return;
    setIsEditingHabit(true);
    setEditModalError('');
    const previousName = habitToEdit?.name || habitToEdit?.title || '';
    try {
      const updated = await updateHabit(habitId, payload);
      setHabitToEdit(null);
      if (
        previousName &&
        networkHabitFilter.toLowerCase() === previousName.toLowerCase()
      ) {
        setNetworkHabitFilter(updated.name);
      }
      await loadDashboard();
      toast.success(
        `"${updated.name}" was updated successfully.`,
        'Habit Updated'
      );
    } catch (editError) {
      const msg = editError.message || 'Failed to update habit.';
      setEditModalError(msg);
      toast.error(msg, 'Failed to Edit Habit');
    } finally {
      setIsEditingHabit(false);
    }
  };

  const handleConfirmDeleteHabit = async (habit) => {
    if (!habit || isDeletingHabit) return;
    setIsDeletingHabit(true);
    setDeleteModalError('');
    try {
      await deleteHabit(habit.id);
      setHabitToDelete(null);
      if (networkHabitFilter.toLowerCase() === (habit.name || '').toLowerCase()) {
        setNetworkHabitFilter('all');
      }
      await loadDashboard();
      toast.success(
        `"${habit.name || habit.title}" was deleted.`,
        'Habit Deleted'
      );
    } catch (delError) {
      const msg = delError.message || 'Failed to delete habit.';
      setDeleteModalError(msg);
      toast.error(msg, 'Failed to Delete Habit');
    } finally {
      setIsDeletingHabit(false);
    }
  };

  const quickStats = stats?.quick_stats || {};
  const topInfluencer = influencers[0];
  const recommendation = pairing?.recommendation;

  const checkedInHabits = habits.filter(
    (habit) => habit.completed_today || todayCheckIns.habit_ids?.includes(habit.id)
  );
  const completedCount =
    todayCheckIns.habit_ids !== undefined
      ? todayCheckIns.habit_ids.length
      : quickStats.today_check_ins ?? todayCheckIns.completed ?? 0;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="greeting">
          <h1>Good evening, {stats?.display_name || 'Pallavi'}!</h1>
          <p>
            {loading
              ? 'Syncing your habit contagion network…'
              : "Your habits are more powerful when shared. Let's build a healthier you, together."}
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="icon-wrapper header-notif-btn"
            onClick={() => onNavigate?.('Notifications')}
            aria-label="Open Notifications"
            title="Notifications"
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Bell size={18} color="#3730a3" />
              {habits.length - completedCount > 0 && <span className="notif-dot" />}
            </span>
          </button>
          <button
            type="button"
            className="user-profile"
            onClick={() => onNavigate?.('Profile')}
            aria-label={`Open profile for ${stats?.display_name || 'Pallavi'}`}
          >
            <img
              src="https://ui-avatars.com/api/?name=Pallavi&background=c7d2fe&color=3730a3"
              alt="Pallavi"
              className="avatar"
              style={{ width: '32px', height: '32px', border: 'none' }}
            />
            <div className="user-info">
              <span className="user-name" style={{ fontSize: '13px' }}>
                {stats?.display_name || 'Pallavi'}
              </span>
            </div>
            <ChevronDown size={14} style={{ marginLeft: '4px', color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </header>

      {/* Top Stats Grid */}
      {loading ? (
        <SkeletonStatCards count={4} />
      ) : (
        <section className="stats-grid" aria-label="Dashboard key metrics">
          <div className="glass-card stat-card">
            <div className="stat-header">
              <h3>Today&apos;s Check-ins</h3>
              <div className="icon-wrapper success" aria-hidden="true">
                <CheckCircle size={20} />
              </div>
            </div>
            <div className="stat-value">
              {completedCount}/{habits.length}
            </div>
            <div className="stat-footer success-text">
              {habits.length > 0 && completedCount === habits.length
                ? '★ All habits completed today!'
                : '↗ Keep going!'}
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-header">
              <h3>Total Friends</h3>
              <div className="icon-wrapper blue" aria-hidden="true">
                <Users size={20} />
              </div>
            </div>
            <div className="stat-value">
              {quickStats.friends_count ?? stats?.total_friends ?? 0}
            </div>
            <div className="stat-footer text-muted">More connections, more impact!</div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-header">
              <h3>Active Habits</h3>
              <div className="icon-wrapper purple" aria-hidden="true">
                <Flame size={20} />
              </div>
            </div>
            <div className="stat-value">{habits.length}</div>
            <div className="stat-footer success-text">
              {habits.length > 0
                ? `${completedCount} completed today`
                : 'Add your first habit'}
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-header">
              <h3>Top Influence</h3>
              <div className="icon-wrapper orange" aria-hidden="true">
                <Award size={20} />
              </div>
            </div>
            <div className="stat-value text-lg">
              {topInfluencer?.name || 'None yet'}
            </div>
            <div className="stat-footer text-muted">
              {topInfluencer?.top_habit
                ? `(${topInfluencer.top_habit})`
                : 'Log shared habits to rank'}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <section className="main-widgets">
        {/* Left Column */}
        <div className="left-column">
          <div className="glass-card widget-card">
            <div className="widget-header">
              <div className="widget-title">
                <h2>Habit Influence Network</h2>
                <p>See how your habits spread through your friend circle</p>
              </div>
              <div className="widget-controls">
                <div className="select-filter-wrapper">
                  <select
                    className="btn-filter-select"
                    value={networkHabitFilter}
                    onChange={(e) => setNetworkHabitFilter(e.target.value)}
                    aria-label="Filter network by habit"
                  >
                    <option value="all">All Habits</option>
                    {habits.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="select-chevron" aria-hidden="true" />
                </div>
              </div>
            </div>

            <NetworkGraph
              height={340}
              habitFilter={networkHabitFilter}
              onResetFilter={() => setNetworkHabitFilter('all')}
            />
          </div>

          <div className="glass-card widget-card">
            <div className="section-header">
              <div>
                <h3>Your Habits</h3>
                <span className="section-subtitle">
                  Check in for today, edit details, or add new routines to your network
                </span>
              </div>
              <div className="section-header-actions">
                <button
                  type="button"
                  className="btn-add-inline"
                  onClick={() => {
                    setAddModalError('');
                    setIsAddModalOpen(true);
                  }}
                >
                  <Plus size={15} />
                  Add Habit
                </button>
                <button
                  type="button"
                  className="view-all"
                  onClick={() => onNavigate?.('My Habits')}
                >
                  View All
                </button>
              </div>
            </div>

            {loading ? (
              <SkeletonHabitCards count={3} />
            ) : habits.length === 0 ? (
              <EmptyState
                icon={Flame}
                title="No Habits Tracked Yet"
                description="Start building consistent routines and see how your progress inspires your friend network."
                actionLabel="Add Your First Habit"
                onAction={() => {
                  setAddModalError('');
                  setIsAddModalOpen(true);
                }}
              />
            ) : (
              <div className="habits-list">
                {habits.map((habit) => {
                  const isDoneToday =
                    habit.completed_today ||
                    todayCheckIns.habit_ids?.includes(habit.id);
                  const isToggling = togglingHabitId === habit.id;

                  return (
                    <div
                      className={`habit-card ${isDoneToday ? 'completed-today' : ''}`}
                      key={habit.id}
                    >
                      <div className="habit-card-top">
                        <HabitIconBadge icon={habit.icon} color={habit.color} size={17} />
                        <div className="habit-card-meta">
                          <span className="habit-freq-tag">
                            {habit.frequency === 'weekly' ? 'Weekly' : 'Daily'}
                          </span>
                          <button
                            type="button"
                            className="habit-action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditModalError('');
                              setHabitToEdit(habit);
                            }}
                            title={`Edit ${habit.title || habit.name}`}
                            aria-label={`Edit ${habit.title || habit.name}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="habit-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteModalError('');
                              setHabitToDelete(habit);
                            }}
                            title={`Remove ${habit.title || habit.name}`}
                            aria-label={`Remove ${habit.title || habit.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="habit-card-body">
                        <h4 title={habit.title || habit.name}>
                          {habit.title || habit.name}
                        </h4>
                        <p>
                          {habit.completed}/{habit.target_days} days · {habit.progress}%
                        </p>
                      </div>

                      <div className="progress-bar" aria-hidden="true">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${habit.progress}%`,
                            background: habit.color || 'var(--primary-color)',
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        className={`habit-toggle-btn ${isDoneToday ? 'done' : ''}`}
                        onClick={() => handleToggleHabit(habit.id)}
                        disabled={isToggling}
                        aria-label={
                          isDoneToday
                            ? `Mark ${habit.name} as incomplete for today`
                            : `Check in for ${habit.name}`
                        }
                      >
                        {isToggling ? (
                          <>
                            <Loader2 size={13} className="spin-icon" />
                            Saving…
                          </>
                        ) : isDoneToday ? (
                          <>
                            <Check size={13} strokeWidth={2.6} />
                            Done Today
                          </>
                        ) : (
                          <>
                            <Plus size={13} />
                            Check In
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="habit-card add-habit-card"
                  onClick={() => {
                    setAddModalError('');
                    setIsAddModalOpen(true);
                  }}
                  aria-label="Add a new habit"
                >
                  <div className="add-habit-icon-circle">
                    <Plus size={22} />
                  </div>
                  <h4>Add Habit</h4>
                  <p>Create a new routine</p>
                </button>
              </div>
            )}

            {error && (
              <p className="text-muted" role="alert" style={{ marginTop: '12px' }}>
                {error}. Start the FastAPI server on port 8000.
              </p>
            )}
          </div>

          <div className="ai-promo-banner glass-card">
            <div className="promo-content">
              <div className="promo-icon" aria-hidden="true">
                <Brain size={24} />
              </div>
              <div>
                <h3>Let AI find your perfect habit partners!</h3>
                <p>
                  Get personalized recommendations based on your goals, habits and friend network.
                </p>
              </div>
            </div>
            <button
              className="btn-primary promo-action-btn"
              onClick={() => onNavigate?.('Pairing Recommendations')}
              type="button"
            >
              Get Recommendations <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          <div className="glass-card widget-card">
            <div className="section-header">
              <h3>
                <Sparkles size={18} color="#6366f1" aria-hidden="true" /> AI Pairing
                Recommendation
              </h3>
              <button
                type="button"
                className="view-all"
                onClick={() => onNavigate?.('Pairing Recommendations')}
              >
                View All
              </button>
            </div>

            {loading ? (
              <SkeletonSideList rows={2} />
            ) : recommendation ? (
              <div className="recommendation-inner-card">
                <div className="recommendation-top">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      recommendation.name
                    )}&background=c7d2fe&color=3730a3`}
                    alt={recommendation.name}
                    className="avatar recommendation-avatar"
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="recommendation-name-row">
                      <h4>Pair with {recommendation.name}</h4>
                      <span className="match-pill">
                        {Math.round(recommendation.pairing_score * 100)}% match
                      </span>
                    </div>
                    <p className="recommendation-desc">{recommendation.explanation}</p>
                  </div>
                </div>
                <div className="recommendation-scores-grid">
                  <div className="recommendation-score-box">
                    Influence Score
                    <br />
                    <span>{Number(recommendation.score).toFixed(2)}</span>
                  </div>
                  <div className="recommendation-score-box">
                    Pairing Score
                    <br />
                    <span>{Number(recommendation.pairing_score).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No Pairing Match Yet"
                description={
                  pairing?.message ||
                  'Check in to shared habits with your friends to unlock AI pairing recommendations.'
                }
                actionLabel="Manage Habits"
                onAction={() => onNavigate?.('My Habits')}
                compact
              />
            )}
          </div>

          <div className="glass-card widget-card">
            <div className="section-header">
              <h3>
                <Users size={18} color="#6366f1" aria-hidden="true" /> Top Influencers
                for Your Habits
              </h3>
            </div>
            {loading ? (
              <SkeletonSideList rows={3} />
            ) : influencers.length > 0 ? (
              <div className="side-widgets">
                {influencers.map((influencer, index) => (
                  <div className="side-widget-item" key={influencer.id}>
                    <span className="influencer-rank">{index + 1}</span>
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        influencer.name
                      )}`}
                      alt={influencer.name}
                      className="avatar"
                    />
                    <div className="item-info">
                      <h4>{influencer.name}</h4>
                      <p>{influencer.top_habit || 'Habit influence'}</p>
                    </div>
                    <div className="item-score">
                      {Number(influencer.score).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No Influencers Ranked Yet"
                description="Influence scores appear once your check-ins overlap with friends within 48 hours."
                actionLabel="View Network"
                onAction={() => onNavigate?.('Network Graph')}
                compact
              />
            )}
          </div>

          <div className="glass-card widget-card">
            <div className="section-header">
              <h3>
                <Clock size={18} color="#6366f1" aria-hidden="true" /> Recent Activity
              </h3>
            </div>
            {loading ? (
              <SkeletonSideList rows={3} />
            ) : recentActivity.length > 0 ? (
              <div className="side-widgets">
                {recentActivity.slice(0, 5).map((item) => (
                  <div className="side-widget-item" key={item.id}>
                    <div
                      className={`icon-wrapper ${
                        item.is_current_user ? 'success' : 'blue'
                      }`}
                      style={{ width: '32px', height: '32px', flexShrink: 0 }}
                      aria-hidden="true"
                    >
                      <CheckCircle size={14} />
                    </div>
                    <div className="item-info">
                      <h4 style={{ fontSize: '13px' }}>{item.summary}</h4>
                      <p style={{ fontSize: '11px' }}>{item.time_ago}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : checkedInHabits.length > 0 ? (
              <div className="side-widgets">
                {checkedInHabits.map((habit) => (
                  <div className="side-widget-item" key={habit.id}>
                    <div
                      className="icon-wrapper success"
                      style={{ width: '32px', height: '32px', flexShrink: 0 }}
                      aria-hidden="true"
                    >
                      <CheckCircle size={14} />
                    </div>
                    <div className="item-info">
                      <h4 style={{ fontSize: '13px' }}>You completed {habit.name}</h4>
                      <p style={{ fontSize: '11px' }}>Today</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No Recent Activity"
                description="Check in to a habit today to log your activity and motivate your network."
                actionLabel="Check In Now"
                onAction={() => onNavigate?.('My Habits')}
                compact
              />
            )}
          </div>
        </div>
      </section>

      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateHabit}
        isSubmitting={isSubmittingHabit}
        apiError={addModalError}
      />

      <EditHabitModal
        habit={habitToEdit}
        isOpen={Boolean(habitToEdit)}
        onClose={() => setHabitToEdit(null)}
        onSubmit={handleUpdateHabit}
        isSubmitting={isEditingHabit}
        apiError={editModalError}
      />

      <DeleteHabitModal
        habit={habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={handleConfirmDeleteHabit}
        isDeleting={isDeletingHabit}
        apiError={deleteModalError}
      />
    </div>
  );
};

export default Dashboard;

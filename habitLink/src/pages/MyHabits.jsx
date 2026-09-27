import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Plus, Trash2, Loader2, X } from 'lucide-react';
import {
  getHabits,
  getTodayCheckIns,
  toggleHabitCheckIn,
  createHabit,
  deleteHabit,
} from '../api';
import {
  HabitIconBadge,
  AddHabitModal,
  DeleteHabitModal,
} from '../components/HabitModals';
import '../components/Dashboard.css';
import './Pages.css';

const MyHabits = ({ onStatsChange }) => {
  const [habits, setHabits] = useState([]);
  const [todayIds, setTodayIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingHabit, setIsSubmittingHabit] = useState(false);
  const [addModalError, setAddModalError] = useState('');

  const [habitToDelete, setHabitToDelete] = useState(null);
  const [isDeletingHabit, setIsDeletingHabit] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState('');

  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const load = useCallback(async () => {
    try {
      setError('');
      const [habitsData, todayData] = await Promise.all([getHabits(), getTodayCheckIns()]);
      setHabits(habitsData);
      setTodayIds(todayData.habit_ids || []);
      onStatsChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onStatsChange]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleCheckIn = async (habitId) => {
    if (pendingId === habitId) return;
    setPendingId(habitId);
    try {
      const res = await toggleHabitCheckIn(habitId);
      await load();
      setFeedback({
        type: 'success',
        message: res?.completed_today
          ? `Checked in for "${res.habit_name || 'habit'}"!`
          : `Check-in removed for "${res?.habit_name || 'habit'}".`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setPendingId(null);
    }
  };

  const handleCreateHabit = async (payload) => {
    setIsSubmittingHabit(true);
    setAddModalError('');
    try {
      const created = await createHabit(payload);
      setIsAddModalOpen(false);
      await load();
      setFeedback({
        type: 'success',
        message: `Habit "${created.name}" added successfully!`,
      });
    } catch (err) {
      setAddModalError(err.message || 'Failed to create habit.');
    } finally {
      setIsSubmittingHabit(false);
    }
  };

  const handleConfirmDelete = async (habit) => {
    if (!habit) return;
    setIsDeletingHabit(true);
    setDeleteModalError('');
    try {
      await deleteHabit(habit.id);
      setHabitToDelete(null);
      await load();
      setFeedback({
        type: 'success',
        message: `Habit "${habit.name || habit.title}" was removed.`,
      });
    } catch (err) {
      setDeleteModalError(err.message || 'Failed to delete habit.');
    } finally {
      setIsDeletingHabit(false);
    }
  };

  const completedToday = todayIds.length;

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>My Habits</h1>
          <p>
            {completedToday}/{habits.length} checked in today · keep your streaks alive
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setAddModalError('');
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={16} />
          Add Habit
        </button>
      </div>

      {feedback && (
        <div className={`alert-banner ${feedback.type}`} role="status">
          <span>{feedback.message}</span>
          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {loading && <p className="page-loading">Loading your habits…</p>}
      {!loading && error && (
        <p className="page-error">{error}. Start the FastAPI server on port 8000.</p>
      )}

      {!loading && !error && (
        <div className="habits-grid">
          {habits.map((habit) => {
            const doneToday = habit.completed_today || todayIds.includes(habit.id);
            const isSaving = pendingId === habit.id;
            return (
              <div className="glass-card habit-tile" key={habit.id}>
                <div className="habit-tile-top">
                  <HabitIconBadge icon={habit.icon} color={habit.color} size={20} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`habit-tile-status ${doneToday ? 'done' : 'pending'}`}>
                      {doneToday ? 'Checked in' : 'Not yet'}
                    </span>
                    <button
                      type="button"
                      className="habit-action-btn delete"
                      onClick={() => {
                        setDeleteModalError('');
                        setHabitToDelete(habit);
                      }}
                      title={`Remove ${habit.name}`}
                      aria-label={`Remove ${habit.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <h3>{habit.name}</h3>
                  <span className="habit-freq-tag">
                    {habit.frequency === 'weekly' ? 'Weekly' : 'Daily'}
                  </span>
                </div>
                <div>
                  <div className="habit-tile-progress-label">
                    <span>
                      {habit.completed}/{habit.target_days} days (7d)
                    </span>
                    <span>{habit.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${habit.progress}%`,
                        background: habit.color || 'var(--primary-color)',
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className={`habit-checkin-btn ${doneToday ? 'done' : 'active'}`}
                  onClick={() => handleToggleCheckIn(habit.id)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      {doneToday ? 'Done for today (click to undo)' : 'Check in'}
                    </>
                  )}
                </button>
              </div>
            );
          })}

          <button
            type="button"
            className="glass-card habit-tile add-habit-card"
            onClick={() => {
              setAddModalError('');
              setIsAddModalOpen(true);
            }}
            style={{ minHeight: '210px' }}
          >
            <div className="add-habit-icon-circle">
              <Plus size={24} />
            </div>
            <h3>Add New Habit</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Create a daily or weekly habit
            </p>
          </button>
        </div>
      )}

      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateHabit}
        isSubmitting={isSubmittingHabit}
        apiError={addModalError}
      />

      <DeleteHabitModal
        habit={habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingHabit}
        apiError={deleteModalError}
      />
    </div>
  );
};

export default MyHabits;

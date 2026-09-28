import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Flame,
  Search,
  X,
} from 'lucide-react';
import {
  getHabits,
  getTodayCheckIns,
  toggleHabitCheckIn,
  createHabit,
  updateHabit,
  deleteHabit,
} from '../api';
import {
  HabitIconBadge,
  AddHabitModal,
  EditHabitModal,
  DeleteHabitModal,
} from '../components/HabitModals';
import { EmptyState, SkeletonHabitCards } from '../components/UIComponents';
import { useToast } from '../components/Toast';
import '../components/Dashboard.css';
import './Pages.css';

const MyHabits = ({ onStatsChange }) => {
  const toast = useToast();
  const [habits, setHabits] = useState([]);
  const [todayIds, setTodayIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingHabit, setIsSubmittingHabit] = useState(false);
  const [addModalError, setAddModalError] = useState('');

  const [habitToEdit, setHabitToEdit] = useState(null);
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  const [habitToDelete, setHabitToDelete] = useState(null);
  const [isDeletingHabit, setIsDeletingHabit] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [habitsData, todayData] = await Promise.all([
        getHabits(),
        getTodayCheckIns(),
      ]);
      setHabits(Array.isArray(habitsData) ? habitsData : []);
      setTodayIds(todayData?.habit_ids || []);
      onStatsChange?.();
    } catch (err) {
      setError(err.message);
      toast.error(err.message, 'Failed to Load Habits');
    } finally {
      setLoading(false);
    }
  }, [onStatsChange, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleCheckIn = async (habitId) => {
    if (pendingId !== null) return;
    setPendingId(habitId);
    try {
      const res = await toggleHabitCheckIn(habitId);
      await load();
      if (res?.completed_today) {
        toast.success(
          `Checked in for "${res.habit_name || 'habit'}"!`,
          'Habit Completed'
        );
      } else {
        toast.info(
          `Check-in removed for "${res?.habit_name || 'habit'}".`,
          'Check-in Undone'
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update check-in.', 'Check-in Error');
    } finally {
      setPendingId(null);
    }
  };

  const handleCreateHabit = async (payload) => {
    if (isSubmittingHabit) return;
    setIsSubmittingHabit(true);
    setAddModalError('');
    try {
      const created = await createHabit(payload);
      setIsAddModalOpen(false);
      await load();
      toast.success(
        `Habit "${created.name}" added successfully!`,
        'Habit Created'
      );
    } catch (err) {
      const msg = err.message || 'Failed to create habit.';
      setAddModalError(msg);
      toast.error(msg, 'Failed to Create Habit');
    } finally {
      setIsSubmittingHabit(false);
    }
  };

  const handleUpdateHabit = async (habitId, payload) => {
    if (isEditingHabit) return;
    setIsEditingHabit(true);
    setEditModalError('');
    try {
      const updated = await updateHabit(habitId, payload);
      setHabitToEdit(null);
      await load();
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

  const handleConfirmDelete = async (habit) => {
    if (!habit || isDeletingHabit) return;
    setIsDeletingHabit(true);
    setDeleteModalError('');
    try {
      await deleteHabit(habit.id);
      setHabitToDelete(null);
      await load();
      toast.success(
        `Habit "${habit.name || habit.title}" was removed.`,
        'Habit Deleted'
      );
    } catch (err) {
      const msg = err.message || 'Failed to delete habit.';
      setDeleteModalError(msg);
      toast.error(msg, 'Failed to Delete Habit');
    } finally {
      setIsDeletingHabit(false);
    }
  };

  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (h.name || '')
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
      const matchesFreq =
        frequencyFilter === 'all' ||
        (h.frequency || 'daily').toLowerCase() === frequencyFilter;
      return matchesSearch && matchesFreq;
    });
  }, [habits, searchQuery, frequencyFilter]);

  const completedToday = todayIds.length;

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>My Habits</h1>
          <p>
            {completedToday}/{habits.length} checked in today · keep your streaks
            alive across your network
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

      {/* Filter & Search Toolbar */}
      {!loading && habits.length > 0 && (
        <div className="glass-card habits-toolbar" role="search" aria-label="Filter habits">
          <div className="habits-search-box">
            <Search size={16} className="habits-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="habits-search-input"
              placeholder="Search habits by name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search habits by name"
            />
            {searchQuery && (
              <button
                type="button"
                className="habits-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="habits-filter-pills" role="group" aria-label="Filter by frequency">
            {['all', 'daily', 'weekly'].map((freq) => (
              <button
                key={freq}
                type="button"
                className={`filter-pill-btn ${
                  frequencyFilter === freq ? 'active' : ''
                }`}
                onClick={() => setFrequencyFilter(freq)}
                aria-pressed={frequencyFilter === freq}
              >
                {freq === 'all'
                  ? `All (${habits.length})`
                  : freq === 'daily'
                  ? 'Daily'
                  : 'Weekly'}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <SkeletonHabitCards count={4} tile />}

      {!loading && error && (
        <div className="glass-card">
          <EmptyState
            icon={Flame}
            title="Unable to Load Habits"
            description={`${error}. Make sure the FastAPI backend server is running on port 8000.`}
            actionLabel="Try Again"
            onAction={load}
          />
        </div>
      )}

      {!loading && !error && habits.length === 0 && (
        <div className="glass-card">
          <EmptyState
            icon={Flame}
            title="No Habits Added Yet"
            description="Create your first daily or weekly habit to start tracking streaks and discovering influence patterns with friends."
            actionLabel="Add Your First Habit"
            onAction={() => {
              setAddModalError('');
              setIsAddModalOpen(true);
            }}
          />
        </div>
      )}

      {!loading && !error && habits.length > 0 && filteredHabits.length === 0 && (
        <div className="glass-card">
          <EmptyState
            icon={Search}
            title="No Matching Habits"
            description={`No habits matched "${searchQuery}" with the "${frequencyFilter}" filter.`}
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setFrequencyFilter('all');
            }}
            compact
          />
        </div>
      )}

      {!loading && !error && filteredHabits.length > 0 && (
        <div className="habits-grid">
          {filteredHabits.map((habit) => {
            const doneToday =
              habit.completed_today || todayIds.includes(habit.id);
            const isSaving = pendingId === habit.id;
            return (
              <div
                className={`glass-card habit-tile ${
                  doneToday ? 'completed-today' : ''
                }`}
                key={habit.id}
              >
                <div className="habit-tile-top">
                  <HabitIconBadge
                    icon={habit.icon}
                    color={habit.color}
                    size={20}
                  />
                  <div className="habit-tile-actions">
                    <span
                      className={`habit-tile-status ${
                        doneToday ? 'done' : 'pending'
                      }`}
                    >
                      {doneToday ? 'Checked in' : 'Not yet'}
                    </span>
                    <button
                      type="button"
                      className="habit-action-btn edit"
                      onClick={() => {
                        setEditModalError('');
                        setHabitToEdit(habit);
                      }}
                      title={`Edit ${habit.name}`}
                      aria-label={`Edit ${habit.name}`}
                    >
                      <Pencil size={14} />
                    </button>
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
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="habit-tile-title-row">
                  <h3 title={habit.name}>{habit.name}</h3>
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
                  <div className="progress-bar" aria-hidden="true">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${habit.progress}%`,
                        background: habit.color || 'var(--primary-color)',
                      }}
                    />
                  </div>
                </div>

                <div className="habit-tile-footer">
                  <button
                    type="button"
                    className="btn-secondary btn-sm habit-edit-inline-btn"
                    onClick={() => {
                      setEditModalError('');
                      setHabitToEdit(habit);
                    }}
                    aria-label={`Edit details for ${habit.name}`}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`habit-checkin-btn ${
                      doneToday ? 'done' : 'active'
                    }`}
                    onClick={() => handleToggleCheckIn(habit.id)}
                    disabled={isSaving}
                    style={{ flex: 1 }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="spin-icon" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        {doneToday ? 'Done (Undo)' : 'Check In'}
                      </>
                    )}
                  </button>
                </div>
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
            style={{ minHeight: '215px' }}
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
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingHabit}
        apiError={deleteModalError}
      />
    </div>
  );
};

export default MyHabits;

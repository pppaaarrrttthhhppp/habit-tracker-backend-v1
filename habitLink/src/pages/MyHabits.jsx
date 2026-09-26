import React, { useEffect, useState } from 'react';
import { CheckCircle2, Flame, Plus } from 'lucide-react';
import { getHabits, getTodayCheckIns, logHabitCheckIn } from '../api';
import './Pages.css';

const MyHabits = () => {
  const [habits, setHabits] = useState([]);
  const [todayIds, setTodayIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const load = async () => {
    try {
      const [habitsData, todayData] = await Promise.all([getHabits(), getTodayCheckIns()]);
      setHabits(habitsData);
      setTodayIds(todayData.habit_ids || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCheckIn = async (habitId) => {
    if (todayIds.includes(habitId)) return;
    setPendingId(habitId);
    try {
      await logHabitCheckIn(habitId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  };

  const completedToday = todayIds.length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Habits</h1>
        <p>{completedToday}/{habits.length} checked in today · keep your streaks alive</p>
      </div>

      {loading && <p className="page-loading">Loading your habits…</p>}
      {!loading && error && <p className="page-error">{error}. Start the FastAPI server on port 8000.</p>}

      {!loading && !error && (
        habits.length ? (
          <div className="habits-grid">
            {habits.map((habit) => {
              const doneToday = todayIds.includes(habit.id);
              return (
                <div className="glass-card habit-tile" key={habit.id}>
                  <div className="habit-tile-top">
                    <div className="habit-tile-icon"><Flame size={18} /></div>
                    <span className={`habit-tile-status ${doneToday ? 'done' : 'pending'}`}>
                      {doneToday ? 'Checked in' : 'Not yet'}
                    </span>
                  </div>
                  <h3>{habit.name}</h3>
                  <div>
                    <div className="habit-tile-progress-label">
                      <span>{habit.completed}/{habit.target_days} days (7d)</span>
                      <span>{habit.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${habit.progress}%`, background: 'var(--primary-color)' }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`habit-checkin-btn ${doneToday ? 'done' : 'active'}`}
                    onClick={() => handleCheckIn(habit.id)}
                    disabled={doneToday || pendingId === habit.id}
                  >
                    <CheckCircle2 size={16} />
                    {doneToday ? 'Done for today' : pendingId === habit.id ? 'Saving…' : 'Check in'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card empty-state">
            <Plus size={28} />
            <p>No habits yet. Add one from the Home dashboard to get started.</p>
          </div>
        )
      )}
    </div>
  );
};

export default MyHabits;

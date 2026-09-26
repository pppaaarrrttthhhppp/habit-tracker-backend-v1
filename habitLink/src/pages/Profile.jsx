import React, { useEffect, useState } from 'react';
import { getUserStats, getHabits } from '../api';
import './Pages.css';

const Profile = () => {
  const [stats, setStats] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getUserStats(), getHabits()])
      .then(([statsData, habitsData]) => {
        setStats(statsData);
        setHabits(habitsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your account overview, based on your current habit and connection data.</p>
      </div>

      {loading && <p className="page-loading">Loading profile…</p>}
      {!loading && error && <p className="page-error">{error}. Start the FastAPI server on port 8000.</p>}

      {!loading && !error && stats && (
        <>
          <div className="glass-card profile-header">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(stats.display_name)}&background=c7d2fe&color=3730a3`}
              alt={stats.display_name}
              className="avatar"
            />
            <div>
              <h2>{stats.display_name}</h2>
              <p>User ID #{stats.user_id}</p>
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
                <strong style={{ fontSize: '16px' }}>{stats.top_influencer?.name || 'None yet'}</strong>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="section-header">
              <h3>Habits</h3>
            </div>
            {habits.length ? (
              <div className="profile-habit-list">
                {habits.map((habit) => (
                  <span className="profile-habit-chip" key={habit.id}>{habit.name}</span>
                ))}
              </div>
            ) : (
              <p className="text-muted">No habits added yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;

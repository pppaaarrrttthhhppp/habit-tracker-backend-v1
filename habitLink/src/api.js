// Shared API client for the HabitLink frontend.
// Every page pulls its data from these functions so there is a single
// source of truth for the backend base URL and endpoint paths.

export const API_URL = 'http://localhost:8000';

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed (${response.status})`);
  }
  return response.json();
}

export const getUserStats = () => request('/api/user/stats');
export const getHabits = () => request('/api/habits');
export const getTodayCheckIns = () => request('/api/check-ins/today');
export const getInfluencers = (limit = 5) => request(`/api/influencers?limit=${limit}`);
export const getPairingRecommendation = () => request('/api/recommendations/pairing');

export const logHabitCheckIn = (habitId) =>
  request('/api/habits/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habit_id: habitId }),
  });

export const createHabit = (payload) =>
  request('/api/habits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

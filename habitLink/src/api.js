// Shared API client for the HabitLink frontend.
// Every page pulls its data from these functions so there is a single
// source of truth for the backend base URL and endpoint paths.

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_URL = rawBaseUrl.replace(/\/+$/, '');

async function request(path, options = {}) {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Unable to reach backend at ${API_URL}. Ensure the FastAPI server is running on port 8000.`
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let message = `Request to ${path} failed (${response.status})`;
    if (data) {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        message = data.detail
          .map((err) => {
            const msg = err.msg ? err.msg.replace(/^Value error,\s*/i, '') : JSON.stringify(err);
            return msg;
          })
          .join(', ');
      } else if (typeof data.message === 'string') {
        message = data.message;
      }
    }
    throw new Error(message);
  }

  return data;
}

export const getUserStats = () => request('/api/user/stats');

export const getHabits = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.frequency && params.frequency !== 'all') {
    searchParams.set('frequency', params.frequency);
  }
  const query = searchParams.toString();
  return request(`/api/habits${query ? `?${query}` : ''}`);
};

export const getHabitById = (habitId) => request(`/api/habits/${habitId}`);

export const getTodayCheckIns = () => request('/api/check-ins/today');

export const getInfluencers = (limit = 5, habit = null) => {
  const searchParams = new URLSearchParams();
  if (limit) searchParams.set('limit', String(limit));
  if (habit && habit !== 'all') searchParams.set('habit', habit);
  return request(`/api/influencers?${searchParams.toString()}`);
};

export const getPairingRecommendation = (habit = null) => {
  const searchParams = new URLSearchParams();
  if (habit && habit !== 'all') searchParams.set('habit', habit);
  const query = searchParams.toString();
  return request(`/api/recommendations/pairing${query ? `?${query}` : ''}`);
};

export const getRecentActivity = (limit = 10) =>
  request(`/api/activity?limit=${encodeURIComponent(limit)}`);

export const logHabitCheckIn = (habitId, toggle = true) =>
  request('/api/habits/log', {
    method: 'POST',
    body: JSON.stringify({ habit_id: habitId, toggle }),
  });

export const toggleHabitCheckIn = (habitId) =>
  request(`/api/habits/${habitId}/toggle`, {
    method: 'POST',
  });

export const createHabit = (payload) =>
  request('/api/habits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateHabit = (habitId, payload) =>
  request(`/api/habits/${habitId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteHabit = (habitId) =>
  request(`/api/habits/${habitId}`, {
    method: 'DELETE',
  });

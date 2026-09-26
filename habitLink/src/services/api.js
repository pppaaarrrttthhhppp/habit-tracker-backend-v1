const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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
      `Network error connecting to backend (${API_BASE_URL}). Please ensure the FastAPI server is running.`
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
    let message = `Request failed with status ${response.status}`;
    if (data) {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        message = data.detail.map((err) => err.msg || JSON.stringify(err)).join(', ');
      } else if (data.message) {
        message = data.message;
      }
    }
    throw new Error(message);
  }

  return data;
}

export const habitApi = {
  getUserStats() {
    return request('/api/user/stats');
  },

  getHabits(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.frequency && params.frequency !== 'all') searchParams.set('frequency', params.frequency);
    const query = searchParams.toString();
    return request(`/habits${query ? `?${query}` : ''}`);
  },

  getHabitById(habitId) {
    return request(`/habits/${habitId}`);
  },

  createHabit(payload) {
    return request('/habits', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateHabit(habitId, payload) {
    return request(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteHabit(habitId) {
    return request(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  },

  toggleHabit(habitId) {
    return request(`/habits/${habitId}/toggle`, {
      method: 'POST',
    });
  },

  getTodayCheckIns() {
    return request('/api/check-ins/today');
  },

  getInfluencers(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.habit && params.habit !== 'all') searchParams.set('habit', params.habit);
    const query = searchParams.toString();
    return request(`/api/influencers${query ? `?${query}` : ''}`);
  },

  getPairingRecommendation(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.habit && params.habit !== 'all') searchParams.set('habit', params.habit);
    const query = searchParams.toString();
    return request(`/api/recommendations/pairing${query ? `?${query}` : ''}`);
  },

  getRecentActivity(limit = 10) {
    return request(`/api/activity?limit=${encodeURIComponent(limit)}`);
  },
};

export default habitApi;

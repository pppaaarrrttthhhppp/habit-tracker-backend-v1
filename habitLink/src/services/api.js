import {
  API_URL,
  getUserStats,
  getHabits,
  getHabitById,
  getTodayCheckIns,
  getInfluencers,
  getPairingRecommendation,
  getRecentActivity,
  logHabitCheckIn,
  toggleHabitCheckIn,
  createHabit,
  updateHabit,
  deleteHabit,
} from '../api';

export const API_BASE_URL = API_URL;

export const habitApi = {
  getUserStats,
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabit: toggleHabitCheckIn,
  getTodayCheckIns,
  getInfluencers: (params = {}) => getInfluencers(params.limit, params.habit),
  getPairingRecommendation: (params = {}) => getPairingRecommendation(params.habit),
  getRecentActivity,
  logHabitCheckIn,
};

export default habitApi;

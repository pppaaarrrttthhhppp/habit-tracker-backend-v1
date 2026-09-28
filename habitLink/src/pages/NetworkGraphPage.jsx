import React, { useEffect, useState } from 'react';
import { ChevronDown, Users, Sparkles, Clock } from 'lucide-react';
import NetworkGraph from '../components/NetworkGraph';
import { getHabits, getInfluencers } from '../api';
import '../components/Dashboard.css';
import './Pages.css';

const NetworkGraphPage = () => {
  const [habits, setHabits] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [habitFilter, setHabitFilter] = useState('all');

  useEffect(() => {
    getHabits()
      .then((data) => setHabits(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getInfluencers(20, habitFilter)
      .then((data) => setInfluencers(Array.isArray(data) ? data : []))
      .catch(() => setInfluencers([]));
  }, [habitFilter]);

  const topInfluencer = influencers[0];

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>Habit Influence Network</h1>
          <p>
            Explore how your check-ins align with your friend circle within a 48-hour
            temporal window.
          </p>
        </div>

        <div className="select-filter-wrapper">
          <select
            className="btn-filter-select"
            value={habitFilter}
            onChange={(e) => setHabitFilter(e.target.value)}
            aria-label="Filter network graph by habit"
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

      <div className="network-summary-strip">
        <div className="glass-card network-summary-item">
          <div className="icon-wrapper blue" aria-hidden="true">
            <Users size={18} />
          </div>
          <div>
            <span>Active Associations</span>
            <strong>{influencers.length} Friends</strong>
          </div>
        </div>

        <div className="glass-card network-summary-item">
          <div className="icon-wrapper purple" aria-hidden="true">
            <Sparkles size={18} />
          </div>
          <div>
            <span>Strongest Link</span>
            <strong>
              {topInfluencer
                ? `${topInfluencer.name} (${Math.round(topInfluencer.score * 100)}%)`
                : 'None yet'}
            </strong>
          </div>
        </div>

        <div className="glass-card network-summary-item">
          <div className="icon-wrapper success" aria-hidden="true">
            <Clock size={18} />
          </div>
          <div>
            <span>Observation Window</span>
            <strong>48 Hours</strong>
          </div>
        </div>
      </div>

      <div
        className="glass-card widget-card"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <NetworkGraph
          height={520}
          limit={20}
          habitFilter={habitFilter}
          onResetFilter={() => setHabitFilter('all')}
        />
      </div>
    </div>
  );
};

export default NetworkGraphPage;

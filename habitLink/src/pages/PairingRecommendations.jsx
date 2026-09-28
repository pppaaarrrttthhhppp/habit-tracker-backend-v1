import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Users, ChevronDown, Calendar, ArrowRight } from 'lucide-react';
import { getPairingRecommendation, getHabits } from '../api';
import { EmptyState, SkeletonStatCards } from '../components/UIComponents';
import { useToast } from '../components/Toast';
import '../components/Dashboard.css';
import './Pages.css';

const PairingRecommendations = ({ onNavigate }) => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [habits, setHabits] = useState([]);
  const [habitFilter, setHabitFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getHabits()
      .then((res) => setHabits(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPairingRecommendation(habitFilter);
      setData(res);
    } catch (err) {
      setError(err.message);
      toast.error(err.message, 'Failed to Load Recommendations');
    } finally {
      setLoading(false);
    }
  }, [habitFilter, toast]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const recommendation = data?.recommendation;
  const alternatives = Array.isArray(data?.alternatives)
    ? data.alternatives.slice(1)
    : [];

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>Pairing Recommendations</h1>
          <p>
            Based on your habit overlap and 48-hour check-in alignment with your
            connections.
          </p>
        </div>

        <div className="select-filter-wrapper">
          <select
            className="btn-filter-select"
            value={habitFilter}
            onChange={(e) => setHabitFilter(e.target.value)}
            aria-label="Filter recommendations by habit"
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

      {loading && <SkeletonStatCards count={2} />}

      {!loading && error && (
        <div className="glass-card">
          <EmptyState
            icon={Sparkles}
            title="Unable to Load Recommendations"
            description={`${error}. Ensure the FastAPI server is running on port 8000.`}
            actionLabel="Retry"
            onAction={loadRecommendations}
          />
        </div>
      )}

      {!loading && !error && !recommendation && (
        <div className="glass-card">
          <EmptyState
            icon={Sparkles}
            title={
              habitFilter !== 'all'
                ? `No Pairing Match for "${habitFilter}"`
                : 'No Pairing Recommendations Yet'
            }
            description={
              data?.message ||
              'Connect with a friend and check in to shared habits within 48 hours to receive personalized accountability partner recommendations.'
            }
            actionLabel={
              habitFilter !== 'all' ? 'Show All Habits' : 'Go to My Habits'
            }
            onAction={() => {
              if (habitFilter !== 'all') {
                setHabitFilter('all');
              } else {
                onNavigate?.('My Habits');
              }
            }}
          />
        </div>
      )}

      {!loading && !error && recommendation && (
        <div className="pairing-layout">
          <div className="glass-card pairing-card">
            <div className="pairing-top-banner">
              <span className="pairing-featured-tag">
                <Sparkles size={13} /> Top Accountability Match
              </span>
              <span className="pairing-match-badge">
                {recommendation.match_percentage ??
                  Math.round(recommendation.pairing_score * 100)}
                % match
              </span>
            </div>

            <div className="pairing-header">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  recommendation.name
                )}&background=c7d2fe&color=3730a3`}
                alt={recommendation.name}
                className="avatar"
              />
              <div>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#1e1b4b',
                    marginBottom: '4px',
                  }}
                >
                  Pair with {recommendation.name}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                  Best shared routine:{' '}
                  <strong style={{ color: '#312e81' }}>
                    {recommendation.similar_goal ||
                      recommendation.top_habit ||
                      'Running'}
                  </strong>
                </p>
              </div>
            </div>

            <div className="pairing-metrics">
              <div className="pairing-metric">
                <span>Influence Score</span>
                <strong>{Number(recommendation.score).toFixed(2)}</strong>
              </div>
              <div className="pairing-metric">
                <span>Pairing Score</span>
                <strong>{Number(recommendation.pairing_score).toFixed(2)}</strong>
              </div>
              <div className="pairing-metric">
                <span>Schedule Overlap</span>
                <strong>{recommendation.schedule_match || '4/5'} days</strong>
              </div>
            </div>

            <div className="pairing-explanation">
              <Sparkles
                size={15}
                style={{
                  marginRight: '6px',
                  verticalAlign: 'middle',
                  color: 'var(--primary-color)',
                }}
              />
              {recommendation.explanation}
            </div>

            <div className="pairing-card-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onNavigate?.('Network Graph')}
              >
                Inspect in Network Graph <ArrowRight size={15} />
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigate?.('My Habits')}
              >
                <Calendar size={15} /> Check In Today
              </button>
            </div>
          </div>

          {alternatives.length > 0 && (
            <div className="glass-card alternatives-card">
              <div className="section-header">
                <h3>
                  <Users size={18} color="#6366f1" /> Other Compatible Partners
                </h3>
              </div>

              <div className="alternatives-list">
                {alternatives.map((alt) => (
                  <div className="alternative-item" key={alt.id}>
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        alt.name
                      )}`}
                      alt={alt.name}
                      className="avatar"
                      style={{ width: '42px', height: '42px' }}
                    />
                    <div className="alternative-info">
                      <div className="alternative-title-row">
                        <h4>{alt.name}</h4>
                        <span className="match-pill">
                          {alt.match_percentage ??
                            Math.round(alt.pairing_score * 100)}
                          % match
                        </span>
                      </div>
                      <p>
                        Shared focus: <strong>{alt.top_habit}</strong> ·{' '}
                        {alt.schedule_match || '3/5'} aligned days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PairingRecommendations;

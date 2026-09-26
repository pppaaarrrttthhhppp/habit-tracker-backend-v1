import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getPairingRecommendation } from '../api';
import './Pages.css';

const PairingRecommendations = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPairingRecommendation()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const recommendation = data?.recommendation;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pairing Recommendations</h1>
        <p>Based on your habit overlap and check-in activity with your connections.</p>
      </div>

      {loading && <p className="page-loading">Finding your best habit partner…</p>}
      {!loading && error && <p className="page-error">{error}. Start the FastAPI server on port 8000.</p>}

      {!loading && !error && !recommendation && (
        <div className="glass-card empty-state">
          <Sparkles size={28} />
          <p>{data?.message || 'Connect with a friend to receive a pairing recommendation.'}</p>
        </div>
      )}

      {!loading && !error && recommendation && (
        <div className="glass-card pairing-card">
          <div className="pairing-header">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(recommendation.name)}&background=c7d2fe&color=3730a3`}
              alt={recommendation.name}
              className="avatar"
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e1b4b' }}>Pair with {recommendation.name}</h3>
                <span className="pairing-match-badge">{Math.round(recommendation.pairing_score * 100)}% match</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Recommended habit accountability partner</p>
            </div>
          </div>

          <div className="pairing-metrics">
            <div className="pairing-metric">
              <span>Influence score</span>
              <strong>{Number(recommendation.score).toFixed(2)}</strong>
            </div>
            <div className="pairing-metric">
              <span>Pairing score</span>
              <strong>{Number(recommendation.pairing_score).toFixed(2)}</strong>
            </div>
          </div>

          <div className="pairing-explanation">
            <Sparkles size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--primary-color)' }} />
            {recommendation.explanation}
          </div>
        </div>
      )}
    </div>
  );
};

export default PairingRecommendations;

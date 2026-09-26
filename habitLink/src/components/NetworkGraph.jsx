import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getInfluencers } from '../api';
import './NetworkGraph.css';

// Logical coordinate space for the SVG. The <svg> itself is responsive
// (width/height 100%) but every node position and drag calculation happens
// in this fixed viewBox space, which keeps the math simple.
const VIEW_W = 640;
const VIEW_H = 420;
const CENTER = { x: VIEW_W / 2, y: VIEW_H / 2 };
const RADIUS = Math.min(VIEW_W, VIEW_H) / 2 - 90;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2;
const DRAG_THRESHOLD = 4;

const scoreColor = (score) => {
  if (score >= 0.7) return { fill: '#6366f1', ring: '#4f46e5' };
  if (score >= 0.4) return { fill: '#a855f7', ring: '#9333ea' };
  return { fill: '#94a3b8', ring: '#64748b' };
};

const initials = (name) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const NetworkGraph = ({ height = 420, limit = 8 }) => {
  const svgRef = useRef(null);
  const [friends, setFriends] = useState([]);
  const [nodes, setNodes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const dragState = useRef({ id: null, lastX: 0, lastY: 0, moved: 0 });

  useEffect(() => {
    let cancelled = false;
    getInfluencers(limit)
      .then((data) => {
        if (cancelled) return;
        setFriends(data);
        const placed = {};
        data.forEach((friend, index) => {
          const angle = (index / Math.max(data.length, 1)) * Math.PI * 2 - Math.PI / 2;
          placed[friend.id] = {
            x: CENTER.x + RADIUS * Math.cos(angle),
            y: CENTER.y + RADIUS * Math.sin(angle),
          };
        });
        setNodes(placed);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const handlePointerMove = useCallback((event) => {
    const drag = dragState.current;
    if (!drag.id || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = VIEW_W / rect.width;
    const scaleY = VIEW_H / rect.height;
    const dx = (event.clientX - drag.lastX) * scaleX;
    const dy = (event.clientY - drag.lastY) * scaleY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    setNodes((prev) => {
      const current = prev[drag.id];
      if (!current) return prev;
      return {
        ...prev,
        [drag.id]: { x: current.x + dx / zoom, y: current.y + dy / zoom },
      };
    });
  }, [zoom]);

  const handlePointerUpRef = useRef(null);

  const handlePointerUp = useCallback(() => {
    const drag = dragState.current;
    if (drag.id && drag.moved < DRAG_THRESHOLD) {
      setSelectedId((prev) => (prev === drag.id ? null : drag.id));
    }
    dragState.current = { id: null, lastX: 0, lastY: 0, moved: 0 };
    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('mouseup', handlePointerUpRef.current);
  }, [handlePointerMove]);

  useEffect(() => {
    handlePointerUpRef.current = handlePointerUp;
  }, [handlePointerUp]);

  const startDrag = (event, id) => {
    event.preventDefault();
    dragState.current = { id, lastX: event.clientX, lastY: event.clientY, moved: 0 };
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUpRef.current);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(prev + direction * 0.1).toFixed(2))));
  };

  const selectedFriend = friends.find((friend) => friend.id === selectedId);

  return (
    <div className="network-graph">
      <div className="network-graph-controls">
        <div className="zoom-controls">
          <button type="button" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))} aria-label="Zoom out">
            <ZoomOut size={16} />
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))} aria-label="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button type="button" onClick={() => setZoom(1)} aria-label="Reset zoom">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="network-graph-canvas" style={{ height }} onWheel={handleWheel}>
        {loading && <p className="text-muted network-graph-message">Loading network…</p>}
        {!loading && error && <p className="text-muted network-graph-message">{error}. Start the FastAPI server on port 8000.</p>}
        {!loading && !error && !friends.length && (
          <p className="text-muted network-graph-message">No connections yet. Add friends to see your influence network.</p>
        )}

        {!loading && !error && !!friends.length && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            width="100%"
            height="100%"
            className="network-graph-svg"
          >
            <g transform={`translate(${CENTER.x} ${CENTER.y}) scale(${zoom}) translate(${-CENTER.x} ${-CENTER.y})`}>
              {friends.map((friend) => {
                const pos = nodes[friend.id] || CENTER;
                const width = 1.5 + friend.score * 9;
                return (
                  <line
                    key={`edge-${friend.id}`}
                    x1={CENTER.x}
                    y1={CENTER.y}
                    x2={pos.x}
                    y2={pos.y}
                    stroke={scoreColor(friend.score).fill}
                    strokeOpacity={0.35 + friend.score * 0.4}
                    strokeWidth={width}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Center "You" node */}
              <g>
                <circle cx={CENTER.x} cy={CENTER.y} r={38} fill="url(#you-gradient)" stroke="#ffffff" strokeWidth={4} />
                <text x={CENTER.x} y={CENTER.y + 5} textAnchor="middle" className="network-node-label you">You</text>
              </g>

              {friends.map((friend) => {
                const pos = nodes[friend.id] || CENTER;
                const colors = scoreColor(friend.score);
                const isSelected = selectedId === friend.id;
                return (
                  <g
                    key={friend.id}
                    transform={`translate(${pos.x} ${pos.y})`}
                    className="network-node"
                    onMouseDown={(event) => startDrag(event, friend.id)}
                  >
                    <circle
                      r={isSelected ? 30 : 26}
                      fill={colors.fill}
                      stroke={isSelected ? '#1e1b4b' : '#ffffff'}
                      strokeWidth={isSelected ? 3 : 3}
                    />
                    <text y={5} textAnchor="middle" className="network-node-label">{initials(friend.name)}</text>
                  </g>
                );
              })}

              <defs>
                <linearGradient id="you-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </g>
          </svg>
        )}
      </div>

      {selectedFriend && (
        <div className="network-graph-tooltip">
          <div>
            <h4>{selectedFriend.name}</h4>
            <p>Contagion score: <strong>{Number(selectedFriend.score).toFixed(2)}</strong></p>
          </div>
          <button type="button" className="network-graph-tooltip-close" onClick={() => setSelectedId(null)}>×</button>
        </div>
      )}

      <div className="network-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#6366f1' }} /> High influence (0.7+)</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#a855f7' }} /> Medium influence (0.4–0.7)</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#94a3b8' }} /> Low influence (&lt;0.4)</span>
        <span className="legend-item network-legend-hint">Drag nodes · scroll to zoom · click for details</span>
      </div>
    </div>
  );
};

export default NetworkGraph;

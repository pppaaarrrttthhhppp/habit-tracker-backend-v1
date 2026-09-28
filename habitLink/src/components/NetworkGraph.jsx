import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X, Share2, Sparkles } from 'lucide-react';
import { getInfluencers } from '../api';
import { SkeletonGraphLoader, EmptyState } from './UIComponents';
import './NetworkGraph.css';

const VIEW_W = 1000;
const VIEW_H = 650;

const CENTER = {
  x: VIEW_W / 2,
  y: VIEW_H / 2,
};

const RADIUS_X = 360;
const RADIUS_Y = 225;

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 1.8;
const DRAG_THRESHOLD = 4;

const scoreColor = (score) => {
  if (score >= 0.7) {
    return {
      fill: '#6366f1',
      ring: '#4338ca',
      soft: 'rgba(99, 102, 241, 0.18)',
      badgeBg: '#eef2ff',
    };
  }

  if (score >= 0.4) {
    return {
      fill: '#a855f7',
      ring: '#7e22ce',
      soft: 'rgba(168, 85, 247, 0.18)',
      badgeBg: '#faf5ff',
    };
  }

  return {
    fill: '#64748b',
    ring: '#475569',
    soft: 'rgba(100, 116, 139, 0.18)',
    badgeBg: '#f1f5f9',
  };
};

const initials = (name) =>
  (name || '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatPercent = (score) =>
  `${Math.round(Number(score || 0) * 100)}%`;

const getStrengthLabel = (score) => {
  if (score >= 0.7) return 'Strong';
  if (score >= 0.4) return 'Moderate';
  return 'Low';
};

const computeDefaultNodes = (visibleFriends) => {
  const placed = {};
  visibleFriends.forEach((friend, index) => {
    const angle =
      (index / Math.max(visibleFriends.length, 1)) * Math.PI * 2 - Math.PI / 2;
    placed[friend.id] = {
      x: CENTER.x + RADIUS_X * Math.cos(angle),
      y: CENTER.y + RADIUS_Y * Math.sin(angle),
    };
  });
  return placed;
};

const NetworkGraph = ({
  height = 420,
  limit = 8,
  habitFilter = 'all',
  onResetFilter,
}) => {
  const svgRef = useRef(null);

  const [friends, setFriends] = useState([]);
  const [nodes, setNodes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const dragState = useRef({
    id: null,
    lastX: 0,
    lastY: 0,
    moved: 0,
  });

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    getInfluencers(limit, habitFilter)
      .then((data) => {
        if (cancelled) return;

        const visibleFriends = Array.isArray(data) ? data : [];
        setFriends(visibleFriends);
        setNodes(computeDefaultNodes(visibleFriends));
        setSelectedId((prev) =>
          visibleFriends.some((f) => f.id === prev) ? prev : null
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Unable to load network data');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [limit, habitFilter]);

  useEffect(() => {
    if (!selectedId) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const handlePointerMove = useCallback(
    (event) => {
      const drag = dragState.current;
      if (!drag.id || !svgRef.current) return;

      const clientX =
        event.touches && event.touches.length > 0
          ? event.touches[0].clientX
          : event.clientX;
      const clientY =
        event.touches && event.touches.length > 0
          ? event.touches[0].clientY
          : event.clientY;

      const rect = svgRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const scaleX = VIEW_W / rect.width;
      const scaleY = VIEW_H / rect.height;

      const dx = (clientX - drag.lastX) * scaleX;
      const dy = (clientY - drag.lastY) * scaleY;

      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.lastX = clientX;
      drag.lastY = clientY;

      setNodes((prev) => {
        const current = prev[drag.id];
        if (!current) return prev;

        const nextX = Math.max(85, Math.min(VIEW_W - 85, current.x + dx / zoom));
        const nextY = Math.max(65, Math.min(VIEW_H - 115, current.y + dy / zoom));

        return {
          ...prev,
          [drag.id]: {
            x: nextX,
            y: nextY,
          },
        };
      });
    },
    [zoom]
  );

  const handlePointerUpRef = useRef(null);

  const handlePointerUp = useCallback(() => {
    const drag = dragState.current;

    if (drag.id && drag.moved < DRAG_THRESHOLD) {
      setSelectedId((prev) => (prev === drag.id ? null : drag.id));
    }

    dragState.current = {
      id: null,
      lastX: 0,
      lastY: 0,
      moved: 0,
    };

    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('mouseup', handlePointerUpRef.current);
    window.removeEventListener('touchmove', handlePointerMove);
    window.removeEventListener('touchend', handlePointerUpRef.current);
  }, [handlePointerMove]);

  useEffect(() => {
    handlePointerUpRef.current = handlePointerUp;
  }, [handlePointerUp]);

  const startDrag = (event, id) => {
    const isTouch = event.type === 'touchstart';
    if (!isTouch) {
      event.preventDefault();
    }

    const clientX = isTouch ? event.touches[0].clientX : event.clientX;
    const clientY = isTouch ? event.touches[0].clientY : event.clientY;

    dragState.current = {
      id,
      lastX: clientX,
      lastY: clientY,
      moved: 0,
    };

    if (isTouch) {
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUpRef.current);
    } else {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUpRef.current);
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    setZoom((prev) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(prev + direction * 0.1).toFixed(2)))
    );
  };

  const handleResetView = () => {
    setZoom(1);
    setNodes(computeDefaultNodes(friends));
  };

  const selectedFriend = friends.find((friend) => friend.id === selectedId);

  return (
    <div className="network-graph">
      {/* CONTROLS */}
      <div className="network-graph-controls">
        <div className="network-graph-title">
          <div className="network-graph-title-row">
            <span>Temporal Association Network</span>
            {friends.length > 0 && (
              <span className="network-count-pill">
                {friends.length} {friends.length === 1 ? 'connection' : 'connections'}
              </span>
            )}
          </div>
          <small>
            Observed check-ins within 48 hours ·{' '}
            {habitFilter && habitFilter !== 'all'
              ? `Filtered by "${habitFilter}"`
              : 'Showing strongest shared habits'}
          </small>
        </div>

        <div className="zoom-controls" role="group" aria-label="Graph zoom and layout controls">
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))
            }
            disabled={zoom <= MIN_ZOOM || loading || !friends.length}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>

          <span className="zoom-readout" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))
            }
            disabled={zoom >= MAX_ZOOM || loading || !friends.length}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>

          <button
            type="button"
            onClick={handleResetView}
            disabled={loading || !friends.length}
            aria-label="Reset zoom and layout"
            title="Reset zoom and layout"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* GRAPH CANVAS */}
      <div
        className="network-graph-canvas"
        style={{ height }}
        onWheel={handleWheel}
      >
        {loading && <SkeletonGraphLoader />}

        {!loading && error && (
          <div className="network-graph-state-wrap">
            <EmptyState
              icon={Share2}
              title="Unable to Load Network Graph"
              description={`${error}. Please make sure the FastAPI server is running on port 8000.`}
              compact
            />
          </div>
        )}

        {!loading && !error && !friends.length && (
          <div className="network-graph-state-wrap">
            <EmptyState
              icon={Share2}
              title={
                habitFilter && habitFilter !== 'all'
                  ? `No network links for "${habitFilter}" yet`
                  : 'No temporal associations found yet'
              }
              description={
                habitFilter && habitFilter !== 'all'
                  ? 'None of your friends have overlapping check-ins within 48 hours for this specific habit yet.'
                  : 'Temporal associations appear automatically when you and your friends check in to shared habits within a 48-hour window.'
              }
              actionLabel={
                habitFilter && habitFilter !== 'all' && onResetFilter
                  ? 'Show All Habits'
                  : undefined
              }
              onAction={
                habitFilter && habitFilter !== 'all' && onResetFilter
                  ? onResetFilter
                  : undefined
              }
              compact
            />
          </div>
        )}

        {!loading && !error && !!friends.length && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            width="100%"
            height="100%"
            className="network-graph-svg"
            role="img"
            aria-label="Interactive Habit Influence Network Graph"
          >
            <defs>
              <linearGradient
                id="you-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>

              <filter
                id="network-shadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="5"
                  stdDeviation="7"
                  floodOpacity="0.16"
                />
              </filter>

              <filter
                id="network-glow-filter"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="10"
                  floodColor="#6366f1"
                  floodOpacity="0.35"
                />
              </filter>
            </defs>

            <g
              transform={`translate(${CENTER.x} ${CENTER.y}) scale(${zoom}) translate(${-CENTER.x} ${-CENTER.y})`}
            >
              {/* Subtle reference orbit rings */}
              <ellipse
                cx={CENTER.x}
                cy={CENTER.y}
                rx={RADIUS_X * 0.55}
                ry={RADIUS_Y * 0.55}
                className="network-orbit-ring"
              />
              <ellipse
                cx={CENTER.x}
                cy={CENTER.y}
                rx={RADIUS_X}
                ry={RADIUS_Y}
                className="network-orbit-ring outer"
              />

              {/* CONNECTIONS */}
              {friends.map((friend) => {
                const pos = nodes[friend.id] || CENTER;
                const colors = scoreColor(friend.score);
                const isHighlighted =
                  selectedId === friend.id || hoveredId === friend.id;
                const isDimmed =
                  (selectedId && selectedId !== friend.id) ||
                  (hoveredId && hoveredId !== friend.id);

                const width =
                  (isHighlighted ? 4 : 2.5) + Number(friend.score || 0) * 8.5;

                const midX = CENTER.x + (pos.x - CENTER.x) * 0.54;
                const midY = CENTER.y + (pos.y - CENTER.y) * 0.54;

                return (
                  <g
                    key={`edge-${friend.id}`}
                    className={`network-edge-group ${
                      isHighlighted ? 'highlighted' : ''
                    } ${isDimmed ? 'dimmed' : ''}`}
                  >
                    {isHighlighted && (
                      <line
                        x1={CENTER.x}
                        y1={CENTER.y}
                        x2={pos.x}
                        y2={pos.y}
                        stroke={colors.fill}
                        strokeOpacity={0.2}
                        strokeWidth={width + 8}
                        strokeLinecap="round"
                      />
                    )}

                    <line
                      x1={CENTER.x}
                      y1={CENTER.y}
                      x2={pos.x}
                      y2={pos.y}
                      stroke={colors.fill}
                      strokeOpacity={
                        isHighlighted
                          ? 0.92
                          : 0.32 + Number(friend.score || 0) * 0.52
                      }
                      strokeWidth={width}
                      strokeLinecap="round"
                    />

                    {/* Edge percentage pill */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x={-24}
                        y={-11}
                        width={48}
                        height={22}
                        rx={11}
                        fill="rgba(255, 255, 255, 0.94)"
                        stroke={isHighlighted ? colors.fill : 'rgba(203, 213, 225, 0.85)'}
                        strokeWidth={isHighlighted ? 1.8 : 1}
                      />
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        className="network-edge-label"
                        fill={colors.ring}
                      >
                        {formatPercent(friend.score)}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* CENTER USER */}
              <g
                filter="url(#network-shadow)"
                className="network-center-node"
              >
                <circle
                  cx={CENTER.x}
                  cy={CENTER.y}
                  r={58}
                  fill="rgba(99, 102, 241, 0.12)"
                />
                <circle
                  cx={CENTER.x}
                  cy={CENTER.y}
                  r={46}
                  fill="url(#you-gradient)"
                  stroke="#ffffff"
                  strokeWidth={4.5}
                />

                <text
                  x={CENTER.x}
                  y={CENTER.y - 3}
                  textAnchor="middle"
                  className="network-node-label you"
                >
                  You
                </text>

                <text
                  x={CENTER.x}
                  y={CENTER.y + 16}
                  textAnchor="middle"
                  className="network-center-subtitle"
                >
                  Pallavi
                </text>
              </g>

              {/* FRIEND NODES */}
              {friends.map((friend) => {
                const pos = nodes[friend.id] || CENTER;
                const colors = scoreColor(friend.score);
                const isSelected = selectedId === friend.id;
                const isHovered = hoveredId === friend.id;
                const habitName =
                  friend.shared_habit || friend.top_habit || 'Shared habit';

                return (
                  <g
                    key={friend.id}
                    transform={`translate(${pos.x} ${pos.y})`}
                    className={`network-node ${isSelected ? 'selected' : ''} ${
                      isHovered ? 'hovered' : ''
                    }`}
                    onMouseDown={(event) => startDrag(event, friend.id)}
                    onTouchStart={(event) => startDrag(event, friend.id)}
                    onMouseEnter={() => setHoveredId(friend.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(friend.id)}
                    onBlur={() => setHoveredId(null)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId((prev) =>
                          prev === friend.id ? null : friend.id
                        );
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`${friend.name}, shared habit ${habitName}, ${formatPercent(
                      friend.score
                    )} temporal association. Press Enter for details.`}
                  >
                    {/* Soft glow */}
                    <circle
                      r={isSelected || isHovered ? 48 : 43}
                      fill={colors.soft}
                      className="network-node-glow"
                    />

                    {/* Selection dashed ring */}
                    {isSelected && (
                      <circle
                        r={41}
                        fill="none"
                        stroke={colors.ring}
                        strokeWidth={2}
                        strokeDasharray="5 3"
                      />
                    )}

                    {/* Main node */}
                    <circle
                      r={33}
                      fill={colors.fill}
                      stroke={isSelected ? '#1e1b4b' : '#ffffff'}
                      strokeWidth={isSelected ? 4 : 3}
                      filter={
                        isSelected || isHovered
                          ? 'url(#network-glow-filter)'
                          : 'url(#network-shadow)'
                      }
                    />

                    {/* Initials */}
                    <text
                      y={5}
                      textAnchor="middle"
                      className="network-node-label"
                    >
                      {initials(friend.name)}
                    </text>

                    {/* Label Card Plate for clean readability */}
                    <g transform="translate(0, 44)">
                      <rect
                        x={-72}
                        y={0}
                        width={144}
                        height={62}
                        rx={12}
                        fill="rgba(255, 255, 255, 0.92)"
                        stroke={
                          isSelected
                            ? colors.fill
                            : 'rgba(226, 232, 240, 0.9)'
                        }
                        strokeWidth={isSelected ? 1.8 : 1}
                      />
                      {/* Full name */}
                      <text
                        y={19}
                        textAnchor="middle"
                        className="network-friend-name"
                      >
                        {friend.name}
                      </text>

                      {/* Shared habit */}
                      <text
                        y={36}
                        textAnchor="middle"
                        className="network-friend-habit"
                      >
                        {habitName}
                      </text>

                      {/* Association percentage */}
                      <text
                        y={52}
                        textAnchor="middle"
                        className="network-friend-score"
                        fill={colors.ring}
                      >
                        {formatPercent(friend.score)} · {getStrengthLabel(friend.score)}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {/* SELECTED PERSON DETAILS */}
      {selectedFriend && (
        <div
          className="network-graph-tooltip"
          role="region"
          aria-label={`Details for ${selectedFriend.name}`}
        >
          <div className="network-tooltip-main">
            <div
              className="network-tooltip-avatar"
              style={{
                background: scoreColor(selectedFriend.score).fill,
              }}
            >
              {initials(selectedFriend.name)}
            </div>

            <div className="network-tooltip-body">
              <div className="network-tooltip-header-row">
                <h4>{selectedFriend.name}</h4>
                <span
                  className="network-strength-badge"
                  style={{
                    background: scoreColor(selectedFriend.score).badgeBg,
                    color: scoreColor(selectedFriend.score).ring,
                  }}
                >
                  <Sparkles size={12} />
                  {formatPercent(selectedFriend.score)} ·{' '}
                  {getStrengthLabel(selectedFriend.score)} Influence
                </span>
              </div>

              <p>
                Top shared habit:{' '}
                <strong>
                  {selectedFriend.shared_habit ||
                    selectedFriend.top_habit ||
                    '—'}
                </strong>
                {Array.isArray(selectedFriend.shared_habits) &&
                  selectedFriend.shared_habits.length > 1 && (
                    <span>
                      {' '}
                      (also shares:{' '}
                      {selectedFriend.shared_habits
                        .filter(
                          (h) =>
                            h !==
                            (selectedFriend.shared_habit ||
                              selectedFriend.top_habit)
                        )
                        .join(', ')}
                      )
                    </span>
                  )}
              </p>

              <p className="network-tooltip-evidence">
                {selectedFriend.following_instances != null &&
                selectedFriend.observed_instances != null ? (
                  <>
                    <strong>{selectedFriend.following_instances}</strong> of{' '}
                    <strong>{selectedFriend.observed_instances}</strong> observed
                    check-ins occurred within the{' '}
                    <strong>
                      {selectedFriend.observation_window_hours || 48}-hour
                    </strong>{' '}
                    window following {selectedFriend.name}&apos;s check-in.
                  </>
                ) : (
                  <>
                    Calculated from observed check-in alignment within the{' '}
                    <strong>
                      {selectedFriend.observation_window_hours || 48}-hour
                    </strong>{' '}
                    temporal window.
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="network-graph-tooltip-close"
            onClick={() => setSelectedId(null)}
            aria-label="Close friend details"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* LEGEND */}
      <div className="network-legend">
        <span className="legend-item">
          <span
            className="legend-dot"
            style={{ background: '#6366f1' }}
          />
          Strong · 70%+
        </span>

        <span className="legend-item">
          <span
            className="legend-dot"
            style={{ background: '#a855f7' }}
          />
          Moderate · 40–69%
        </span>

        <span className="legend-item">
          <span
            className="legend-dot"
            style={{ background: '#64748b' }}
          />
          Low · &lt;40%
        </span>

        <span className="legend-item network-legend-hint">
          Drag nodes · scroll to zoom · click or press Enter for evidence
        </span>
      </div>
    </div>
  );
};

export default NetworkGraph;
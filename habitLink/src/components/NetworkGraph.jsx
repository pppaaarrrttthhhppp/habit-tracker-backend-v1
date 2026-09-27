import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';
import { getInfluencers } from '../api';
import './NetworkGraph.css';

const VIEW_W = 1000;
const VIEW_H = 650;

const CENTER = {
  x: VIEW_W / 2,
  y: VIEW_H / 2,
};

const RADIUS_X = 365;
const RADIUS_Y = 235;

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 1.8;
const DRAG_THRESHOLD = 4;

const scoreColor = (score) => {
  if (score >= 0.7) {
    return {
      fill: '#6366f1',
      ring: '#4338ca',
      soft: 'rgba(99, 102, 241, 0.18)',
    };
  }

  if (score >= 0.4) {
    return {
      fill: '#a855f7',
      ring: '#7e22ce',
      soft: 'rgba(168, 85, 247, 0.18)',
    };
  }

  return {
    fill: '#64748b',
    ring: '#475569',
    soft: 'rgba(100, 116, 139, 0.18)',
  };
};

const initials = (name) =>
  name
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

const NetworkGraph = ({ height = 420, limit = 8, habitFilter = 'all' }) => {
  const svgRef = useRef(null);

  const [friends, setFriends] = useState([]);
  const [nodes, setNodes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

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

        const placed = {};

        visibleFriends.forEach((friend, index) => {
          /*
           * Start at the top and distribute friends around an ellipse.
           * The wider horizontal radius gives names and habit labels
           * enough room without clipping.
           */
          const angle =
            (index / Math.max(visibleFriends.length, 1)) *
              Math.PI *
              2 -
            Math.PI / 2;

          placed[friend.id] = {
            x: CENTER.x + RADIUS_X * Math.cos(angle),
            y: CENTER.y + RADIUS_Y * Math.sin(angle),
          };
        });

        setNodes(placed);
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

  const handlePointerMove = useCallback(
    (event) => {
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
          [drag.id]: {
            x: current.x + dx / zoom,
            y: current.y + dy / zoom,
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
      setSelectedId((prev) =>
        prev === drag.id ? null : drag.id
      );
    }

    dragState.current = {
      id: null,
      lastX: 0,
      lastY: 0,
      moved: 0,
    };

    window.removeEventListener(
      'mousemove',
      handlePointerMove
    );

    window.removeEventListener(
      'mouseup',
      handlePointerUpRef.current
    );
  }, [handlePointerMove]);

  useEffect(() => {
    handlePointerUpRef.current = handlePointerUp;
  }, [handlePointerUp]);

  const startDrag = (event, id) => {
    event.preventDefault();

    dragState.current = {
      id,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: 0,
    };

    window.addEventListener(
      'mousemove',
      handlePointerMove
    );

    window.addEventListener(
      'mouseup',
      handlePointerUpRef.current
    );
  };

  const handleWheel = (event) => {
    event.preventDefault();

    const direction = event.deltaY > 0 ? -1 : 1;

    setZoom((prev) =>
      Math.min(
        MAX_ZOOM,
        Math.max(
          MIN_ZOOM,
          +(prev + direction * 0.1).toFixed(2)
        )
      )
    );
  };

  const selectedFriend = friends.find(
    (friend) => friend.id === selectedId
  );

  return (
    <div className="network-graph">

      {/* -------------------------------------------------- */}
      {/* CONTROLS */}
      {/* -------------------------------------------------- */}
      <div className="network-graph-controls">
        <div className="network-graph-title">
          <span>Temporal Association Network</span>
          <small>
            Based on observed check-ins within 48 hours
          </small>
        </div>

        <div className="zoom-controls">
          <button
            type="button"
            onClick={() =>
              setZoom((z) =>
                Math.max(
                  MIN_ZOOM,
                  +(z - 0.1).toFixed(2)
                )
              )
            }
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <button
            type="button"
            onClick={() =>
              setZoom((z) =>
                Math.min(
                  MAX_ZOOM,
                  +(z + 0.1).toFixed(2)
                )
              )
            }
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label="Reset zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* GRAPH */}
      {/* -------------------------------------------------- */}
      <div
        className="network-graph-canvas"
        style={{ height }}
        onWheel={handleWheel}
      >
        {loading && (
          <p className="text-muted network-graph-message">
            Loading network…
          </p>
        )}

        {!loading && error && (
          <p className="text-muted network-graph-message">
            {error}. Start the FastAPI server on port 8000.
          </p>
        )}

        {!loading &&
          !error &&
          !friends.length && (
            <p className="text-muted network-graph-message">
              No temporal associations found yet.
            </p>
          )}

        {!loading &&
          !error &&
          !!friends.length && (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              width="100%"
              height="100%"
              className="network-graph-svg"
            >
              <defs>
                <linearGradient
                  id="you-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="#6366f1"
                  />
                  <stop
                    offset="100%"
                    stopColor="#a855f7"
                  />
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
              </defs>

              <g
                transform={`translate(${CENTER.x} ${CENTER.y}) scale(${zoom}) translate(${-CENTER.x} ${-CENTER.y})`}
              >

                {/* ------------------------------------------------ */}
                {/* CONNECTIONS */}
                {/* ------------------------------------------------ */}
                {friends.map((friend) => {
                  const pos =
                    nodes[friend.id] || CENTER;

                  const colors = scoreColor(
                    friend.score
                  );

                  const width =
                    2.5 +
                    Number(friend.score || 0) * 9;

                  return (
                    <g key={`edge-${friend.id}`}>
                      <line
                        x1={CENTER.x}
                        y1={CENTER.y}
                        x2={pos.x}
                        y2={pos.y}
                        stroke={colors.fill}
                        strokeOpacity={
                          0.3 +
                          Number(friend.score || 0) *
                            0.55
                        }
                        strokeWidth={width}
                        strokeLinecap="round"
                      />

                      {/* Small percentage marker near edge */}
                      <text
                        x={
                          CENTER.x +
                          (pos.x - CENTER.x) * 0.58
                        }
                        y={
                          CENTER.y +
                          (pos.y - CENTER.y) * 0.58
                        }
                        textAnchor="middle"
                        className="network-edge-label"
                      >
                        {formatPercent(friend.score)}
                      </text>
                    </g>
                  );
                })}

                {/* ------------------------------------------------ */}
                {/* CENTER USER */}
                {/* ------------------------------------------------ */}
                <g
                  filter="url(#network-shadow)"
                  className="network-center-node"
                >
                  <circle
                    cx={CENTER.x}
                    cy={CENTER.y}
                    r={48}
                    fill="url(#you-gradient)"
                    stroke="#ffffff"
                    strokeWidth={5}
                  />

                  <text
                    x={CENTER.x}
                    y={CENTER.y - 2}
                    textAnchor="middle"
                    className="network-node-label you"
                  >
                    You
                  </text>

                  <text
                    x={CENTER.x}
                    y={CENTER.y + 18}
                    textAnchor="middle"
                    className="network-center-subtitle"
                  >
                    Pallavi
                  </text>
                </g>

                {/* ------------------------------------------------ */}
                {/* FRIEND NODES */}
                {/* ------------------------------------------------ */}
                {friends.map((friend) => {
                  const pos =
                    nodes[friend.id] || CENTER;

                  const colors = scoreColor(
                    friend.score
                  );

                  const isSelected =
                    selectedId === friend.id;

                  return (
                    <g
                      key={friend.id}
                      transform={`translate(${pos.x} ${pos.y})`}
                      className={`network-node ${
                        isSelected
                          ? 'selected'
                          : ''
                      }`}
                      onMouseDown={(event) =>
                        startDrag(event, friend.id)
                      }
                    >
                      {/* Soft glow */}
                      <circle
                        r={47}
                        fill={colors.soft}
                        className="network-node-glow"
                      />

                      {/* Main node */}
                      <circle
                        r={34}
                        fill={colors.fill}
                        stroke={
                          isSelected
                            ? '#1e1b4b'
                            : '#ffffff'
                        }
                        strokeWidth={
                          isSelected ? 4 : 3
                        }
                        filter="url(#network-shadow)"
                      />

                      {/* Initials */}
                      <text
                        y={6}
                        textAnchor="middle"
                        className="network-node-label"
                      >
                        {initials(friend.name)}
                      </text>

                      {/* Full name */}
                      <text
                        y={62}
                        textAnchor="middle"
                        className="network-friend-name"
                      >
                        {friend.name}
                      </text>

                      {/* Shared habit */}
                      <text
                        y={82}
                        textAnchor="middle"
                        className="network-friend-habit"
                      >
                        {friend.shared_habit ||
                          friend.top_habit ||
                          'Shared habit'}
                      </text>

                      {/* Association percentage */}
                      <text
                        y={104}
                        textAnchor="middle"
                        className="network-friend-score"
                        fill={colors.ring}
                      >
                        {formatPercent(
                          friend.score
                        )}{' '}
                        association
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
      </div>

      {/* -------------------------------------------------- */}
      {/* SELECTED PERSON DETAILS */}
      {/* -------------------------------------------------- */}
      {selectedFriend && (
        <div className="network-graph-tooltip">
          <div className="network-tooltip-main">
            <div
              className="network-tooltip-avatar"
              style={{
                background:
                  scoreColor(
                    selectedFriend.score
                  ).fill,
              }}
            >
              {initials(selectedFriend.name)}
            </div>

            <div>
              <h4>{selectedFriend.name}</h4>

              <p>
                Shared habit:{' '}
                <strong>
                  {selectedFriend.shared_habit ||
                    selectedFriend.top_habit ||
                    '—'}
                </strong>
              </p>

              <p>
                Temporal association:{' '}
                <strong>
                  {formatPercent(
                    selectedFriend.score
                  )}
                </strong>{' '}
                ·{' '}
                {getStrengthLabel(
                  selectedFriend.score
                )}
              </p>

              <p>
                {selectedFriend.following_instances ||
                  0}{' '}
                of{' '}
                {selectedFriend.observed_instances ||
                  0}{' '}
                observed instances occurred within
                the 48-hour window after this person's
                check-in.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="network-graph-tooltip-close"
            onClick={() => setSelectedId(null)}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* LEGEND */}
      {/* -------------------------------------------------- */}
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
          Drag nodes · scroll to zoom · click for
          evidence
        </span>
      </div>
    </div>
  );
};

export default NetworkGraph;
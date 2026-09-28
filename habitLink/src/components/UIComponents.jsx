import React from 'react';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}) => (
  <div className={`empty-state-box ${compact ? 'compact' : ''}`} role="region" aria-label={title}>
    {Icon && (
      <div className="empty-state-icon-badge" aria-hidden="true">
        <Icon size={compact ? 22 : 28} strokeWidth={2.1} />
      </div>
    )}
    <div className="empty-state-text">
      <h4>{title}</h4>
      {description && <p>{description}</p>}
    </div>
    {(actionLabel || secondaryActionLabel) && (
      <div className="empty-state-actions">
        {actionLabel && onAction && (
          <button type="button" className="btn-primary btn-sm" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button type="button" className="btn-secondary btn-sm" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </button>
        )}
      </div>
    )}
  </div>
);

export const SkeletonStatCards = ({ count = 4 }) => (
  <div className="stats-grid" aria-busy="true" aria-label="Loading statistics">
    {Array.from({ length: count }).map((_, i) => (
      <div className="glass-card stat-card skeleton-card" key={i}>
        <div className="stat-header">
          <div className="skeleton-line" style={{ width: '55%', height: '14px' }} />
          <div className="skeleton-circle" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
        </div>
        <div className="skeleton-line" style={{ width: '42%', height: '32px', marginBottom: '10px' }} />
        <div className="skeleton-line" style={{ width: '70%', height: '12px' }} />
      </div>
    ))}
  </div>
);

export const SkeletonHabitCards = ({ count = 4, tile = false }) => (
  <div className={tile ? 'habits-grid' : 'habits-list'} aria-busy="true" aria-label="Loading habits">
    {Array.from({ length: count }).map((_, i) => (
      <div className={tile ? 'glass-card habit-tile skeleton-card' : 'habit-card skeleton-card'} key={i}>
        <div className="habit-card-top">
          <div className="skeleton-circle" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
          <div className="skeleton-line" style={{ width: '56px', height: '20px', borderRadius: '10px' }} />
        </div>
        <div style={{ marginTop: '6px' }}>
          <div className="skeleton-line" style={{ width: '75%', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton-line" style={{ width: '50%', height: '12px' }} />
        </div>
        <div className="skeleton-line" style={{ width: '100%', height: '6px', borderRadius: '4px', marginTop: '6px' }} />
        <div className="skeleton-line" style={{ width: '100%', height: '34px', borderRadius: '10px', marginTop: '8px' }} />
      </div>
    ))}
  </div>
);

export const SkeletonSideList = ({ rows = 3 }) => (
  <div className="side-widgets" aria-busy="true" aria-label="Loading list">
    {Array.from({ length: rows }).map((_, i) => (
      <div className="side-widget-item" key={i}>
        <div className="skeleton-circle" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
        <div className="item-info">
          <div className="skeleton-line" style={{ width: '65%', height: '13px', marginBottom: '6px' }} />
          <div className="skeleton-line" style={{ width: '45%', height: '11px' }} />
        </div>
        <div className="skeleton-line" style={{ width: '36px', height: '22px', borderRadius: '8px' }} />
      </div>
    ))}
  </div>
);

export const SkeletonGraphLoader = () => (
  <div className="skeleton-graph-wrap" aria-busy="true" aria-label="Loading habit influence network">
    <div className="skeleton-graph-orbit">
      <div className="skeleton-graph-node center" />
      <div className="skeleton-graph-node n1" />
      <div className="skeleton-graph-node n2" />
      <div className="skeleton-graph-node n3" />
      <div className="skeleton-graph-node n4" />
    </div>
    <p className="skeleton-graph-caption">Mapping temporal associations…</p>
  </div>
);

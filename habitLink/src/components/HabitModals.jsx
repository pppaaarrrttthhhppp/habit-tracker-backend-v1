import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Flame,
  Activity,
  Heart,
  BookOpen,
  Brain,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

export const HABIT_ICON_OPTIONS = [
  { id: 'check', label: 'Check-in', color: '#0ea5e9', Icon: Check },
  { id: 'flame', label: 'Streak', color: '#f97316', Icon: Flame },
  { id: 'activity', label: 'Fitness', color: '#6366f1', Icon: Activity },
  { id: 'heart', label: 'Wellness', color: '#ec4899', Icon: Heart },
  { id: 'book', label: 'Reading', color: '#f59e0b', Icon: BookOpen },
  { id: 'brain', label: 'Mindful', color: '#8b5cf6', Icon: Brain },
];

export const HabitIconBadge = ({ icon, color = '#6366f1', size = 18 }) => {
  const normalized = (icon || 'check').toLowerCase().trim();
  const match =
    HABIT_ICON_OPTIONS.find((item) => item.id === normalized) ||
    HABIT_ICON_OPTIONS[0];
  const IconComponent = match.Icon;
  const badgeColor = color || match.color;

  return (
    <div
      className="habit-icon"
      style={{
        background: `${badgeColor}1f`,
        color: badgeColor,
      }}
    >
      <IconComponent size={size} strokeWidth={2.4} />
    </div>
  );
};

export const AddHabitModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  apiError = '',
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('check');
  const [frequency, setFrequency] = useState('daily');
  const [validationError, setValidationError] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setIcon('check');
      setFrequency('daily');
      setValidationError('');
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError('Please enter a habit name.');
      nameInputRef.current?.focus();
      return;
    }
    if (trimmed.length > 120) {
      setValidationError('Habit name must be 120 characters or fewer.');
      nameInputRef.current?.focus();
      return;
    }
    if (!['daily', 'weekly'].includes(frequency)) {
      setValidationError('Please select a valid frequency (Daily or Weekly).');
      return;
    }
    setValidationError('');
    await onSubmit({
      name: trimmed,
      icon,
      frequency,
    });
  };

  const displayError = validationError || apiError;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-habit-modal-title"
    >
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3 id="add-habit-modal-title">Add New Habit</h3>
            <p>Create a habit to track daily or weekly across your network.</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {displayError && (
          <div className="modal-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="habit-name-input">Habit Name *</label>
            <input
              id="habit-name-input"
              ref={nameInputRef}
              type="text"
              className={`form-input ${validationError ? 'input-error' : ''}`}
              placeholder="e.g., Morning Yoga, Hydration, Read 20 Mins"
              value={name}
              maxLength={120}
              disabled={isSubmitting}
              onChange={(e) => {
                setName(e.target.value);
                if (validationError) setValidationError('');
              }}
            />
          </div>

          <div className="form-group">
            <label>Choose an Icon</label>
            <div className="icon-picker-grid">
              {HABIT_ICON_OPTIONS.map((option) => {
                const SelectedIcon = option.Icon;
                const isSelected = icon === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`icon-picker-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setIcon(option.id)}
                    disabled={isSubmitting}
                    style={
                      isSelected
                        ? {
                            borderColor: option.color,
                            background: `${option.color}15`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="icon-picker-circle"
                      style={{
                        background: `${option.color}22`,
                        color: option.color,
                      }}
                    >
                      <SelectedIcon size={16} strokeWidth={2.4} />
                    </span>
                    <span className="icon-picker-label">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="habit-frequency-select">Frequency</label>
            <div className="frequency-selector-grid">
              <button
                type="button"
                className={`frequency-option-card ${frequency === 'daily' ? 'selected' : ''}`}
                onClick={() => setFrequency('daily')}
                disabled={isSubmitting}
              >
                <Calendar size={16} />
                <div>
                  <strong>Daily</strong>
                  <span>Target: 7 days / week</span>
                </div>
              </button>
              <button
                type="button"
                className={`frequency-option-card ${frequency === 'weekly' ? 'selected' : ''}`}
                onClick={() => setFrequency('weekly')}
                disabled={isSubmitting}
              >
                <Calendar size={16} />
                <div>
                  <strong>Weekly</strong>
                  <span>Target: 5 days / week</span>
                </div>
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary modal-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  Adding Habit…
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Habit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DeleteHabitModal = ({
  habit,
  onClose,
  onConfirm,
  isDeleting = false,
  apiError = '',
}) => {
  if (!habit) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-habit-modal-title"
    >
      <div className="modal-card modal-card-compact">
        <div className="modal-header">
          <div className="delete-modal-title-row">
            <div className="delete-warning-icon">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 id="delete-habit-modal-title">Remove Habit?</h3>
              <p>This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close confirmation modal"
          >
            <X size={18} />
          </button>
        </div>

        <p className="delete-modal-body">
          Are you sure you want to remove <strong>"{habit.name || habit.title}"</strong>? Its check-in history and progress will be permanently deleted.
        </p>

        {apiError && (
          <div className="modal-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{apiError}</span>
          </div>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger modal-submit-btn"
            onClick={() => onConfirm(habit)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                Removing…
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Remove Habit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

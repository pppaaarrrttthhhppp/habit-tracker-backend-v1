import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastCounter = 0;

const ToastItem = ({ toast, onDismiss }) => {
  const { id, type = 'info', title, message, duration = 4200 } = toast;
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 220);
  }, [id, onDismiss]);

  useEffect(() => {
    if (duration <= 0) return undefined;
    timerRef.current = setTimeout(handleClose, duration);
    return () => clearTimeout(timerRef.current);
  }, [duration, handleClose]);

  const pauseTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const resumeTimer = () => {
    if (duration > 0) {
      timerRef.current = setTimeout(handleClose, 2000);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} strokeWidth={2.4} />;
      case 'error':
        return <AlertCircle size={18} strokeWidth={2.4} />;
      default:
        return <Info size={18} strokeWidth={2.4} />;
    }
  };

  const defaultTitle =
    type === 'success' ? 'Success' : type === 'error' ? 'Action Failed' : 'Notification';

  return (
    <div
      className={`toast-card toast-${type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      role={type === 'error' ? 'alert' : 'status'}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      <div className="toast-icon-wrap">{getIcon()}</div>
      <div className="toast-content">
        <div className="toast-title">{title || defaultTitle}</div>
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={handleClose}
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback((options) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const newToast =
      typeof options === 'string'
        ? { id, type: 'info', message: options }
        : { id, ...options };

    setToasts((prev) => [...prev.slice(-4), newToast]);
    return id;
  }, []);

  const toastApi = useMemo(
    () => ({
      show: (options) => addToast(options),
      success: (message, title = 'Success') =>
        addToast({ type: 'success', title, message }),
      error: (message, title = 'Something went wrong') =>
        addToast({ type: 'error', title, message, duration: 5500 }),
      info: (message, title = 'Update') =>
        addToast({ type: 'info', title, message }),
      dismiss: dismissToast,
    }),
    [addToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
};

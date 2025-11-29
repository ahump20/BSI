'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

/**
 * Toast Notification System
 *
 * Features:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Stack management (max 5 toasts)
 * - Smooth animations
 * - Accessible (aria-live announcements)
 * - Action buttons support
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const DEFAULT_DURATION = 5000;
const MAX_TOASTS = 5;

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${++toastCounter}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? DEFAULT_DURATION,
      dismissible: toast.dismissible ?? true,
    };

    setToasts(prev => {
      // Remove oldest if we're at max
      const updated = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
      return [...updated, newToast];
    });

    // Auto-dismiss
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => removeToast(id), newToast.duration);
    }

    return id;
  }, [removeToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string) =>
    addToast({ type: 'success', title, message }), [addToast]);

  const error = useCallback((title: string, message?: string) =>
    addToast({ type: 'error', title, message, duration: 8000 }), [addToast]);

  const warning = useCallback((title: string, message?: string) =>
    addToast({ type: 'warning', title, message }), [addToast]);

  const info = useCallback((title: string, message?: string) =>
    addToast({ type: 'info', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      clearAll,
      success,
      error,
      warning,
      info
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
          index={index}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
  index,
}: {
  toast: Toast;
  onDismiss: () => void;
  index: number;
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // Progress bar animation
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`toast toast-${toast.type} ${isExiting ? 'toast-exiting' : 'toast-entering'}`}
      style={{ '--toast-index': index } as React.CSSProperties}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="toast-icon">
        {TOAST_ICONS[toast.type]}
      </div>

      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && (
          <div className="toast-message">{toast.message}</div>
        )}
        {toast.action && (
          <button
            className="toast-action"
            onClick={() => {
              toast.action!.onClick();
              handleDismiss();
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {toast.dismissible && (
        <button
          className="toast-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="toast-progress">
          <div
            className="toast-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Standalone toast functions for use outside React components
let globalAddToast: ((toast: Omit<Toast, 'id'>) => string) | null = null;

export function setGlobalToastHandler(handler: (toast: Omit<Toast, 'id'>) => string) {
  globalAddToast = handler;
}

export function toast(toast: Omit<Toast, 'id'>): string | null {
  if (globalAddToast) {
    return globalAddToast(toast);
  }
  console.warn('Toast provider not initialized');
  return null;
}

export const toastSuccess = (title: string, message?: string) =>
  toast({ type: 'success', title, message });

export const toastError = (title: string, message?: string) =>
  toast({ type: 'error', title, message, duration: 8000 });

export const toastWarning = (title: string, message?: string) =>
  toast({ type: 'warning', title, message });

export const toastInfo = (title: string, message?: string) =>
  toast({ type: 'info', title, message });

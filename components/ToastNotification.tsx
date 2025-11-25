'use client';

/**
 * BLAZE SPORTS INTEL - Toast Notification System
 * ==============================================
 * Modern toast notifications with animations
 * Features: Auto-dismiss, stacking, action buttons, progress bar
 *
 * Last Updated: 2025-11-24
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, AlertTriangle, Info, X, Loader2
} from 'lucide-react';

// ==================== TYPES ====================

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
  clearToasts: () => void;
}

// ==================== CONTEXT ====================

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ==================== PROVIDER ====================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 11);
    const newToast: Toast = {
      id,
      duration: toast.type === 'loading' ? 0 : 5000,
      dismissible: true,
      ...toast,
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, updateToast, clearToasts }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// ==================== TOAST CONTAINER ====================

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ==================== TOAST ITEM ====================

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  error: <XCircle className="w-5 h-5 text-red-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  info: <Info className="w-5 h-5 text-blue-400" />,
  loading: <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />,
};

const bgColorMap: Record<ToastType, string> = {
  success: 'from-emerald-900/90 to-emerald-950/90 border-emerald-500/30',
  error: 'from-red-900/90 to-red-950/90 border-red-500/30',
  warning: 'from-amber-900/90 to-amber-950/90 border-amber-500/30',
  info: 'from-blue-900/90 to-blue-950/90 border-blue-500/30',
  loading: 'from-orange-900/90 to-orange-950/90 border-orange-500/30',
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
        setProgress(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          onDismiss(toast.id);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [toast.duration, toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`
        pointer-events-auto min-w-[320px] max-w-[420px] overflow-hidden
        rounded-xl border bg-gradient-to-br backdrop-blur-xl shadow-2xl
        ${bgColorMap[toast.type]}
      `}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <span className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">{toast.title}</h3>
            {toast.description && (
              <p className="mt-1 text-sm text-white/70">{toast.description}</p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
              >
                {toast.action.label} →
              </button>
            )}
          </div>

          {/* Dismiss Button */}
          {toast.dismissible && (
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-black/20">
          <motion.div
            className="h-full bg-white/30"
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ==================== CONVENIENCE FUNCTIONS ====================

/**
 * Convenience hook for common toast patterns
 */
export function useToastHelpers() {
  const { addToast, removeToast, updateToast } = useToast();

  const toast = {
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),

    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description, duration: 8000 }),

    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),

    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),

    loading: (title: string, description?: string) =>
      addToast({ type: 'loading', title, description, dismissible: false }),

    promise: async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: any) => string);
      }
    ): Promise<T> => {
      const id = addToast({
        type: 'loading',
        title: messages.loading,
        dismissible: false,
      });

      try {
        const data = await promise;
        updateToast(id, {
          type: 'success',
          title: typeof messages.success === 'function'
            ? messages.success(data)
            : messages.success,
          dismissible: true,
          duration: 5000,
        });
        return data;
      } catch (err) {
        updateToast(id, {
          type: 'error',
          title: typeof messages.error === 'function'
            ? messages.error(err)
            : messages.error,
          dismissible: true,
          duration: 8000,
        });
        throw err;
      }
    },

    dismiss: removeToast,
  };

  return toast;
}

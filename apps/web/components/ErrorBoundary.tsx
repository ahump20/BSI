'use client';

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React component errors
 * Prevents entire app crashes and provides graceful fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary when resetKeys change
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  resetError?: () => void;
}

/**
 * Default error fallback UI
 * Displays user-friendly error message with optional retry
 */
function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 border border-red-200 bg-red-50 rounded-lg"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-red-600 text-4xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-red-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-red-700 mb-4 text-center max-w-md">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      {resetError && (
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

interface ApiErrorDisplayProps {
  error: Error | string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * API-specific error display component
 * Shows user-friendly messages for common API errors
 */
export function ApiErrorDisplay({
  error,
  title = 'Failed to load data',
  onRetry,
  className = ''
}: ApiErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Parse common API error patterns
  const isNetworkError = errorMessage.toLowerCase().includes('network') ||
                        errorMessage.toLowerCase().includes('fetch');
  const isTimeoutError = errorMessage.toLowerCase().includes('timeout');
  const isRateLimited = errorMessage.toLowerCase().includes('rate limit');

  let userMessage = errorMessage;
  if (isNetworkError) {
    userMessage = 'Unable to connect to the server. Please check your internet connection.';
  } else if (isTimeoutError) {
    userMessage = 'The request took too long to complete. Please try again.';
  } else if (isRateLimited) {
    userMessage = 'Too many requests. Please wait a moment before trying again.';
  }

  return (
    <section
      className={`p-6 border border-orange-200 bg-orange-50 rounded-lg ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="text-orange-500 text-2xl flex-shrink-0">⚡</div>
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 mb-1">{title}</h3>
          <p className="text-orange-800 text-sm mb-3">{userMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

interface AsyncErrorWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Simple wrapper for async content with error handling
 * Use with Suspense for complete async pattern
 */
export function AsyncErrorWrapper({ children, fallback }: AsyncErrorWrapperProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

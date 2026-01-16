/**
 * BSI Auth Hook
 *
 * Provides authentication state and user data for protected pages.
 * Checks both localStorage token and cookie, validates via /api/auth/session.
 *
 * Usage:
 *   const { user, isLoading, isAuthenticated, logout } = useAuth();
 *   const { user, isLoading, isAuthenticated } = useAuth({ required: true }); // auto-redirects if not logged in
 *
 * @version 1.0.0
 * @updated 2025-01-14
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  tier: 'free' | 'pro' | 'enterprise';
  memberSince: string;
}

export interface AuthSubscription {
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  subscription: AuthSubscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface UseAuthOptions {
  /** If true, redirects to login when not authenticated */
  required?: boolean;
  /** Custom redirect path (default: /login) */
  loginPath?: string;
  /** Include reason in redirect query param */
  redirectReason?: string;
}

export function useAuth(options: UseAuthOptions = {}): AuthState & {
  logout: () => void;
  refreshSession: () => Promise<void>;
} {
  const { required = false, loginPath = '/login', redirectReason } = options;
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    subscription: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const checkSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get token from localStorage (client-side) or let the API check cookies
      const token = typeof window !== 'undefined' ? localStorage.getItem('bsi_token') : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Session check failed');
      }

      const data = (await response.json()) as {
        authenticated: boolean;
        user: AuthUser | null;
        subscription: AuthSubscription | null;
        error?: string;
      };

      if (data.authenticated && data.user) {
        setState({
          user: data.user,
          subscription: data.subscription,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        // Not authenticated
        setState({
          user: null,
          subscription: null,
          isLoading: false,
          isAuthenticated: false,
          error: data.error || null,
        });

        // Redirect if required
        if (required) {
          const redirectUrl = redirectReason
            ? `${loginPath}?redirect=${encodeURIComponent(window.location.pathname)}&reason=${redirectReason}`
            : `${loginPath}?redirect=${encodeURIComponent(window.location.pathname)}`;
          router.push(redirectUrl);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setState({
        user: null,
        subscription: null,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });

      if (required) {
        router.push(`${loginPath}?reason=error`);
      }
    }
  }, [required, loginPath, redirectReason, router]);

  const logout = useCallback(() => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bsi_token');
    }

    // Clear cookie by setting expired date
    document.cookie = 'bsi_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

    // Reset state
    setState({
      user: null,
      subscription: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });

    // Redirect to login
    router.push('/login');
  }, [router]);

  const refreshSession = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  // Initial session check
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return {
    ...state,
    logout,
    refreshSession,
  };
}

/**
 * Higher-order component to protect routes
 * Wraps a component and ensures user is authenticated before rendering
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P & { user: AuthUser }>,
  options: UseAuthOptions = {}
): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth({ required: true, ...options });

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-midnight">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
            <p className="text-text-tertiary text-sm">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      return null; // Will redirect via useAuth
    }

    return <Component {...props} user={user} />;
  };
}

export default useAuth;

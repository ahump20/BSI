/**
 * BSI UI Store - Interface State Management
 *
 * Manages navigation, modals, preferences, and global UI state
 * Mobile-first responsive design considerations built-in
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'burnt-orange' | 'charcoal' | 'midnight';

export interface ModalConfig {
  id: string;
  component: string;
  props?: Record<string, unknown>;
  dismissable?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ToastConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NavigationState {
  currentPath: string;
  previousPath: string | null;
  breadcrumbs: Array<{ label: string; href: string }>;
  isTransitioning: boolean;
}

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  recentCommands: string[];
}

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  activeSection: string | null;
}

export interface Preferences {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  reducedMotion: boolean;
  compactMode: boolean;
  showLiveIndicators: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  timezone: string;
  dateFormat: 'US' | 'ISO' | 'EU';
  sound: boolean;
  notifications: {
    gameStart: boolean;
    scoreUpdate: boolean;
    gameEnd: boolean;
    breakingNews: boolean;
  };
}

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface UIState {
  // Navigation
  navigation: NavigationState;

  // Modals
  modals: ModalConfig[];

  // Toasts
  toasts: ToastConfig[];

  // Command Palette
  commandPalette: CommandPaletteState;

  // Sidebar
  sidebar: SidebarState;

  // Mobile
  isMobileMenuOpen: boolean;
  isMobileBottomSheetOpen: boolean;
  mobileBottomSheetContent: string | null;

  // Responsive
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Preferences
  preferences: Preferences;

  // Loading
  isPageLoading: boolean;
  loadingMessage: string | null;

  // Actions - Navigation
  setCurrentPath: (path: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href: string }>) => void;
  setTransitioning: (transitioning: boolean) => void;

  // Actions - Modals
  openModal: (config: ModalConfig) => void;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;

  // Actions - Toasts
  showToast: (config: Omit<ToastConfig, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  // Actions - Command Palette
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  setCommandQuery: (query: string) => void;
  addRecentCommand: (command: string) => void;

  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveSection: (section: string | null) => void;

  // Actions - Mobile
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  openBottomSheet: (content: string) => void;
  closeBottomSheet: () => void;

  // Actions - Responsive
  setBreakpoint: (breakpoint: Breakpoint) => void;
  updateResponsiveState: (width: number) => void;

  // Actions - Preferences
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleReducedMotion: () => void;
  resetPreferences: () => void;

  // Actions - Loading
  setPageLoading: (loading: boolean, message?: string) => void;
}

const defaultPreferences: Preferences = {
  theme: 'dark',
  colorScheme: 'midnight',
  reducedMotion: false,
  compactMode: false,
  showLiveIndicators: true,
  autoRefresh: true,
  refreshInterval: 30,
  timezone: 'America/Chicago', // Per CLAUDE.md
  dateFormat: 'US',
  sound: false,
  notifications: {
    gameStart: true,
    scoreUpdate: true,
    gameEnd: true,
    breakingNews: true,
  },
};

const getBreakpointFromWidth = (width: number): Breakpoint => {
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
};

let toastIdCounter = 0;

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        navigation: {
          currentPath: '/',
          previousPath: null,
          breadcrumbs: [],
          isTransitioning: false,
        },
        modals: [],
        toasts: [],
        commandPalette: {
          isOpen: false,
          query: '',
          recentCommands: [],
        },
        sidebar: {
          isOpen: true,
          isCollapsed: false,
          activeSection: null,
        },
        isMobileMenuOpen: false,
        isMobileBottomSheetOpen: false,
        mobileBottomSheetContent: null,
        breakpoint: 'lg',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        preferences: defaultPreferences,
        isPageLoading: false,
        loadingMessage: null,

        // Navigation actions
        setCurrentPath: (path) =>
          set(
            (state) => ({
              navigation: {
                ...state.navigation,
                previousPath: state.navigation.currentPath,
                currentPath: path,
              },
            }),
            false,
            'setCurrentPath'
          ),

        setBreadcrumbs: (breadcrumbs) =>
          set(
            (state) => ({ navigation: { ...state.navigation, breadcrumbs } }),
            false,
            'setBreadcrumbs'
          ),

        setTransitioning: (isTransitioning) =>
          set(
            (state) => ({ navigation: { ...state.navigation, isTransitioning } }),
            false,
            'setTransitioning'
          ),

        // Modal actions
        openModal: (config) =>
          set(
            (state) => ({
              modals: [...state.modals.filter((m) => m.id !== config.id), config],
            }),
            false,
            'openModal'
          ),

        closeModal: (id) =>
          set(
            (state) => ({
              modals: id ? state.modals.filter((m) => m.id !== id) : state.modals.slice(0, -1),
            }),
            false,
            'closeModal'
          ),

        closeAllModals: () => set({ modals: [] }, false, 'closeAllModals'),

        // Toast actions
        showToast: (config) => {
          const id = `toast-${++toastIdCounter}`;
          const duration = config.duration ?? 5000;

          set(
            (state) => ({
              toasts: [...state.toasts, { ...config, id }],
            }),
            false,
            'showToast'
          );

          // Auto-dismiss
          if (duration > 0) {
            setTimeout(() => {
              get().dismissToast(id);
            }, duration);
          }
        },

        dismissToast: (id) =>
          set(
            (state) => ({
              toasts: state.toasts.filter((t) => t.id !== id),
            }),
            false,
            'dismissToast'
          ),

        clearToasts: () => set({ toasts: [] }, false, 'clearToasts'),

        // Command Palette actions
        openCommandPalette: () =>
          set(
            (state) => ({
              commandPalette: { ...state.commandPalette, isOpen: true, query: '' },
            }),
            false,
            'openCommandPalette'
          ),

        closeCommandPalette: () =>
          set(
            (state) => ({
              commandPalette: { ...state.commandPalette, isOpen: false, query: '' },
            }),
            false,
            'closeCommandPalette'
          ),

        toggleCommandPalette: () =>
          set(
            (state) => ({
              commandPalette: {
                ...state.commandPalette,
                isOpen: !state.commandPalette.isOpen,
                query: '',
              },
            }),
            false,
            'toggleCommandPalette'
          ),

        setCommandQuery: (query) =>
          set(
            (state) => ({
              commandPalette: { ...state.commandPalette, query },
            }),
            false,
            'setCommandQuery'
          ),

        addRecentCommand: (command) =>
          set(
            (state) => ({
              commandPalette: {
                ...state.commandPalette,
                recentCommands: [
                  command,
                  ...state.commandPalette.recentCommands.filter((c) => c !== command),
                ].slice(0, 10),
              },
            }),
            false,
            'addRecentCommand'
          ),

        // Sidebar actions
        toggleSidebar: () =>
          set(
            (state) => ({
              sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
            }),
            false,
            'toggleSidebar'
          ),

        setSidebarOpen: (isOpen) =>
          set((state) => ({ sidebar: { ...state.sidebar, isOpen } }), false, 'setSidebarOpen'),

        setSidebarCollapsed: (isCollapsed) =>
          set(
            (state) => ({ sidebar: { ...state.sidebar, isCollapsed } }),
            false,
            'setSidebarCollapsed'
          ),

        setActiveSection: (activeSection) =>
          set(
            (state) => ({ sidebar: { ...state.sidebar, activeSection } }),
            false,
            'setActiveSection'
          ),

        // Mobile actions
        toggleMobileMenu: () =>
          set(
            (state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }),
            false,
            'toggleMobileMenu'
          ),

        setMobileMenuOpen: (isMobileMenuOpen) =>
          set({ isMobileMenuOpen }, false, 'setMobileMenuOpen'),

        openBottomSheet: (content) =>
          set(
            { isMobileBottomSheetOpen: true, mobileBottomSheetContent: content },
            false,
            'openBottomSheet'
          ),

        closeBottomSheet: () =>
          set(
            { isMobileBottomSheetOpen: false, mobileBottomSheetContent: null },
            false,
            'closeBottomSheet'
          ),

        // Responsive actions
        setBreakpoint: (breakpoint) =>
          set(
            {
              breakpoint,
              isMobile: breakpoint === 'xs' || breakpoint === 'sm',
              isTablet: breakpoint === 'md',
              isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
            },
            false,
            'setBreakpoint'
          ),

        updateResponsiveState: (width) => {
          const breakpoint = getBreakpointFromWidth(width);
          get().setBreakpoint(breakpoint);
        },

        // Preferences actions
        setPreference: (key, value) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, [key]: value },
            }),
            false,
            'setPreference'
          ),

        setTheme: (theme) =>
          set((state) => ({ preferences: { ...state.preferences, theme } }), false, 'setTheme'),

        toggleReducedMotion: () =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                reducedMotion: !state.preferences.reducedMotion,
              },
            }),
            false,
            'toggleReducedMotion'
          ),

        resetPreferences: () => set({ preferences: defaultPreferences }, false, 'resetPreferences'),

        // Loading actions
        setPageLoading: (isPageLoading, loadingMessage = null) =>
          set({ isPageLoading, loadingMessage }, false, 'setPageLoading'),
      }),
      {
        name: 'bsi-ui-store',
        partialize: (state) => ({
          preferences: state.preferences,
          sidebar: {
            isCollapsed: state.sidebar.isCollapsed,
          },
          commandPalette: {
            recentCommands: state.commandPalette.recentCommands,
          },
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

export default useUIStore;

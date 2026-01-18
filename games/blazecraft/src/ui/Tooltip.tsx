/**
 * Tooltip System - WC3 Parchment-style tooltips
 *
 * Provides a global tooltip provider and hook for displaying
 * rich, styled tooltips on hover.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TooltipContent {
  title?: string;
  description: string;
  hotkey?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface TooltipState {
  visible: boolean;
  content: TooltipContent | null;
  x: number;
  y: number;
}

interface TooltipContextValue {
  showTooltip: (content: TooltipContent, x: number, y: number) => void;
  hideTooltip: () => void;
  updatePosition: (x: number, y: number) => void;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const TooltipContext = createContext<TooltipContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  tooltip: {
    position: 'fixed' as const,
    zIndex: 10000,
    pointerEvents: 'none' as const,
    maxWidth: '280px',
    padding: '10px 14px',
    background: 'linear-gradient(180deg, #d4c5a3 0%, #c4b48f 100%)',
    border: '2px solid #8b7355',
    borderRadius: '4px',
    boxShadow: `
      0 4px 12px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1)
    `,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.75rem',
    lineHeight: 1.4,
    color: '#2a2015',
    opacity: 0,
    transform: 'translateY(-4px)',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
  },
  tooltipVisible: {
    opacity: 1,
    transform: 'translateY(0)',
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#3a2a15',
    marginBottom: '4px',
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  hotkey: {
    display: 'inline-block',
    padding: '2px 6px',
    background: 'rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    borderRadius: '3px',
    fontFamily: 'monospace',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#5a4a30',
  },
  description: {
    color: '#4a3a25',
  },
  disabled: {
    fontStyle: 'italic' as const,
    color: '#7a6a55',
    marginTop: '4px',
    paddingTop: '4px',
    borderTop: '1px dashed rgba(0, 0, 0, 0.15)',
  },
};

// ─────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────

interface TooltipProviderProps {
  children: React.ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps): React.ReactElement {
  const [state, setState] = useState<TooltipState>({
    visible: false,
    content: null,
    x: 0,
    y: 0,
  });

  const showTooltip = useCallback((content: TooltipContent, x: number, y: number) => {
    setState({
      visible: true,
      content,
      x,
      y,
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, x, y }));
  }, []);

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip, updatePosition }}>
      {children}
      <TooltipRenderer state={state} />
    </TooltipContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// Tooltip Renderer
// ─────────────────────────────────────────────────────────────

interface TooltipRendererProps {
  state: TooltipState;
}

function TooltipRenderer({ state }: TooltipRendererProps): React.ReactElement | null {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });

  // Adjust position to keep tooltip within viewport
  useEffect(() => {
    if (!state.visible || !tooltipRef.current) {
      setAdjustedPosition({ x: state.x, y: state.y });
      return;
    }

    const rect = tooltipRef.current.getBoundingClientRect();
    const padding = 12;
    let { x, y } = state;

    // Horizontal adjustment
    if (x + rect.width + padding > window.innerWidth) {
      x = window.innerWidth - rect.width - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Vertical adjustment (prefer below cursor, flip if needed)
    const cursorOffset = 16;
    if (y + rect.height + cursorOffset + padding > window.innerHeight) {
      y = y - rect.height - cursorOffset; // Flip above
    } else {
      y = y + cursorOffset; // Below cursor
    }
    if (y < padding) {
      y = padding;
    }

    setAdjustedPosition({ x, y });
  }, [state.visible, state.x, state.y]);

  if (!state.content) return null;

  const { content, visible } = state;

  return (
    <div
      ref={tooltipRef}
      style={{
        ...styles.tooltip,
        ...(visible ? styles.tooltipVisible : {}),
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      className="wc3-tooltip"
      role="tooltip"
    >
      {content.title && (
        <div style={styles.title} className="wc3-tooltip-title">
          <span>{content.title}</span>
          {content.hotkey && (
            <span style={styles.hotkey} className="wc3-tooltip-hotkey">
              {content.hotkey}
            </span>
          )}
        </div>
      )}
      <div style={styles.description} className="wc3-tooltip-desc">
        {content.description}
      </div>
      {content.disabled && content.disabledReason && (
        <div style={styles.disabled} className="wc3-tooltip-disabled">
          {content.disabledReason}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hook for using tooltips
// ─────────────────────────────────────────────────────────────

interface UseTooltipOptions {
  title?: string;
  description: string;
  hotkey?: string;
  disabled?: boolean;
  disabledReason?: string;
  delay?: number;
}

interface UseTooltipReturn {
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function useTooltip(options: UseTooltipOptions): UseTooltipReturn {
  const context = useContext(TooltipContext);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!context) {
    // Return no-ops if not within provider
    return {
      onMouseEnter: () => {},
      onMouseMove: () => {},
      onMouseLeave: () => {},
    };
  }

  const { showTooltip, hideTooltip, updatePosition } = context;
  const delay = options.delay ?? 400;

  const onMouseEnter = (e: React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      showTooltip(
        {
          title: options.title,
          description: options.description,
          hotkey: options.hotkey,
          disabled: options.disabled,
          disabledReason: options.disabledReason,
        },
        e.clientX,
        e.clientY
      );
    }, delay);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    updatePosition(e.clientX, e.clientY);
  };

  const onMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    hideTooltip();
  };

  return { onMouseEnter, onMouseMove, onMouseLeave };
}

// ─────────────────────────────────────────────────────────────
// Simple tooltip wrapper component
// ─────────────────────────────────────────────────────────────

interface WithTooltipProps extends UseTooltipOptions {
  children: React.ReactElement<{
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseMove?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
  }>;
}

export function WithTooltip({
  children,
  ...tooltipOptions
}: WithTooltipProps): React.ReactElement {
  const tooltipProps = useTooltip(tooltipOptions);

  return React.cloneElement(children, {
    ...tooltipProps,
    onMouseEnter: (e: React.MouseEvent) => {
      tooltipProps.onMouseEnter(e);
      children.props.onMouseEnter?.(e);
    },
    onMouseMove: (e: React.MouseEvent) => {
      tooltipProps.onMouseMove(e);
      children.props.onMouseMove?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      tooltipProps.onMouseLeave();
      children.props.onMouseLeave?.(e);
    },
  });
}

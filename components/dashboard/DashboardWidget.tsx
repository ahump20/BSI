'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DashboardWidgetProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  /** Span full width (no column constraint) */
  fullWidth?: boolean;
  /** framer-motion layout animation */
  layoutId?: string;
}

export function DashboardWidget({
  title,
  subtitle,
  children,
  className = '',
  fullWidth,
  layoutId,
}: DashboardWidgetProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      className={`
        border border-border/50 bg-surface-light/30 backdrop-blur-sm rounded-xl
        ${fullWidth ? '' : ''}
        ${className}
      `.trim()}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-sm font-display uppercase tracking-wider text-text-primary flex items-center gap-2">
            <span className="w-1 h-4 bg-burnt-orange rounded-full" />
            {title}
          </h3>
          {subtitle && (
            <span className="text-xs text-text-muted uppercase tracking-wider">{subtitle}</span>
          )}
        </div>
      )}
      <div className="p-5 pt-2">{children}</div>
    </motion.div>
  );
}

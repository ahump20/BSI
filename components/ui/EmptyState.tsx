'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

export type EmptyStateIcon =
  | 'baseball'
  | 'football'
  | 'basketball'
  | 'calendar'
  | 'data'
  | 'search'
  | 'error'
  | 'offline';

export interface EmptyStateProps {
  /** Icon type to display */
  icon: EmptyStateIcon;
  /** Main heading */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional call-to-action */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const icons: Record<EmptyStateIcon, ReactNode> = {
  baseball: (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-1.5 2-2 4.5-2 9s.5 7 2 9" strokeLinecap="round" />
      <path d="M12 3c1.5 2 2 4.5 2 9s-.5 7-2 9" strokeLinecap="round" />
      <path d="M4.5 8.5h15M4.5 15.5h15" strokeLinecap="round" />
    </svg>
  ),
  football: (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(45 12 12)" />
      <path d="M12 12l-4-4m4 4l4 4M8.5 15.5L15.5 8.5" strokeLinecap="round" />
    </svg>
  ),
  basketball: (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" strokeLinecap="round" />
      <path d="M5.6 5.6c2.8 2 6.4 2.8 12.8 0M5.6 18.4c2.8-2 6.4-2.8 12.8 0" strokeLinecap="round" />
    </svg>
  ),
  calendar: (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
    </svg>
  ),
  data: (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16l4-6 4 4 5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
  ),
  offline: (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const sizeStyles = {
  sm: {
    container: 'py-8 px-4',
    icon: 'w-10 h-10',
    title: 'text-base',
    description: 'text-xs',
  },
  md: {
    container: 'py-12 px-6',
    icon: 'w-12 h-12',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'w-16 h-16',
    title: 'text-xl',
    description: 'text-base',
  },
};

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const iconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

/**
 * EmptyState - Graceful empty state display with animations
 *
 * Shows a sport-appropriate icon, message, and optional action
 * when no data is available. Features smooth entrance animations.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  const ActionContent = (
    <>
      {action?.label}
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center glass-card ${styles.container} ${className}`}
      role="status"
      aria-label={title}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated icon with subtle pulse */}
      <motion.div className={`${styles.icon} text-text-tertiary mb-4`} variants={iconVariants}>
        <motion.div
          animate={{
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {icons[icon]}
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        className={`${styles.title} font-semibold text-text-primary mb-2`}
        variants={itemVariants}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          className={`${styles.description} text-text-secondary max-w-md mb-4`}
          variants={itemVariants}
        >
          {description}
        </motion.p>
      )}

      {/* Action button */}
      {action && (
        <motion.div variants={itemVariants}>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2 bg-burnt-orange/10 hover:bg-burnt-orange/20 border border-burnt-orange/30 hover:border-burnt-orange/50 rounded-lg text-burnt-orange text-sm font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(191,87,0,0.2)]"
            >
              {ActionContent}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-burnt-orange/10 hover:bg-burnt-orange/20 border border-burnt-orange/30 hover:border-burnt-orange/50 rounded-lg text-burnt-orange text-sm font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(191,87,0,0.2)]"
            >
              {ActionContent}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default EmptyState;

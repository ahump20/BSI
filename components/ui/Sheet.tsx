'use client';

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: 'right' | 'bottom';
  className?: string;
}

const variants = {
  right: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
  bottom: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },
};

export function Sheet({ open, onClose, children, side = 'right', className = '' }: SheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.classList.add('scroll-locked');
      return () => document.body.classList.remove('scroll-locked');
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const v = variants[side];

  const positionClass =
    side === 'right'
      ? 'top-0 right-0 h-full w-full max-w-xl'
      : 'bottom-0 left-0 w-full max-h-[90vh] rounded-t-2xl';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1040] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={v.initial}
            animate={v.animate}
            exit={v.exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed z-[1050] overflow-y-auto bg-[var(--bsi-bg-secondary,#161620)] border-l border-border ${positionClass} ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sticky top-0 z-10 px-6 py-4 border-b border-border bg-[var(--bsi-bg-secondary,#161620)] ${className}`}>
      {children}
    </div>
  );
}

export function SheetBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

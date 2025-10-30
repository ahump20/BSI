/**
 * Modal Component
 *
 * Accessible modal dialog with animations and backdrop.
 * Usage: <Modal isOpen={open} onClose={() => setOpen(false)}>Content</Modal>
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { graphicsTheme } from '@/lib/graphics/theme';
import { fadeIn, fadeOut, scale } from '@/lib/graphics/animations';
import { usePrefersReducedMotion } from '@/lib/graphics/hooks';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReduced = usePrefersReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  // Handle mounting for portals
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Animate in/out
  useEffect(() => {
    if (!backdropRef.current || !contentRef.current || prefersReduced) return;

    if (isOpen) {
      fadeIn(backdropRef.current, { duration: 200 });
      scale(contentRef.current, 0.95, 1, { duration: 200 });
    }
  }, [isOpen, prefersReduced]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1200px' },
    full: { maxWidth: '95vw', maxHeight: '95vh' },
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        opacity: 0,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={contentRef}
        className={`modal-content ${className}`}
        style={{
          background: graphicsTheme.colors.background.secondary,
          borderRadius: graphicsTheme.borderRadius.lg,
          border: `1px solid rgba(148, 163, 184, 0.2)`,
          boxShadow: graphicsTheme.shadows.xl,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          ...sizeStyles[size],
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: `1px solid rgba(148, 163, 184, 0.1)`,
            }}
          >
            {title && (
              <h2
                id="modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: graphicsTheme.colors.text.primary,
                }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: graphicsTheme.colors.text.secondary,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  marginLeft: 'auto',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  transition: 'color 0.2s ease',
                }}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/**
 * ConfirmModal - Specialized modal for confirmations
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = graphicsTheme.colors.primary,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div>
        <p style={{ color: graphicsTheme.colors.text.secondary, marginBottom: '1.5rem' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              background: graphicsTheme.colors.background.tertiary,
              border: `1px solid rgba(148, 163, 184, 0.2)`,
              borderRadius: graphicsTheme.borderRadius.md,
              color: graphicsTheme.colors.text.primary,
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            style={{
              padding: '0.5rem 1rem',
              background: confirmColor,
              border: 'none',
              borderRadius: graphicsTheme.borderRadius.md,
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

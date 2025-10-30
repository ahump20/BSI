/**
 * Dropdown Component
 *
 * Accessible dropdown menu with keyboard navigation.
 * Usage: <Dropdown items={menuItems} onSelect={handleSelect}>Toggle</Dropdown>
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { graphicsTheme } from '@/lib/graphics/theme';
import { fadeIn, slideIn } from '@/lib/graphics/animations';
import { usePrefersReducedMotion } from '@/lib/graphics/hooks';

export interface DropdownItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
  children: React.ReactNode;
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  className?: string;
}

export function Dropdown({
  items,
  onSelect,
  children,
  placement = 'bottom-left',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Animate menu
  useEffect(() => {
    if (isOpen && menuRef.current && !prefersReduced) {
      const direction = placement.startsWith('top') ? 'top' : 'bottom';
      slideIn(menuRef.current, direction, { duration: 200 });
    }
  }, [isOpen, placement, prefersReduced]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => {
          const nextIndex = prev + 1;
          return nextIndex >= items.length ? 0 : nextIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => {
          const prevIndex = prev - 1;
          return prevIndex < 0 ? items.length - 1 : prevIndex;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && !items[activeIndex].disabled) {
          onSelect(items[activeIndex]);
          setIsOpen(false);
          setActiveIndex(-1);
        }
        break;
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    onSelect(item);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const placementStyles = {
    'bottom-left': { top: '100%', left: 0, marginTop: '0.5rem' },
    'bottom-right': { top: '100%', right: 0, marginTop: '0.5rem' },
    'top-left': { bottom: '100%', left: 0, marginBottom: '0.5rem' },
    'top-right': { bottom: '100%', right: 0, marginBottom: '0.5rem' },
  };

  return (
    <div
      ref={dropdownRef}
      className={`dropdown ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
      onKeyDown={handleKeyDown}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{ cursor: 'pointer' }}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className="dropdown-menu"
          role="menu"
          style={{
            position: 'absolute',
            ...placementStyles[placement],
            minWidth: '200px',
            background: graphicsTheme.colors.background.secondary,
            border: `1px solid rgba(148, 163, 184, 0.2)`,
            borderRadius: graphicsTheme.borderRadius.md,
            boxShadow: graphicsTheme.shadows.lg,
            padding: '0.5rem 0',
            zIndex: 1000,
            opacity: 0,
          }}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  style={{
                    height: '1px',
                    background: 'rgba(148, 163, 184, 0.1)',
                    margin: '0.5rem 0',
                  }}
                />
              );
            }

            return (
              <div
                key={item.value}
                role="menuitem"
                tabIndex={-1}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => setActiveIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  color: item.disabled
                    ? graphicsTheme.colors.text.tertiary
                    : activeIndex === index
                    ? graphicsTheme.colors.text.primary
                    : graphicsTheme.colors.text.secondary,
                  background: activeIndex === index ? 'rgba(191, 87, 0, 0.1)' : 'transparent',
                  opacity: item.disabled ? 0.5 : 1,
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
              >
                {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Select - Styled select dropdown
 */
export interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  className?: string;
}

export function Select({ value, onChange, options, placeholder = 'Select...', className = '' }: SelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  const items: DropdownItem[] = options.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  return (
    <Dropdown
      items={items}
      onSelect={(item) => onChange(item.value)}
      className={className}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem',
          background: graphicsTheme.colors.background.tertiary,
          border: `1px solid rgba(148, 163, 184, 0.2)`,
          borderRadius: graphicsTheme.borderRadius.md,
          color: selectedOption ? graphicsTheme.colors.text.primary : graphicsTheme.colors.text.tertiary,
          minWidth: '150px',
          cursor: 'pointer',
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ marginLeft: '0.5rem' }}>▼</span>
      </div>
    </Dropdown>
  );
}

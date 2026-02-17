'use client';

import { useMemo } from 'react';
import { Navbar } from './Navbar';
import { getMainNavItems } from '@/lib/navigation';

/**
 * Client wrapper that computes season-aware nav items and passes them to Navbar.
 * Separated because getMainNavItems() uses `new Date()` which needs client context.
 */
export function NavbarWrapper() {
  const { primary, secondary } = useMemo(() => getMainNavItems(), []);
  return <Navbar primary={primary} secondary={secondary} />;
}

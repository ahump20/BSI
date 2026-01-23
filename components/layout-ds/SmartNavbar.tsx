'use client';

/**
 * SmartNavbar - Route-aware navigation wrapper
 *
 * Automatically adds secondary navigation tabs based on the current route.
 * Uses the centralized navigation config from lib/navigation.ts
 */

import { usePathname } from 'next/navigation';
import { Navbar, type NavbarProps } from './Navbar';
import { getSecondaryNav } from '@/lib/navigation';

export interface SmartNavbarProps extends Omit<NavbarProps, 'secondaryNav'> {
  /** Override automatic secondary nav detection */
  forceSecondaryNav?: NavbarProps['secondaryNav'];
}

export function SmartNavbar({ forceSecondaryNav, ...props }: SmartNavbarProps) {
  const pathname = usePathname();

  // Get secondary nav based on current route (or use override)
  const secondaryNav = forceSecondaryNav ?? getSecondaryNav(pathname);

  return <Navbar {...props} secondaryNav={secondaryNav} />;
}

export default SmartNavbar;

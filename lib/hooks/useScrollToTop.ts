'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function useScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, searchParams]);
}

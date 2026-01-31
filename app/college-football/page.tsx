'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CollegeFootballRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cfb');
  }, [router]);

  return null;
}

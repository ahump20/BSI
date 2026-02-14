'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NFLScoresRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/nfl/games');
  }, [router]);

  return null;
}

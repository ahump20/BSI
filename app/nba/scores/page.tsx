'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NBAScoresRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/nba/games');
  }, [router]);

  return null;
}

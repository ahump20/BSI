'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BaseballRankingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/college-baseball/rankings');
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl text-white mb-3 uppercase">Redirecting</h1>
        <p className="text-text-secondary mb-4">
          College baseball rankings moved to the canonical route.
        </p>
        <Link href="/college-baseball/rankings" className="text-burnt-orange hover:text-ember">
          Continue to /college-baseball/rankings
        </Link>
      </div>
    </main>
  );
}

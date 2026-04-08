import { Suspense } from 'react';
import PlayersDirectoryClient from './PlayersDirectoryClient';

export default function CollegeBaseballPlayersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="inline-block w-10 h-10 border-4 border-[var(--bsi-primary)]/30 border-t-[var(--bsi-primary)] rounded-full animate-spin" />
        </div>
      }
    >
      <PlayersDirectoryClient />
    </Suspense>
  );
}

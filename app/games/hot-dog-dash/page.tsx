'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HotDogDashRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/games/blaze-hot-dog');
  }, [router]);

  return null;
}

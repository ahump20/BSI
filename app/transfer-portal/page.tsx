'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransferPortalRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/college-baseball/transfer-portal');
  }, [router]);

  return null;
}

'use client';

import { useRouter } from 'next/navigation';
import { BlazeArcade } from '@/components/arcade';

export default function ArcadePage() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  return <BlazeArcade onClose={handleClose} />;
}

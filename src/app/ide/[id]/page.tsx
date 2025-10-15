'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyIDEPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/ide/new');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white text-xl">Redirecting...</div>
    </div>
  );
}

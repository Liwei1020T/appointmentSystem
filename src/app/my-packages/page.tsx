'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * My Packages Redirect Page
 * Redirects /my-packages to /profile/packages
 * for consistent route structure.
 */
export default function MyPackagesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/profile/packages');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-ink">
      <div className="text-text-secondary">重定向到我的套餐...</div>
    </div>
  );
}

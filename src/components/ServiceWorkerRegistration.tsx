/**
 * Service Worker Registration Component
 *
 * 在应用启动时注册 Service Worker，提供：
 * - PWA 离线支持
 * - Web Push 通知
 * - 资源缓存
 */

'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Handle controller change (new SW activated)
      const handleControllerChange = () => {
        console.info('[SW] Controller changed, page will reload');
      };

      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.info('[SW] Service Worker registered:', registration.scope);

          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, notify user
                  console.info('[SW] New content available, refresh to update');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Cleanup event listener on unmount
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return null;
}

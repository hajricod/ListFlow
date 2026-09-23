import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadStoredTheme, loadStoredThemeColor, loadStoredFontFamily, loadStoredFontSize } from './utils/storage';
import { applyThemeColorToDOM } from './utils/themeColors';
import { applyTypographyToDOM } from './utils/typography';

// Initialize theme, accent color & typography before paint
try {
  const initialTheme = loadStoredTheme();
  const isDark =
    initialTheme === 'dark' ||
    (initialTheme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const initialThemeColor = loadStoredThemeColor();
  applyThemeColorToDOM(initialThemeColor);

  const initialFont = loadStoredFontFamily();
  const initialFontSize = loadStoredFontSize();
  applyTypographyToDOM(initialFont, initialFontSize);
} catch {}

// Disable zooming (pinch-to-zoom, gesture zoom, trackpad/wheel zoom, and keyboard zoom)
if (typeof window !== 'undefined') {
  // Prevent iOS Safari gesture zoom (pinch-to-zoom)
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });
  document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
  });
  document.addEventListener('gestureend', (e) => {
    e.preventDefault();
  });

  // Prevent multi-touch pinch zoom
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent Ctrl + Mouse wheel / trackpad pinch zoom
  document.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent keyboard zoom shortcuts (Ctrl/Cmd + '+', '-', '=', '0')
  document.addEventListener('keydown', (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')
    ) {
      e.preventDefault();
    }
  });

  // Disable pull-down-to-refresh on mobile browsers
  let startTouchY = 0;
  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        startTouchY = e.touches[0].clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length === 1) {
        const currentY = e.touches[0].clientY;
        // When pulling downward
        if (currentY > startTouchY) {
          const isAtTop =
            (window.scrollY ||
              document.documentElement.scrollTop ||
              document.body.scrollTop ||
              0) <= 0;
          if (isAtTop) {
            let el = e.target as HTMLElement | null;
            let canScrollUp = false;
            while (el && el !== document.body && el !== document.documentElement) {
              if (el.scrollTop > 0) {
                canScrollUp = true;
                break;
              }
              el = el.parentElement;
            }
            if (!canScrollUp && e.cancelable) {
              e.preventDefault();
            }
          }
        }
      }
    },
    { passive: false }
  );
}

// Manage Service Worker for PWA (Active in production, safely cleaned up in dev)
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In dev mode, unregister any service worker and clear caches to prevent stale React module duplication
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key.startsWith('listflow-')) {
            caches.delete(key).catch(() => {});
          }
        }
      });
    }
  } else {
    // In production, register Service Worker with automatic update detection
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates on startup
          registration.update().catch(() => {});

          // Check for updates when user returns to tab / unlocks phone
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              registration.update().catch(() => {});
            }
          });
        })
        .catch(() => {});

      // Reload if service worker controller updates to ensure fresh code
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

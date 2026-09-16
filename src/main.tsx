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

// Register Service Worker for PWA with automatic update detection
if ('serviceWorker' in navigator) {
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

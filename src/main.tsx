import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadStoredTheme, loadStoredThemeColor } from './utils/storage';
import { applyThemeColorToDOM } from './utils/themeColors';

// Initialize theme & accent color before paint
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
} catch {}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './App.tsx';
import './index.css';

// ==========================================================
// VERSION — bump this on every release
// ==========================================================
// Setting this in one place means we can detect stale clients
// (users stuck on old cached versions) and force a refresh.
const APP_VERSION = '1.0.0';

// ==========================================================
// PWA REGISTRATION — auto-update, no user prompt
// ==========================================================
const updateSW = registerSW({
  // Check every 30 seconds while running
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;

    // Periodic update check
    setInterval(() => {
      registration.update().catch(() => { });
    }, 30 * 1000);

    // Check for updates when the tab/app regains focus
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch(() => { });
      }
    });
  },

  // A new service worker has been installed and is waiting
  onNeedRefresh() {
    // Auto-apply — no user prompt. This is what WhatsApp does.
    // Users never see a "new version available" banner.
    updateSW(true);
  },

  // Offline shell is ready
  onOfflineReady() {
    // Intentionally silent. Only log in dev.
    if (import.meta.env.DEV) {
      console.log('[PWA] App ready to work offline');
    }
  },

  onRegisterError(error) {
    console.error('[PWA] Service worker registration failed:', error);
  },
});

// ==========================================================
// VERSION SKEW GUARD
// ==========================================================
// Detect when a user is stuck on an old cached version.
// Compares the version stored in localStorage against the
// version baked into the current bundle. On mismatch, hard
// reload with cache bypass.
(() => {
  try {
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion && storedVersion !== APP_VERSION) {
      // We have a version mismatch. Clear the mismatch flag,
      // write the new version, and reload once.
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('version_bumped_at', new Date().toISOString());

      // Only reload once per session to prevent infinite loops
      const reloadedFor = sessionStorage.getItem('reloaded_for_version');
      if (reloadedFor !== APP_VERSION) {
        sessionStorage.setItem('reloaded_for_version', APP_VERSION);
        // Bypass cache
        window.location.reload();
        return;
      }
    } else {
      localStorage.setItem('app_version', APP_VERSION);
    }
  } catch {
    // localStorage unavailable — skip version check
  }
})();

// ==========================================================
// FOCUS EVENT UPDATE CHECK
// ==========================================================
// Belt-and-braces: when the user comes back to the tab after
// a long absence, check for updates immediately.
(() => {
  let hiddenAt = Date.now();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
    } else {
      const awayMs = Date.now() - hiddenAt;
      // If they've been gone more than 5 minutes, check for updates
      if (awayMs > 5 * 60 * 1000) {
        updateSW?.(true);
      }
    }
  });
})();

// ==========================================================
// RENDER
// ==========================================================
const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
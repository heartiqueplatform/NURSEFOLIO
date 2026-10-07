import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// ==========================================================
// BUILD VERSION — changes on every deploy
// ==========================================================
// Uses Vercel/Netlify/GitHub commit SHA if available, else timestamp.
// This is injected into the bundle so `main.tsx` can detect
// when a user is on a stale cached version.
const BUILD_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  process.env.GITHUB_SHA?.slice(0, 7) ||
  process.env.COMMIT_REF?.slice(0, 7) ||
  Date.now().toString(36);

export default defineConfig(() => {
  return {
    // Make BUILD_VERSION available at runtime
    define: {
      __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
    },

    plugins: [
      react(),
      tailwindcss(),

      VitePWA({
        // ✅ Auto-update: new service worker activates immediately, no prompt
        registerType: 'autoUpdate',

        // Ensure updates are detected aggressively
        // (this makes the `sw.js` file itself not get cached)
        injectRegister: 'auto',

        // Only include assets that actually exist in /public
        includeAssets: [
          '192.png',
        ],

        manifest: {
          name: 'Nursefolio',
          short_name: 'Nursefolio',
          description: 'Professional portfolio and career tools for nurses',
          // ✅ Match the app's actual accent (teal) — was navy #0f172a
          theme_color: '#0d9488',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          lang: 'en',
          categories: ['medical', 'productivity', 'health'],
          icons: [
            {
              src: '/192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            // If you have a higher-res asset, swap in a 512x512 here.
            // Otherwise 192 as maskable still works on most devices.
          ],
        },

        workbox: {
          // ✅ Remove caches from previous versions immediately
          cleanupOutdatedCaches: true,
          // ✅ Force new SW to activate without waiting for old tabs to close
          skipWaiting: true,
          // ✅ New SW takes control of open tabs
          clientsClaim: true,

          // ✅ Loader + critical shell fallback (set in index.html)
          navigateFallback: '/index.html',
          // Never serve fallback for these routes (auth callback, API, etc.)
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/auth\//,
            // Assets and files
            /\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|json|woff2?)$/,
          ],

          // ✅ Precache only what we actually need
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Don't precache huge sourcemaps or images
          globIgnores: ['**/*.map', '**/og-image*', '**/twitter-card*'],

          // ✅ Increase max file size for precache (default is 2MB — PDF.js and
          // @react-pdf/renderer chunks can exceed this)
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

          // ✅ Runtime caching for external resources
          runtimeCaching: [
            // Google Fonts
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Supabase API — never cache, always live
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkOnly',
            },
            // Cloudinary images — cache aggressively (they're already CDN'd)
            {
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cloudinary-images',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],

          // ✅ Always fetch fresh index.html from the network when possible
          // This makes the version-skew guard work correctly.
          offlineGoogleAnalytics: false,
        },

        devOptions: {
          // ✅ Keep SW disabled in dev — it causes caching chaos
          enabled: false,
          type: 'module',
        },
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },

    // ✅ Improve build output for PWA
    build: {
      // Warn if a chunk is bigger than 800KB
      chunkSizeWarningLimit: 800,
      // Generate sourcemaps for debugging but not precached by SW
      sourcemap: false,
      // Better long-term caching — hash the filenames
      rollupOptions: {
        output: {
          // Split vendor chunks so cache invalidation is surgical
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase': ['@supabase/supabase-js'],
            'pdf': ['@react-pdf/renderer'],
          },
        },
      },
    },
  };
});
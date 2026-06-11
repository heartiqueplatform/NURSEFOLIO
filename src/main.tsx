import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './App.tsx';
import './index.css';

// This function will check for updates and reload the page automatically
const updateSW = registerSW({
  onNeedRefresh() {
    // When a new version is found, this forces the update and reloads the page
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
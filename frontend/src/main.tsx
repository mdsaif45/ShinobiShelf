import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initInstallPrompt } from './pwa/install';
import { registerServiceWorker } from './pwa/serviceWorker';

// Capture `beforeinstallprompt` before React mounts: the browser can fire it
// early, and an unhandled event cannot be replayed later.
initInstallPrompt();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// After render, so registration never competes with first paint.
// No-ops outside production builds; see pwa/serviceWorker.ts.
void registerServiceWorker();

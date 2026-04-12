/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Firefox Background Bootstrap
   Patches the background entry point for Firefox compatibility:
   1. Loads the browser-polyfill (chrome → browser namespace)
   2. Initializes CORS handler (replaces declarativeNetRequest)
   3. Redirects AI imports to Firefox-specific Worker-based client
   ══════════════════════════════════════════════════════════════════ */

import { installCORSHandler } from './cors-handler.js';
import { setupAuthListener, storeToken, clearToken, validateToken, getToken } from './auth-bridge.js';
import { initSync, forceSync, enqueueItems } from './sync-manager.js';
import { fetchBalance, getBalance, decrementTokens } from './token-cache.js';
import { getQueueSize } from './offline-queue.js';

// Firefox-specific: import Worker-based transformers client instead of offscreen-based
// We re-export from the Firefox variant so that AI modules importing from './transformers-client.js'
// get the Worker-based version via module resolution
// The build script will replace the import in AI modules, OR we alias it here.

// Detect Firefox and install CORS handler
const isFirefox = typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined' &&
  browser.runtime.getBrowserInfo !== undefined;

if (isFirefox) {
  installCORSHandler();
  console.debug('[NychIQ Firefox] Background bootstrap complete');
}

// Re-export everything that background.js imports so AI modules work
export { setupAuthListener, storeToken, clearToken, validateToken, getToken };
export { initSync, forceSync, enqueueItems };
export { fetchBalance, getBalance, decrementTokens };
export { getQueueSize };

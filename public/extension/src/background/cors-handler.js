/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — CORS Handler (Firefox)
   Replaces Chrome's declarativeNetRequest with webRequest API
   Adds CORS headers to responses from nychiq.com API
   ══════════════════════════════════════════════════════════════════ */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

/**
 * Install CORS header modification for Firefox.
 * Call this during extension startup in background.js.
 */
export function installCORSHandler() {
  // Only applies in Firefox (browser.webRequest exists)
  if (typeof browser === 'undefined' || !browser.webRequest) {
    console.debug('[NychIQ] CORS handler not needed (not Firefox)');
    return;
  }

  // Add CORS headers to responses from nychiq.com API
  browser.webRequest.onHeadersReceived.addListener(
    (details) => {
      const headers = details.responseHeaders || [];

      for (const [name, value] of Object.entries(CORS_HEADERS)) {
        // Replace existing header if present, otherwise add new
        const existingIndex = headers.findIndex(h => h.name.toLowerCase() === name.toLowerCase());
        if (existingIndex >= 0) {
          headers[existingIndex].value = value;
        } else {
          headers.push({ name, value });
        }
      }

      return { responseHeaders: headers };
    },
    {
      urls: ['https://*.nychiq.com/api/*', 'https://nychiq.com/api/*'],
      types: ['xmlhttprequest', 'main_frame', 'sub_frame'],
    },
    ['blocking', 'responseHeaders']
  );

  // Handle preflight OPTIONS requests
  browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      const headers = details.requestHeaders || [];

      // Ensure Origin and method headers for CORS preflight
      const hasOrigin = headers.some(h => h.name.toLowerCase() === 'origin');
      if (!hasOrigin) {
        headers.push({ name: 'Origin', value: details.originUrl || details.url });
      }

      return { requestHeaders: headers };
    },
    {
      urls: ['https://*.nychiq.com/api/*', 'https://nychiq.com/api/*'],
      types: ['xmlhttprequest'],
    },
    ['blocking', 'requestHeaders']
  );

  console.debug('[NychIQ Firefox] CORS handler installed');
}

// Auto-install when loaded as a background module in Firefox
// (listed in manifest.firefox.json scripts array before background.js)
if (typeof browser !== 'undefined' && browser.webRequest) {
  installCORSHandler();
}
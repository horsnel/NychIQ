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

  console.debug('[NychIQ Firefox] CORS handler installed');
}
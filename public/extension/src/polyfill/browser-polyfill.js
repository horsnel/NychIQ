/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Browser API Polyfill (Firefox)
   Provides chrome.* namespace compatibility in Firefox.
   Firefox supports chrome.* natively but callbacks are slightly different.
   This polyfill ensures callback signature consistency.

   NOTE: Firefox natively supports chrome.* as an alias for browser.*.
   This lightweight polyfill only patches specific edge cases:
   - chrome.runtime.getContexts (not available in Firefox)
   - chrome.offscreen (not available in Firefox)
   - chrome.declarativeNetRequest (limited in Firefox)
   ══════════════════════════════════════════════════════════════════ */

if (typeof browser !== 'undefined') {
  // Polyfill chrome.runtime.getContexts (Chrome-only API)
  if (!chrome.runtime.getContexts) {
    chrome.runtime.getContexts = function(filter) {
      // Firefox doesn't have offscreen documents, so this always returns empty
      if (filter && filter.contextTypes && filter.contextTypes.includes('OFFSCREEN_DOCUMENT')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    };
  }

  // Polyfill chrome.offscreen (not available in Firefox)
  if (!chrome.offscreen) {
    chrome.offscreen = {
      createDocument: function() {
        return Promise.reject(new Error('chrome.offscreen is not available in Firefox. Use Web Worker instead.'));
      },
      closeDocument: function() {
        return Promise.resolve();
      },
    };
  }

  // Polyfill chrome.declarativeNetRequest (limited in Firefox)
  if (!chrome.declarativeNetRequest) {
    chrome.declarativeNetRequest = {
      updateSessionRules: function() {
        console.debug('[NychIQ] declarativeNetRequest not available in Firefox — using webRequest instead');
        return Promise.resolve();
      },
      getDynamicRules: function() {
        return Promise.resolve([]);
      },
      updateEnabledRulesets: function() {
        return Promise.resolve();
      },
    };
  }

  // Ensure chrome.action is available (Firefox uses browser.browserAction as alias)
  if (!chrome.action && chrome.browserAction) {
    chrome.action = chrome.browserAction;
  }

  // Ensure chrome.scripting is available
  if (!chrome.scripting) {
    chrome.scripting = {
      executeScript: function(details) {
        // Fallback: inject via tabs, return Chrome-compatible shape
        if (details.target && details.target.tabId) {
          const tabId = details.target.tabId;
          const frameId = details.target.frameId ?? 0;
          const injectSpec = details.files
            ? { file: details.files[0] }
            : { code: details.func ? `(${details.func.toString()})(${JSON.stringify(details.args || [])})` : undefined };
          return browser.tabs.executeScript(tabId, injectSpec).then(results => ({
            results: (results || []).map(r => ({ frameId, result: r })),
          }));
        }
        return Promise.resolve({ results: [] });
      },
      insertCSS: function(details) {
        if (details.target && details.target.tabId) {
          // Only pass file OR code, not both
          const injectSpec = details.files
            ? { file: details.files[0] }
            : { code: details.css };
          return browser.tabs.insertCSS(details.target.tabId, injectSpec);
        }
        return Promise.resolve();
      },
    };
  }

  // Patch chrome.storage.local.get to work with both callback and promise
  const originalGet = chrome.storage.local.get.bind(chrome.storage.local);
  const originalSet = chrome.storage.local.set.bind(chrome.storage.local);

  chrome.storage.local.get = function(keys, callback) {
    const result = originalGet(keys);
    if (result && typeof result.then === 'function') {
      return result.then(r => { if (callback) callback(r); return r; });
    }
    return result;
  };

  chrome.storage.local.set = function(items, callback) {
    const result = originalSet(items);
    if (result && typeof result.then === 'function') {
      return result.then(() => { if (callback) callback(); });
    }
    return result;
  };

  console.debug('[NychIQ Firefox] Browser polyfill loaded');
}
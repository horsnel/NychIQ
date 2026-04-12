/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Auth Bridge
   JWT handling between NychIQ web app and Chrome extension
   ══════════════════════════════════════════════════════════════════ */

const AUTH_KEY = 'nychiq_auth';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 min before expiry
const API_BASE = 'https://nychiq-api.bm4413212.workers.dev/api';

/**
 * Store JWT token from NychIQ web app.
 */
export async function storeToken(jwt) {
  if (!jwt) return false;
  try {
    const payload = decodeJWT(jwt);
    if (!payload) return false;
    await chromeStorageSet(AUTH_KEY, { jwt, payload, storedAt: Date.now() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve stored JWT token.
 */
export async function getToken() {
  const auth = await chromeStorageGet(AUTH_KEY);
  if (!auth?.jwt) return null;

  // Check expiry
  const payload = decodeJWT(auth.jwt);
  if (!payload || isExpired(payload)) {
    // Try refresh
    const refreshed = await refreshToken();
    if (refreshed) return refreshed;
    await clearToken();
    return null;
  }

  // Auto-refresh if near expiry
  if (isNearExpiry(payload)) {
    refreshToken(); // fire-and-forget
  }

  return auth.jwt;
}

/**
 * Get full auth state including decoded payload.
 */
export async function getAuthState() {
  const auth = await chromeStorageGet(AUTH_KEY);
  if (!auth?.jwt) return null;
  const payload = decodeJWT(auth.jwt);
  if (!payload) return null;
  return { jwt: auth.jwt, payload, storedAt: auth.storedAt };
}

/**
 * Remove stored token (logout).
 */
export async function clearToken() {
  await chromeStorageSet(AUTH_KEY, null);
  // Update extension state to disconnected
  const state = await chromeStorageGet('nychiq_ext_state') || {};
  state.connected = false;
  state.jwt = null;
  state.userId = null;
  await chromeStorageSet('nychiq_ext_state', state);
  return true;
}

/**
 * Decode JWT payload without verification (client-side).
 */
export function decodeJWT(jwt) {
  try {
    if (!jwt || typeof jwt !== 'string') return null;
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired.
 */
export function isExpired(payload) {
  if (!payload?.exp) return true;
  return Date.now() > (payload.exp * 1000);
}

/**
 * Check if token is near expiry (within threshold).
 */
export function isNearExpiry(payload) {
  if (!payload?.exp) return true;
  const remaining = (payload.exp * 1000) - Date.now();
  return remaining < TOKEN_REFRESH_THRESHOLD;
}

/**
 * Refresh JWT via API.
 */
export async function refreshToken() {
  try {
    const auth = await chromeStorageGet(AUTH_KEY);
    if (!auth?.jwt) return null;

    const resp = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.jwt}` },
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    if (data.jwt) {
      await storeToken(data.jwt);
      return data.jwt;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate token and return user info.
 */
export async function validateToken() {
  const jwt = await getToken();
  if (!jwt) return { valid: false };

  const payload = decodeJWT(jwt);
  if (!payload) return { valid: false };

  return {
    valid: true,
    userId: payload.sub || payload.user_id || payload.userId,
    email: payload.email,
    role: payload.role,
    exp: payload.exp,
    iat: payload.iat,
  };
}

/**
 * Listen for auth messages from NychIQ web app pages.
 * The web app sends tokens via window.postMessage which gets forwarded.
 */
export function setupAuthListener() {
  // Listen for messages from content scripts that relay auth from web app
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_TOKEN') {
      storeToken(message.jwt).then(ok => {
        if (ok) {
          // Update connected state
          chrome.storage.local.get('nychiq_ext_state', (result) => {
            const state = result['nychiq_ext_state'] || {};
            state.connected = true;
            state.jwt = message.jwt;
            const payload = decodeJWT(message.jwt);
            if (payload) {
              state.userId = payload.sub || payload.user_id || payload.userId;
            }
            chrome.storage.local.set({ 'nychiq_ext_state': state });
            chrome.action.setBadgeText({ text: '' });
            chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
          });
        }
        sendResponse({ ok });
      });
      return true; // async
    }

    if (message.type === 'AUTH_LOGOUT') {
      clearToken().then(() => {
        chrome.action.setBadgeText({ text: '' });
        sendResponse({ ok: true });
      });
      return true;
    }

    if (message.type === 'AUTH_VALIDATE') {
      validateToken().then(sendResponse);
      return true;
    }
  });
}

/* ── Storage helpers ── */

function chromeStorageGet(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => resolve(result[key]));
  });
}

function chromeStorageSet(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Token Cache
   Local token balance tracking with optimistic UI updates
   ══════════════════════════════════════════════════════════════════ */

const BALANCE_KEY = 'nychiq_token_balance';
const BALANCE_TTL = 5 * 60 * 1000; // 5 minutes
const API_BASE = 'https://nychiq-api.bm4413212.workers.dev/api';

/**
 * Fetch fresh token balance from API.
 */
export async function fetchBalance() {
  try {
    const { getToken } = await import('./auth-bridge.js');
    const jwt = await getToken();
    if (!jwt) return { balance: 0, error: 'not_authenticated' };

    const resp = await fetch(`${API_BASE}/auth/balance`, {
      headers: { 'Authorization': `Bearer ${jwt}` },
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return { balance: 0, error: errData.error || `http_${resp.status}` };
    }

    const data = await resp.json();
    const balance = data.balance ?? data.tokens ?? data.credits ?? 0;

    // Cache the result and reconcile any pending optimistic decrements
    await chromeStorageSet(BALANCE_KEY, {
      balance,
      fetchedAt: Date.now(),
      source: 'api',
      pendingDecrement: 0,
    });

    // Also update extension state
    const state = await chromeStorageGet('nychiq_ext_state') || {};
    state.tokensLeft = balance;
    await chromeStorageSet('nychiq_ext_state', state);

    return { balance, error: null };
  } catch (err) {
    return { balance: 0, error: err.message };
  }
}

/**
 * Get current balance (cached or fresh).
 */
export async function getBalance(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await chromeStorageGet(BALANCE_KEY);
    if (cached && Date.now() - cached.fetchedAt < BALANCE_TTL) {
      return { balance: cached.balance, source: 'cache', error: null };
    }
  }
  return fetchBalance();
}

/**
 * Optimistically decrement token count (before API confirms).
 * Used for immediate UI feedback when AI features are triggered.
 */
export async function decrementTokens(count) {
  const cached = await chromeStorageGet(BALANCE_KEY) || { balance: 0, fetchedAt: 0 };
  const optimisticBalance = Math.max(0, (cached.balance || 0) - count);

  await chromeStorageSet(BALANCE_KEY, {
    balance: optimisticBalance,
    fetchedAt: cached.fetchedAt || Date.now(),
    source: 'optimistic',
    pendingDecrement: (cached.pendingDecrement || 0) + count,
  });

  // Update extension state
  const state = await chromeStorageGet('nychiq_ext_state') || {};
  state.tokensLeft = optimisticBalance;
  await chromeStorageSet('nychiq_ext_state', state);

  return optimisticBalance;
}

/**
 * Reconcile optimistic balance with server truth.
 * Call after API confirms token usage.
 */
export async function reconcileBalance(serverBalance) {
  await chromeStorageSet(BALANCE_KEY, {
    balance: serverBalance,
    fetchedAt: Date.now(),
    source: 'server',
    pendingDecrement: 0,
  });

  const state = await chromeStorageGet('nychiq_ext_state') || {};
  state.tokensLeft = serverBalance;
  await chromeStorageSet('nychiq_ext_state', state);

  return serverBalance;
}

/**
 * Check if user has enough tokens for an operation.
 */
export async function hasTokens(required) {
  const { balance } = await getBalance();
  return balance >= required;
}

/**
 * Get token usage stats.
 */
export async function getUsageStats() {
  const cached = await chromeStorageGet(BALANCE_KEY) || {};
  return {
    balance: cached.balance || 0,
    lastFetched: cached.fetchedAt ? new Date(cached.fetchedAt).toISOString() : null,
    source: cached.source || 'none',
    pendingDecrement: cached.pendingDecrement || 0,
    isStale: !cached.fetchedAt || (Date.now() - cached.fetchedAt > BALANCE_TTL),
  };
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

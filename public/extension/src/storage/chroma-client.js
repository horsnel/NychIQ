/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Chroma Client
   Client for ChromaDB vector database via NychIQ Worker API
   Handles similarity search and embedding storage
   ══════════════════════════════════════════════════════════════════ */

const API_BASE = 'https://nychiq-api.bm4413212.workers.dev/api';
const COLLECTION_NAME = 'nychiq_content';

/**
 * Store an embedding with metadata in ChromaDB via the Worker API.
 */
export async function upsert(id, embedding, metadata = {}) {
  try {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(`${API_BASE}/vectors/upsert`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection: COLLECTION_NAME,
        ids: [id],
        embeddings: [embedding],
        metadatas: [metadata],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return { ok: false, error: err.error || `http_${resp.status}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Batch store multiple embeddings.
 */
export async function upsertBatch(items) {
  if (!items || items.length === 0) return { ok: true, count: 0 };

  try {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const ids = items.map(i => i.id);
    const embeddings = items.map(i => i.embedding);
    const metadatas = items.map(i => i.metadata || {});

    const resp = await fetch(`${API_BASE}/vectors/upsert`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection: COLLECTION_NAME,
        ids,
        embeddings,
        metadatas,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return { ok: false, error: err.error || `http_${resp.status}` };
    }

    return { ok: true, count: items.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Query similar embeddings from ChromaDB.
 */
export async function querySimilar(embedding, options = {}) {
  const { nResults = 5, where = {}, whereDocument = {} } = options;

  try {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const body = {
      collection: COLLECTION_NAME,
      queryEmbeddings: [embedding],
      nResults,
    };
    if (Object.keys(where).length > 0) body.where = where;
    if (Object.keys(whereDocument).length > 0) body.whereDocument = whereDocument;

    const resp = await fetch(`${API_BASE}/vectors/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return { ok: false, results: [], error: err.error || `http_${resp.status}` };
    }

    const data = await resp.json();
    return { ok: true, results: data.results || data };
  } catch (err) {
    return { ok: false, results: [], error: err.message };
  }
}

/**
 * Delete embeddings by IDs.
 */
export async function deleteByIds(ids) {
  if (!ids || ids.length === 0) return { ok: true };

  try {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(`${API_BASE}/vectors/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection: COLLECTION_NAME,
        ids,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return { ok: false, error: err.error || `http_${resp.status}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Get collection stats.
 */
export async function getStats() {
  try {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resp = await fetch(`${API_BASE}/vectors/stats`, {
      method: 'GET',
      headers,
    });

    if (!resp.ok) return { ok: false, count: 0 };

    const data = await resp.json();
    return { ok: true, count: data.count || 0 };
  } catch (err) {
    return { ok: false, count: 0, error: err.message };
  }
}

/* ── Auth helper ── */

async function getAuthToken() {
  // In service worker context, get from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise(resolve => {
      chrome.storage.local.get('nychiq_auth', result => {
        resolve(result?.nychiq_auth?.jwt || null);
      });
    });
  }
  return null;
}

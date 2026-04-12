/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Embeddings
   Generate text embeddings via offscreen Transformers.js
   Used for similarity search, content clustering, and recommendations
   ══════════════════════════════════════════════════════════════════ */

import { initPipeline, runInference, isReady, dispose } from './transformers-client.js';

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_TASK = 'feature-extraction';
let initialized = false;

/**
 * Initialize the embedding model.
 */
export async function initEmbeddings() {
  if (initialized && isReady()) return true;

  const ok = await initPipeline(EMBEDDING_TASK, EMBEDDING_MODEL, {
    pooled: true,
    normalize: true,
  });

  if (ok) initialized = true;
  return ok;
}

/**
 * Generate embedding vector for a single text.
 * Returns: number[] (384-dimensional vector)
 */
export async function embed(text) {
  if (!text || typeof text !== 'string') return null;

  if (!initialized) {
    const ok = await initEmbeddings();
    if (!ok) return null;
  }

  try {
    const response = await runInference(EMBEDDING_TASK, text, {
      pooling: 'mean',
      normalize: true,
    });

    if (!response) return null;

    // Unwrap from offscreen message envelope: { ok, result: actualData }
    let embedding = response;
    if (response && typeof response === 'object' && response.ok !== undefined && response.result !== undefined) {
      embedding = response.result;
    }

    // Transformers.js feature-extraction returns { data: Float32Array }
    if (embedding?.data && (Array.isArray(embedding.data) || embedding.data instanceof Float32Array)) {
      return Array.from(embedding.data);
    }
    if (Array.isArray(embedding)) {
      return embedding;
    }
    if (embedding && typeof embedding === 'object') {
      // Handle various output formats
      const values = Object.values(embedding).filter(v => typeof v === 'number');
      if (values.length > 0) return values;
    }

    return embedding;
  } catch (err) {
    console.error('[NychIQ] Embedding failed:', err);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts (batch).
 * Returns: number[][] array of embedding vectors
 */
export async function embedBatch(texts, batchSize = 8) {
  if (!Array.isArray(texts)) return [];

  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(batch.map(t => embed(t)));
    results.push(...embeddings);
  }

  return results;
}

/**
 * Compute cosine similarity between two vectors.
 * Returns: number between -1 and 1
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Find most similar items from a list given a query embedding.
 * Returns: sorted array of { index, similarity, item }
 */
export function findSimilar(queryEmbedding, items, topK = 5) {
  if (!queryEmbedding || !items || items.length === 0) return [];

  return items
    .map((item, index) => ({
      index,
      item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Dispose the embedding model and free memory.
 */
export async function disposeEmbeddings() {
  await dispose();
  initialized = false;
}

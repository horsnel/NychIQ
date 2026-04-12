/**
 * NychIQ Worker — Embeddings Routes
 * Fallback: Workers AI BGE → Gemini text-embedding-004 → HuggingFace MiniLM
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { rotateKey } from '../lib/fallback';

export const embeddingsRoutes = new Hono<{ Bindings: Env }>();

interface EmbeddingRequest {
  text: string | string[];
  model?: string;
}

interface EmbeddingResponse {
  embeddings: number[][];
  dimensions: number;
  source: string;
}

/**
 * POST /api/embeddings — Generate text embeddings
 * Body: { text: string | string[], model?: string }
 * Returns: { embeddings: number[][], dimensions: number, source: string }
 */
embeddingsRoutes.post('/', async (c) => {
  try {
    const { text, model } = await c.req.json<EmbeddingRequest>();

    if (!text) {
      return c.json({ error: 'text is required (string or string[])' }, 400);
    }

    const texts = Array.isArray(text) ? text : [text];

    // Validate total text length
    const totalChars = texts.reduce((sum, t) => sum + t.length, 0);
    if (totalChars > 50000) {
      return c.json({ error: 'Total text exceeds maximum length of 50,000 characters' }, 400);
    }

    // 1. Workers AI — BGE Large EN v1.5 (free, built-in, no key)
    try {
      const ai = c.env.AI;
      if (ai) {
        // Workers AI processes one text at a time
        const embeddings: number[][] = [];
        for (const t of texts) {
          const res = await ai.run('@cf/baai/bge-large-en-v1.5', {
            text: t,
            pooling: 'mean',
          });
          const vec = (res as any)?.data?.[0]?.embedding || (res as any)?.embedding;
          if (vec) embeddings.push(vec);
        }
        if (embeddings.length > 0) {
          return c.json({
            embeddings,
            dimensions: embeddings[0].length,
            source: 'workers-ai',
          } satisfies EmbeddingResponse);
        }
      }
    } catch (err: any) {
      console.error('Workers AI embeddings error:', err?.message);
    }

    // 2. Gemini text-embedding-004
    try {
      const key = rotateKey([c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2, c.env.GEMINI_KEY_3, c.env.GEMINI_KEY_4]);
      if (key) {
        const body = {
          model: 'text-embedding-004',
          requests: texts.map(t => ({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: t }] },
          })),
        };
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );
        if (res.ok) {
          const data: any = await res.json();
          const embeddings = (data.embeddings || []).map((e: any) => e.values || e);
          if (embeddings.length > 0) {
            return c.json({
              embeddings,
              dimensions: embeddings[0].length,
              source: 'gemini',
            } satisfies EmbeddingResponse);
          }
        }
      }
    } catch (err: any) {
      console.error('Gemini embeddings error:', err?.message);
    }

    // 3. HuggingFace — sentence-transformers/all-MiniLM-L6-v2
    try {
      const key = rotateKey([c.env.HF_TOKEN_1, c.env.HF_TOKEN_2]);
      if (key) {
        const body = {
          inputs: texts,
          options: { wait_for_model: true },
        };
        const res = await fetch(
          'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          }
        );
        if (res.ok) {
          const data: any = await res.json();
          const embeddings = (Array.isArray(data) ? data : []).map((d: any) => d.embedding);
          if (embeddings.length > 0) {
            return c.json({
              embeddings,
              dimensions: embeddings[0].length,
              source: 'huggingface',
            } satisfies EmbeddingResponse);
          }
        }
      }
    } catch (err: any) {
      console.error('HuggingFace embeddings error:', err?.message);
    }

    return c.json({ error: 'All embedding providers failed' }, 500);
  } catch (err: any) {
    console.error('Embeddings error:', err?.message);
    return c.json({ error: err?.message || 'Embedding generation failed' }, 500);
  }
});

/**
 * POST /api/embeddings/search — Vector similarity search via CloudFlare Vectorize
 * Body: { vector: number[], topK?: number, namespace?: string }
 * Returns: { matches: Array<{ id: string, score: number, metadata?: any }> }
 */
embeddingsRoutes.post('/search', async (c) => {
  try {
    const { vector, topK, namespace } = await c.req.json<{
      vector?: number[];
      topK?: number;
      namespace?: string;
    }>();

    if (!vector || !Array.isArray(vector)) {
      return c.json({ error: 'vector (number[]) is required' }, 400);
    }

    const vectors = c.env.VECTORS;
    if (!vectors) {
      return c.json({ error: 'Vectorize binding not configured' }, 500);
    }

    const matches = await vectors.query(vector, {
      topK: topK || 10,
      namespace: namespace || 'default',
      returnMetadata: true,
    });

    const matchList = (matches as any)?.matches || (Array.isArray(matches) ? matches : []);
    return c.json({
      matches: matchList.map((m: any) => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata,
      })),
    });
  } catch (err: any) {
    console.error('Vector search error:', err?.message);
    return c.json({ error: err?.message || 'Vector search failed' }, 500);
  }
});

/**
 * POST /api/embeddings/index — Store vectors in CloudFlare Vectorize
 * Body: { vectors: Array<{ id: string, values: number[], metadata?: any }>, namespace?: string }
 */
embeddingsRoutes.post('/index', async (c) => {
  try {
    const { vectors, namespace } = await c.req.json<{
      vectors: Array<{ id: string; values: number[]; metadata?: any }>;
      namespace?: string;
    }>();

    if (!vectors || !Array.isArray(vectors) || vectors.length === 0) {
      return c.json({ error: 'vectors array is required' }, 400);
    }

    if (vectors.length > 1000) {
      return c.json({ error: 'Maximum 1000 vectors per request' }, 400);
    }

    const vectorsDB = c.env.VECTORS;
    if (!vectorsDB) {
      return c.json({ error: 'Vectorize binding not configured' }, 500);
    }

    const ids = await vectorsDB.insert(
      vectors.map(v => ({
        id: v.id,
        values: v.values,
        metadata: v.metadata || {},
      }))
    );

    return c.json({ indexed: true, count: vectors.length, ids });
  } catch (err: any) {
    console.error('Vector index error:', err?.message);
    return c.json({ error: err?.message || 'Vector indexing failed' }, 500);
  }
});

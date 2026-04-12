/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — AI Web Worker (Firefox Offscreen Replacement)
   Runs Transformers.js WASM in a dedicated Worker thread
   Replaces Chrome's offscreen document approach
   ══════════════════════════════════════════════════════════════════ */

const CDN_URL = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
const CDN_FALLBACK = 'https://unpkg.com/@xenova/transformers@2.17.2';

let pipeline = null;
let currentTask = null;
let loadFailed = false;

/* ── CDN loader with fallback ── */

async function loadTransformers() {
  // Try primary CDN
  try {
    importScripts(CDN_URL);
    if (typeof transformers !== 'undefined') return;
  } catch (err) {
    console.warn('[NychIQ Worker] Primary CDN failed, trying fallback:', err.message);
  }

  // Try fallback CDN
  try {
    importScripts(CDN_FALLBACK);
    if (typeof transformers !== 'undefined') return;
  } catch (err) {
    console.error('[NychIQ Worker] Fallback CDN also failed:', err.message);
  }

  loadFailed = true;
  throw new Error('Failed to load Transformers.js from both CDNs');
}

/* ── Message handler ── */

self.onmessage = async function(event) {
  const { type, id, task, modelId, input, options } = event.data;

  try {
    // Lazy-load Transformers.js on first message
    if (!loadFailed && typeof transformers === 'undefined') {
      await loadTransformers();
    }

    if (loadFailed) {
      self.postMessage({ id, ok: false, error: 'Transformers.js failed to load. Check your internet connection.' });
      return;
    }

    let result;

    switch (type) {
      case 'TRANSFORMERS_INIT':
        result = await handleInit(task, modelId, options);
        break;
      case 'TRANSFORMERS_RUN':
        result = await handleRun(task, input, options);
        break;
      case 'TRANSFORMERS_DISPOSE':
        result = await handleDispose();
        break;
      default:
        self.postMessage({ id, ok: false, error: `Unknown message type: ${type}` });
        return;
    }

    self.postMessage({ id, ...result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err.message });
  }
};

/* ── Pipeline initialization ── */

async function handleInit(task, modelId, options = {}) {
  // Configure environment for worker context
  const env = transformers.env || {};
  env.allowLocalModels = false;
  if (options.cacheDir) env.cacheDir = options.cacheDir;

  // Dispose previous pipeline if task changed
  if (pipeline && currentTask !== task) {
    await pipeline.dispose();
    pipeline = null;
  }

  if (!pipeline) {
    // Select model based on task
    let model = modelId;
    if (!model) {
      const modelMap = {
        'sentiment': 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        'text-classification': 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        'token-classification': 'Xenova/dslim/bert-base-NER',
        'feature-extraction': 'Xenova/all-MiniLM-L6-v2',
        'fill-mask': 'Xenova/bert-base-uncased',
      };
      model = modelMap[task] || modelMap['feature-extraction'];
    }

    pipeline = await transformers.pipeline(task, model, {
      dtype: 'q8',
      ...options,
    });
    currentTask = task;
  }

  return { ok: true };
}

/* ── Inference execution ── */

async function handleRun(task, input, options = {}) {
  if (!pipeline) {
    // Auto-initialize if task specified
    if (task) {
      const initResult = await handleInit(task, null, options);
      if (!initResult.ok) return initResult;
    } else {
      return { ok: false, error: 'Pipeline not initialized' };
    }
  }

  // Ensure pipeline matches requested task
  if (task && currentTask !== task) {
    const initResult = await handleInit(task, null, options);
    if (!initResult.ok) return { ok: false, error: `Pipeline is ${currentTask}, need ${task}. Re-init failed.` };
  }

  let result = await pipeline(input, options);

  // Normalize result format
  if (result && Array.isArray(result)) {
    const normalized = result.map(r => {
      if (r.label !== undefined && r.score !== undefined) {
        return { label: r.label, score: r.score };
      }
      return r;
    });

    // For sentiment: combine into single score
    if (normalized.length >= 2) {
      const positive = normalized.find(r => r.label === 'POSITIVE');
      const negative = normalized.find(r => r.label === 'NEGATIVE');
      if (positive && negative) {
        return {
          ok: true,
          result: {
            score: (positive.score - negative.score),
            label: positive.score > negative.score ? 'positive' : 'negative',
            confidence: Math.max(positive.score, negative.score),
          },
        };
      }
    }

    return { ok: true, result: normalized[0] || null };
  }

  return { ok: true, result };
}

/* ── Cleanup ── */

async function handleDispose() {
  if (pipeline) {
    await pipeline.dispose();
    pipeline = null;
    currentTask = null;
  }
  return { ok: true };
}
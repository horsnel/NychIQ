/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Offscreen Document
   Handles Transformers.js WASM execution for on-device AI
   ══════════════════════════════════════════════════════════════════ */

let pipeline = null;
let currentTask = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRANSFORMERS_INIT') {
    handleInit(message).then(sendResponse).catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === 'TRANSFORMERS_RUN') {
    handleRun(message).then(sendResponse).catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === 'TRANSFORMERS_DISPOSE') {
    handleDispose().then(sendResponse);
    return true;
  }

  return false;
});

async function handleInit(message) {
  try {
    const { task, modelId, options = {} } = message;

    // Dynamic import of Transformers.js
    // Will be loaded from CDN when first used
    const { pipeline: createPipeline, env } = await import(
      /* webpackIgnore: true */
      'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'
    );

    // Configure for browser
    env.allowLocalModels = false;
    if (options.cacheDir) env.cacheDir = options.cacheDir;

    // Dispose previous pipeline if different task
    if (pipeline && currentTask !== task) {
      await pipeline.dispose();
      pipeline = null;
    }

    if (!pipeline) {
      // Select appropriate model based on task
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

      pipeline = await createPipeline(task, model, {
        dtype: 'q8',
        ...options,
      });
      currentTask = task;
    }

    return { ok: true };
  } catch (err) {
    console.error('[NychIQ Offscreen] Init failed:', err);
    pipeline = null;
    currentTask = null;
    return { ok: false, error: err.message };
  }
}

async function handleRun(message) {
  try {
    const { task, input, options = {} } = message;

    if (!pipeline) {
      // Try to auto-initialize if task specified
      if (task) {
        const initResult = await handleInit(message);
        if (!initResult.ok) return initResult;
      } else {
        return { ok: false, error: 'Pipeline not initialized' };
      }
    }

    // Ensure pipeline matches requested task
    if (task && currentTask !== task) {
      const initResult = await handleInit(message);
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
          return { ok: true, result: { score: (positive.score - negative.score), label: positive.score > negative.score ? 'positive' : 'negative', confidence: Math.max(positive.score, negative.score) } };
        }
      }

      return { ok: true, result: normalized[0] || null };
    }

    return { ok: true, result };
  } catch (err) {
    console.error('[NychIQ Offscreen] Run failed:', err);
    return { ok: false, error: err.message };
  }
}

async function handleDispose() {
  try {
    if (pipeline) {
      await pipeline.dispose();
      pipeline = null;
      currentTask = null;
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

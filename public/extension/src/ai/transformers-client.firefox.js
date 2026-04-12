/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Transformers Client (Firefox Variant)
   Uses Web Worker instead of Chrome's offscreen document API
   Firefox background scripts can spawn Workers unlike Chrome SW
   ══════════════════════════════════════════════════════════════════ */

const MODEL_STATUS = { NONE: 'none', LOADING: 'loading', READY: 'ready', ERROR: 'error' };

let currentStatus = MODEL_STATUS.NONE;
let currentTask = null;
let currentModel = null;
let worker = null;
let messageId = 0;
const pendingMessages = new Map();

/**
 * Initialize a transformer pipeline via Web Worker.
 * Firefox background scripts support Worker creation.
 */
export async function initPipeline(task, modelId, options = {}) {
  try {
    currentStatus = MODEL_STATUS.LOADING;
    currentTask = task;
    currentModel = modelId;

    await ensureWorker();

    const response = await sendToWorker({
      type: 'TRANSFORMERS_INIT',
      task,
      modelId,
      options,
    });

    if (response?.ok) {
      currentStatus = MODEL_STATUS.READY;
      return true;
    }

    currentStatus = MODEL_STATUS.ERROR;
    return false;
  } catch (err) {
    currentStatus = MODEL_STATUS.ERROR;
    console.error('[NychIQ Firefox] Transformers init failed:', err);
    return false;
  }
}

/**
 * Run inference via Web Worker.
 */
export async function runInference(task, input, options = {}) {
  if (currentStatus !== MODEL_STATUS.READY) return null;

  try {
    await ensureWorker();
    const response = await sendToWorker({
      type: 'TRANSFORMERS_RUN',
      task,
      input,
      options,
    });
    return response?.result || null;
  } catch (err) {
    console.error('[NychIQ Firefox] Inference failed:', err);
    return null;
  }
}

/**
 * Get current model status.
 */
export function getStatus() {
  return {
    status: currentStatus,
    task: currentTask,
    model: currentModel,
  };
}

/**
 * Check if model is ready for inference.
 */
export function isReady() {
  return currentStatus === MODEL_STATUS.READY;
}

/**
 * Dispose current model and free memory.
 */
export async function dispose() {
  try {
    await sendToWorker({ type: 'TRANSFORMERS_DISPOSE' });
  } catch { /* silent */ }
  currentStatus = MODEL_STATUS.NONE;
  currentTask = null;
  currentModel = null;
  terminateWorker();
}

/**
 * Create a Web Worker for WASM execution.
 * Firefox allows Worker creation from background scripts (Chrome does not).
 */
async function ensureWorker() {
  if (worker && currentStatus !== MODEL_STATUS.ERROR) return;

  terminateWorker();

  const workerUrl = browser.runtime.getURL('src/ai/ai-worker.js');

  worker = new Worker(workerUrl);

  worker.onmessage = (event) => {
    const { id, ...payload } = event.data;
    const resolver = pendingMessages.get(id);
    if (resolver) {
      pendingMessages.delete(id);
      resolver(payload);
    }
  };

  worker.onerror = (err) => {
    console.error('[NychIQ Firefox] Worker error:', err);
    currentStatus = MODEL_STATUS.ERROR;

    // Reject all pending messages
    for (const [id, resolver] of pendingMessages) {
      resolver({ ok: false, error: 'Worker crashed' });
      pendingMessages.delete(id);
    }
  };

  // Wait for worker to be ready (it loads transformers.js via importScripts)
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Send message to worker and wait for response.
 */
function sendToWorker(data) {
  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(new Error('Worker not available'));
      return;
    }

    const id = ++messageId;
    const timeout = setTimeout(() => {
      pendingMessages.delete(id);
      reject(new Error('Worker timeout'));
    }, 60000); // 60s timeout for model loading

    pendingMessages.set(id, (response) => {
      clearTimeout(timeout);
      resolve(response);
    });

    worker.postMessage({ ...data, id });
  });
}

/**
 * Terminate the worker and clean up.
 */
function terminateWorker() {
  if (worker) {
    try { worker.terminate(); } catch { /* silent */ }
    worker = null;
  }
  // Clear pending messages
  for (const [id, resolver] of pendingMessages) {
    resolver({ ok: false, error: 'Worker terminated' });
  }
  pendingMessages.clear();
}
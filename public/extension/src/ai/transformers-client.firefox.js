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

  // Wait for worker to signal ready (replaces fragile setTimeout)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      // Fallback: if no ready signal after 2s, proceed anyway
      // (worker may have already sent messages before we set up onmessage)
      console.warn('[NychIQ Firefox] Worker ready signal timeout — proceeding anyway');
      resolve();
    }, 2000);

    const originalHandler = worker.onmessage;
    worker.onmessage = (event) => {
      if (event.data.type === 'WORKER_READY') {
        clearTimeout(timeout);
        // Restore the real message handler
        worker.onmessage = (e) => {
          const { id, ...payload } = e.data;
          const resolver = pendingMessages.get(id);
          if (resolver) {
            pendingMessages.delete(id);
            resolver(payload);
          }
        };
        resolve();
      } else {
        // Worker sent a message before ready — buffer it via original handler
        originalHandler.call(worker, event);
      }
    };
  });
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
    }, 180000); // 3 minutes — first-time model download can be ~200MB

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
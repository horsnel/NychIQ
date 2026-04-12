/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Transformers.js Client
   On-device AI model management via offscreen document
   ══════════════════════════════════════════════════════════════════ */

const MODEL_STATUS = { NONE: 'none', LOADING: 'loading', READY: 'ready', ERROR: 'error' };

let currentStatus = MODEL_STATUS.NONE;
let currentTask = null;
let currentModel = null;
let offscreenDoc = null;

/**
 * Initialize a transformer pipeline via offscreen document.
 */
export async function initPipeline(task, modelId, options = {}) {
  try {
    currentStatus = MODEL_STATUS.LOADING;
    currentTask = task;
    currentModel = modelId;

    await ensureOffscreenDocument();

    const response = await chrome.runtime.sendMessage({
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
    console.error('[NychIQ] Transformers init failed:', err);
    return false;
  }
}

/**
 * Run inference via offscreen document.
 */
export async function runInference(task, input, options = {}) {
  if (currentStatus !== MODEL_STATUS.READY) return null;

  try {
    await ensureOffscreenDocument();
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSFORMERS_RUN',
      task,
      input,
      options,
    });
    return response?.result || null;
  } catch (err) {
    console.error('[NychIQ] Inference failed:', err);
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
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({ type: 'TRANSFORMERS_DISPOSE' });
  } catch { /* silent */ }
  currentStatus = MODEL_STATUS.NONE;
  currentTask = null;
  currentModel = null;
}

/**
 * Create offscreen document for WASM execution.
 */
async function ensureOffscreenDocument() {
  if (offscreenDoc) return;

  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')],
  });

  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['WORKERS'],
    justification: 'Transformers.js WASM execution for on-device AI',
  });
  offscreenDoc = true;
}

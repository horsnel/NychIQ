/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Proxy Rotator
   Rotate API requests through multiple endpoints for reliability
   ══════════════════════════════════════════════════════════════════ */

const FALLBACK_ENDPOINTS = [
  'https://nychiq-api.bm4413212.workers.dev/api',
  'https://nychiq-api.bm4413212.workers.dev/api/v1',
];

let currentEndpointIndex = 0;
let failureCounts = {};
const MAX_FAILURES = 3;

/**
 * Get the current best endpoint.
 */
export function getCurrentEndpoint() {
  return FALLBACK_ENDPOINTS[currentEndpointIndex] || FALLBACK_ENDPOINTS[0];
}

/**
 * Get all configured endpoints.
 */
export function getEndpoints() {
  return [...FALLBACK_ENDPOINTS];
}

/**
 * Record a successful request (resets failure count).
 */
export function recordSuccess(endpoint) {
  const key = endpoint || getCurrentEndpoint();
  failureCounts[key] = 0;
}

/**
 * Record a failed request and rotate if needed.
 * Returns the next endpoint to try, or the same one if no rotation needed.
 */
export function recordFailure(endpoint) {
  const key = endpoint || getCurrentEndpoint();
  failureCounts[key] = (failureCounts[key] || 0) + 1;

  if (failureCounts[key] >= MAX_FAILURES) {
    // Rotate to next endpoint
    currentEndpointIndex = (currentEndpointIndex + 1) % FALLBACK_ENDPOINTS.length;
    console.debug(`[NychIQ] Rotating proxy to: ${FALLBACK_ENDPOINTS[currentEndpointIndex]} (after ${MAX_FAILURES} failures on ${key})`);
    return FALLBACK_ENDPOINTS[currentEndpointIndex];
  }

  return getCurrentEndpoint();
}

/**
 * Reset all failure counts (e.g. on network reconnect).
 */
export function resetFailures() {
  failureCounts = {};
  currentEndpointIndex = 0;
}

/**
 * Check proxy health status.
 */
export function getHealthStatus() {
  return {
    currentEndpoint: getCurrentEndpoint(),
    endpoints: FALLBACK_ENDPOINTS.map(ep => ({
      url: ep,
      active: ep === getCurrentEndpoint(),
      failures: failureCounts[ep] || 0,
      healthy: (failureCounts[ep] || 0) < MAX_FAILURES,
    })),
  };
}

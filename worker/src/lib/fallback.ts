/**
 * NychIQ Worker — Fallback chain utilities
 * Handles key rotation, provider fallback, and OpenAI-compatible chat.
 */

/**
 * Rotate through an array of keys based on current time.
 * Distributes load evenly across all keys.
 */
export function rotateKey(keys: (string | undefined)[]): string | undefined {
  const active = keys.filter(Boolean) as string[];
  if (active.length === 0) return undefined;
  return active[Math.floor(Date.now() / 1000) % active.length];
}

/**
 * Rotate to the next key in the array (skip the excluded key).
 * Used for retrying with a different key when one hits quota.
 */
export function rotateNextKey(keys: (string | undefined)[], excludeKey?: string): string | undefined {
  const active = (keys.filter(Boolean) as string[]).filter(k => k !== excludeKey);
  if (active.length === 0) return undefined;
  return active[Math.floor(Date.now() / 1000) % active.length];
}

/**
 * Generic fallback chain — tries each provider in order until one succeeds.
 * Each attempt has an optional timeout (default 15s).
 */
export async function withFallback<T>(
  attempts: Array<{ name: string; fn: () => Promise<T>; timeout?: number }>,
  context: string
): Promise<T> {
  const errors: Array<{ provider: string; error: string }> = [];
  for (const attempt of attempts) {
    try {
      const result = await Promise.race([
        attempt.fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), attempt.timeout ?? 15000)
        ),
      ]);
      return result;
    } catch (err: any) {
      errors.push({ provider: attempt.name, error: err?.message || String(err) });
      continue;
    }
  }
  throw new Error(`All providers failed for ${context}: ${JSON.stringify(errors)}`);
}

/**
 * OpenAI-compatible chat completion request.
 * Works with Groq, Cerebras, OpenRouter, and any OpenAI-compatible API.
 */
export async function openAIChat(
  baseUrl: string,
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string,
  stream: boolean = false,
  extra?: Record<string, unknown>
): Promise<Response> {
  const url = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream, ...extra }),
  });
}

/**
 * Gemini-native chat completion (non-OpenAI format).
 * Uses the generateContent endpoint.
 */
export async function geminiChat(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string = 'gemini-2.0-flash',
  stream: boolean = false
): Promise<Response> {
  // Convert system messages to Gemini systemInstruction
  const systemParts = messages
    .filter(m => m.role === 'system')
    .map(m => m.content);
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = { contents };
  if (systemParts.length > 0) {
    body.systemInstruction = {
      parts: systemParts.map(text => ({ text })),
    };
  }
  if (stream) {
    body.generationConfig = { responseMimeType: 'text/event-stream' };
  }

  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

/**
 * Collect AI keys into an array for rotation.
 */
export function getKeys(env: Record<string, string | undefined>, prefix: string, count: number = 3): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= count; i++) {
    const k = env[`${prefix}_${i}`];
    if (k) keys.push(k);
  }
  return keys;
}

/**
 * Execute a YouTube API v3 request with key rotation on quota errors (403).
 * Tries all available keys before giving up.
 */
export async function ytV3WithRetry<T>(
  keys: (string | undefined)[],
  buildUrl: (key: string) => string,
  parseResponse: (res: Response) => Promise<T>,
  timeout: number = 10000,
): Promise<T> {
  const active = keys.filter(Boolean) as string[];
  const errors: string[] = [];

  for (let i = 0; i < active.length; i++) {
    const key = active[(Math.floor(Date.now() / 1000) + i) % active.length];
    try {
      const res = await Promise.race([
        fetch(buildUrl(key)),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);
      if (res.ok) {
        return await parseResponse(res);
      }
      // If 403 with quotaExceeded, try next key
      if (res.status === 403) {
        const body = await res.text().catch(() => '');
        errors.push(`Key ${i + 1}: ${res.status} ${body.slice(0, 100)}`);
        continue;
      }
      throw new Error(`YouTube v3 ${res.status}`);
    } catch (err: any) {
      errors.push(`Key ${i + 1}: ${err?.message || String(err)}`);
      continue;
    }
  }
  throw new Error(`All YouTube keys failed: ${JSON.stringify(errors)}`);
}

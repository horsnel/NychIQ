/* ── NychIQ API helpers ──
 * These proxy through Next.js API routes so the backend
 * can use z-ai-web-dev-sdk securely.
 */

const API_BASE = '/api';

/* ── YouTube Data API proxy ── */
export async function ytFetch(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<any> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  });
  const url = `${API_BASE}/youtube/${endpoint}?${sp.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `YouTube API error: ${res.status}`);
  }
  return res.json();
}

/* ── Groq AI chat (non-streaming) ── */
export async function askAI(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `AI API error: ${res.status}`);
  }
  const data = await res.json();
  return data.text ?? data.content ?? '';
}

/* ── Groq AI streaming ── */
export async function askAIStream(
  messages: Array<{ role: string; content: string }>,
  onToken: (token: string, fullText: string) => void,
  onDone: (fullText: string) => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/ai/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      throw new Error(`AI Stream error: ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone(fullText);
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            onToken(token, fullText);
          }
        } catch {
          // skip malformed JSON chunks
        }
      }
    }

    onDone(fullText);
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}

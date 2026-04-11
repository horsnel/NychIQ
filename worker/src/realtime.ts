/**
 * NychIQ Worker — Realtime Durable Object
 * Handles WebSocket connections for real-time features (notifications, live updates).
 */

export class RealtimeRoom {
  private state: DurableObjectState;
  private sessions: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

      this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // HTTP: broadcast a message to all connected clients
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const body = await request.json<{ event: string; data: unknown }>();
      this.broadcast(body.event, body.data);
      return new Response(JSON.stringify({ ok: true, clients: this.sessions.size }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // HTTP: get room info
    if (url.pathname === '/info') {
      return new Response(
        JSON.stringify({ clients: this.sessions.size }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not found', { status: 404 });
  }

  private handleSession(ws: WebSocket) {
    ws.accept();
    this.sessions.add(ws);

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        // Echo back or handle specific message types
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.addEventListener('close', () => {
      this.sessions.delete(ws);
    });

    ws.addEventListener('error', () => {
      this.sessions.delete(ws);
    });
  }

  private broadcast(event: string, data: unknown) {
    const message = JSON.stringify({ event, data, timestamp: Date.now() });
    for (const ws of this.sessions) {
      try {
        ws.send(message);
      } catch {
        this.sessions.delete(ws);
      }
    }
  }
}

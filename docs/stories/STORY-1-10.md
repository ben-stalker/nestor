# STORY-1.10: WebSocket server scaffold

**Epic:** EPIC-1: Project Foundation & Dev Environment
**Sprint:** 2 — Profiles, Shell, & Plumbing
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** a WebSocket endpoint at `/ws` that broadcasts JSON frames to all connected clients
**So that** alerts and voice status can push to the UI

---

## Acceptance Criteria

- [ ] `ws` package mounted on the same Express HTTP server at path `/ws`
- [ ] `server/src/ws/server.ts` exposes `attachWsServer(httpServer): WsServer` and the singleton exposes `broadcast(msg: WsMessage)` and `send(clientId, msg)`
- [ ] `WsMessage` is a discriminated union: `{ type: 'alert:new', alert }`, `{ type: 'alert:dismissed', id }`, `{ type: 'voice:status', status }`, `{ type: 'calendar:synced', accountId, eventCount }`, `{ type: 'settings:updated', keys }`
- [ ] Subscribes to event-bus events `alert:new`, `alert:dismissed`, `voice:status`, `calendar:synced`, `settings:updated` and re-broadcasts each to all connected clients
- [ ] Heartbeat: server sends `ping` frames every 30 seconds; clients that miss two pongs are terminated and pruned
- [ ] Each client gets a unique `clientId` (UUID) on connect; logged on connect/disconnect
- [ ] Client-side hook `client/src/shared/hooks/useWebSocket.ts` connects to `ws://<host>/ws`, parses incoming JSON, dispatches via callback or store update, and reconnects with exponential back-off (1s, 2s, 4s, 8s, capped at 30s)
- [ ] On reconnect, the hook fires a callback so consumers can refetch any state they cached
- [ ] Connection survives one minute of silence without close (heartbeat works)

---

## Technical Implementation

### Files to create / modify

- `server/src/ws/server.ts`
- `server/src/ws/messages.ts` — shared `WsMessage` types (also imported by client via path alias or copy)
- `server/src/index.ts` — call `attachWsServer(httpServer)` after `app.listen`
- `client/src/shared/hooks/useWebSocket.ts`
- `client/src/shared/types/wsMessages.ts` — mirror of server types
- `server/tests/ws/server.test.ts`
- `client/tests/shared/hooks/useWebSocket.test.tsx`

### Implementation steps

1. Install `ws` and `@types/ws` in the server workspace.
2. Refactor `server/src/index.ts` to keep a reference to the underlying `http.Server` returned by `app.listen()`, so the WS server can attach to it.
3. `server/src/ws/server.ts`:
```ts
import { WebSocketServer } from 'ws';
import { eventBus } from '../core/eventBus';
const clients = new Map<string, { ws: WebSocket; alive: boolean }>();
export function attachWsServer(httpServer: http.Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  wss.on('connection', (ws) => {
    const id = randomUUID();
    clients.set(id, { ws, alive: true });
    ws.on('pong', () => { const c = clients.get(id); if (c) c.alive = true; });
    ws.on('close', () => clients.delete(id));
  });
  setInterval(() => {
    for (const [id, c] of clients) {
      if (!c.alive) { c.ws.terminate(); clients.delete(id); continue; }
      c.alive = false; c.ws.ping();
    }
  }, 30_000);
  // Subscribe event bus → broadcast
  eventBus.on('alert:new', (alert) => broadcast({ type: 'alert:new', alert }));
  eventBus.on('alert:dismissed', (p) => broadcast({ type: 'alert:dismissed', id: p.id }));
  eventBus.on('voice:status', (p) => broadcast({ type: 'voice:status', status: p.status }));
  eventBus.on('calendar:synced', (p) => broadcast({ type: 'calendar:synced', ...p }));
  eventBus.on('settings:updated', (p) => broadcast({ type: 'settings:updated', keys: p.keys }));
}
function broadcast(msg) { const json = JSON.stringify(msg); for (const c of clients.values()) c.ws.send(json); }
```
4. `client/src/shared/hooks/useWebSocket.ts`:
```ts
export function useWebSocket(handlers: Partial<Record<WsMessage['type'], (m: WsMessage) => void>>) {
  useEffect(() => {
    let ws: WebSocket; let attempt = 0; let stopped = false;
    const connect = () => {
      ws = new WebSocket(`ws://${location.host}/ws`);
      ws.onopen = () => { attempt = 0; handlers['__open__']?.(); };
      ws.onmessage = (e) => { const m: WsMessage = JSON.parse(e.data); handlers[m.type]?.(m); };
      ws.onclose = () => { if (stopped) return; const wait = Math.min(30_000, 1000 * 2 ** attempt); attempt += 1; setTimeout(connect, wait); };
    };
    connect();
    return () => { stopped = true; ws.close(); };
  }, []);
}
```
5. Mount `useWebSocket` in the app root (after STORY-2.7 lands, attach handlers for alert count and voice status; for now a placeholder consumer).
6. Wire Vite proxy (already done in STORY-1.6) to forward `/ws` to `ws://localhost:3000`.
7. Write server test: open a client, send via `eventBus.emit('alert:new', …)`, assert the client receives the broadcast.
8. Write client test: mock `WebSocket`, dispatch a message, assert the matching handler is invoked; close and assert reconnect attempts.

### Key technical details

- Architecture §"API Architecture" — WebSocket at `/ws` for alert/voice push.
- Heartbeat is critical — without it, NAT/proxy timeouts silently kill connections.
- Architecture §"Component 5: Alert Engine" defines this WS broadcast contract.
- Vite dev proxy must include `{ '/ws': { target: 'ws://localhost:3000', ws: true } }` (set in STORY-1.6).
- Don't reinvent reconnection — the simple exponential back-off above is sufficient. No subscription protocol — server pushes everything.

---

## Dependencies

- **Blocked by:** STORY-1.9, STORY-1.7
- **Blocks:** STORY-3.6, STORY-5.7, STORY-11.2, STORY-14.4, STORY-15.6

---

## Test Checklist

- [ ] Integration: server emits `alert:new` → client `onmessage` fires with parsed payload
- [ ] Integration: 30s no-traffic period → ping/pong keeps connection alive
- [ ] Integration: kill server process → client attempts reconnect with back-off
- [ ] Unit: `WsMessage` discriminated union compiles type-safely on both ends
- [ ] Manual: open two browser tabs; trigger an alert from one; both receive the WS message

---

## Notes

- For Phase 1 there is no per-client subscription — every client gets every message. This is fine on a household LAN with ~3 clients.
- TLS is not needed (LAN); Tailscale handles encryption for remote access.
- When `client/dist` is served by Express in production, the WS connects to the same host:port; in dev it goes via Vite proxy.

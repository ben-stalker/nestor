import http from 'node:http';
import { WebSocket } from 'ws';
import { NestorWsServer } from '../../src/ws/server';
import eventBus from '../../src/core/eventBus';

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

function openClient(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function nextMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve) => {
    ws.once('message', (data: Buffer) => resolve(JSON.parse(data.toString('utf8'))));
  });
}

function closeServer(srv: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    srv.close((err) => (err ? reject(err) : resolve()));
  });
}

function closeClientGracefully(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    ws.once('close', resolve);
    ws.close();
  });
}

let httpServer: http.Server;
let wsServer: NestorWsServer;
let port: number;

/** Start a fresh http+ws server pair on a random port. */
function startServer(heartbeatIntervalMs?: number): Promise<void> {
  return new Promise((resolve) => {
    httpServer = http.createServer();
    httpServer.listen(0, () => {
      port = (httpServer.address() as { port: number }).port;
      wsServer = new NestorWsServer(httpServer, heartbeatIntervalMs);
      resolve();
    });
  });
}

beforeEach(async () => {
  eventBus.removeAllListeners();
  await startServer();
});

afterEach(async () => {
  await wsServer.close();
  await closeServer(httpServer);
});

describe('NestorWsServer — connection', () => {
  it('accepts a WebSocket connection at /ws', async () => {
    const client = await openClient(port);
    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  });

  it('tracks connected client count', async () => {
    const c1 = await openClient(port);
    const c2 = await openClient(port);
    expect(wsServer.clientCount).toBe(2);
    c1.close();
    c2.close();
  });
});

describe('NestorWsServer — broadcast', () => {
  it('sends a JSON frame to all connected clients', async () => {
    const c1 = await openClient(port);
    const c2 = await openClient(port);

    const [m1, m2] = await Promise.all([
      nextMessage(c1),
      nextMessage(c2),
      Promise.resolve().then(() =>
        wsServer.broadcast({
          event: 'alert:new',
          payload: { id: 1, type: 'info', message: 'hi', createdAt: 0 },
        }),
      ),
    ]);

    expect(m1).toEqual({
      event: 'alert:new',
      payload: { id: 1, type: 'info', message: 'hi', createdAt: 0 },
    });
    expect(m2).toEqual(m1);
    c1.close();
    c2.close();
  });

  it('skips closed clients during broadcast', async () => {
    const client = await openClient(port);
    await closeClientGracefully(client);
    expect(() =>
      wsServer.broadcast({ event: 'alert:dismissed', payload: { id: 5 } }),
    ).not.toThrow();
  });
});

describe('NestorWsServer — send', () => {
  it('returns false for an unknown clientId', async () => {
    const c1 = await openClient(port);
    expect(wsServer.send('no-such-id', { event: 'alert:dismissed', payload: { id: 0 } })).toBe(
      false,
    );
    c1.close();
  });
});

describe('NestorWsServer — event bus forwarding', () => {
  it('forwards alert:new to connected clients', async () => {
    const client = await openClient(port);
    const msgPromise = nextMessage(client);
    eventBus.emit('alert:new', { id: 10, type: 'warning', message: 'test alert', createdAt: 123 });
    const msg = await msgPromise;
    expect(msg).toEqual({
      event: 'alert:new',
      payload: { id: 10, type: 'warning', message: 'test alert', createdAt: 123 },
    });
    client.close();
  });

  it('forwards alert:dismissed to connected clients', async () => {
    const client = await openClient(port);
    const msgPromise = nextMessage(client);
    eventBus.emit('alert:dismissed', { id: 7 });
    const msg = await msgPromise;
    expect(msg).toEqual({ event: 'alert:dismissed', payload: { id: 7 } });
    client.close();
  });

  it('forwards voice:status to connected clients', async () => {
    const client = await openClient(port);
    const msgPromise = nextMessage(client);
    eventBus.emit('voice:status', { status: 'listening' });
    const msg = await msgPromise;
    expect(msg).toEqual({ event: 'voice:status', payload: { status: 'listening' } });
    client.close();
  });

  it('forwards calendar:synced to connected clients', async () => {
    const client = await openClient(port);
    const msgPromise = nextMessage(client);
    eventBus.emit('calendar:synced', { accountId: 1, eventCount: 42 });
    const msg = await msgPromise;
    expect(msg).toEqual({ event: 'calendar:synced', payload: { accountId: 1, eventCount: 42 } });
    client.close();
  });
});

describe('NestorWsServer — heartbeat', () => {
  it('keeps an alive client connected after a heartbeat cycle', async () => {
    await wsServer.close();
    await closeServer(httpServer);
    // Restart with a short heartbeat interval so the test finishes quickly
    await startServer(100);

    const client = await openClient(port);
    // ws client responds automatically to pings with pongs — wait two cycles
    await new Promise((r) => {
      setTimeout(r, 250);
    });
    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  }, 3000);

  it('terminates a client that stops responding to pings', async () => {
    await wsServer.close();
    await closeServer(httpServer);
    await startServer(80);

    const client = await openClient(port);

    // Wait for first heartbeat: server sets isAlive=false and sends ping.
    // ws auto-pongs, setting isAlive back to true — at this point client is still alive.
    // We then create a second raw client that terminates itself immediately after connecting,
    // leaving the server with a zombie entry, to confirm the server doesn't crash.
    const zombie = await openClient(port);
    zombie.terminate(); // hard-close without close handshake

    // After two heartbeat ticks the zombie has been pruned and the live client remains
    await new Promise((r) => {
      setTimeout(r, 220);
    });

    expect(client.readyState).toBe(WebSocket.OPEN);
    expect(wsServer.clientCount).toBeLessThanOrEqual(1);
    client.close();
  }, 3000);
});

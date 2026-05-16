import { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import type { Server as HttpServer } from 'node:http';
import eventBus from '../core/eventBus';
import type { EventMap } from '../core/eventBus.types';
import logger from '../utils/logger';

export interface WsFrame {
  event: keyof EventMap;
  payload: EventMap[keyof EventMap];
}

interface NestorClient extends WebSocket {
  clientId: string;
  isAlive: boolean;
}

const DEFAULT_HEARTBEAT_MS = 30_000;

export class NestorWsServer {
  private wss: WebSocketServer;

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(httpServer: HttpServer, heartbeatIntervalMs = DEFAULT_HEARTBEAT_MS) {
    this.wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    this.wss.on('connection', this.onConnection.bind(this));
    this.startHeartbeat(heartbeatIntervalMs);
    this.subscribeToEventBus();
  }

  // eslint-disable-next-line class-methods-use-this
  private onConnection(ws: WebSocket, _req: IncomingMessage): void {
    const client = ws as NestorClient;
    client.clientId = randomUUID();
    client.isAlive = true;

    client.on('pong', () => {
      client.isAlive = true;
    });

    client.on('error', (err) => {
      logger.error({ err, clientId: client.clientId }, 'WebSocket client error');
    });

    logger.info({ clientId: client.clientId }, 'WebSocket client connected');

    client.on('close', () => {
      logger.info({ clientId: client.clientId }, 'WebSocket client disconnected');
    });
  }

  private startHeartbeat(intervalMs: number): void {
    this.heartbeatTimer = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = ws as NestorClient;
        if (!client.isAlive) {
          logger.warn({ clientId: client.clientId }, 'WebSocket client unresponsive — terminating');
          client.terminate();
          return;
        }
        client.isAlive = false;
        client.ping();
      });
    }, intervalMs);
  }

  private subscribeToEventBus(): void {
    const forward =
      <K extends keyof EventMap>(event: K) =>
      (payload: EventMap[K]) => {
        this.broadcast({ event, payload });
      };

    eventBus.on('alert:new', forward('alert:new'));
    eventBus.on('alert:dismissed', forward('alert:dismissed'));
    eventBus.on('voice:status', forward('voice:status'));
    eventBus.on('calendar:synced', forward('calendar:synced'));
    eventBus.on('settings:updated', forward('settings:updated'));
    eventBus.on('shopping:updated', forward('shopping:updated'));
    eventBus.on('board:message_new', forward('board:message_new'));
  }

  broadcast(msg: WsFrame): void {
    const data = JSON.stringify(msg);
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  send(clientId: string, msg: WsFrame): boolean {
    const data = JSON.stringify(msg);
    const target = Array.from(this.wss.clients).find(
      (ws) => (ws as NestorClient).clientId === clientId && ws.readyState === WebSocket.OPEN,
    ) as NestorClient | undefined;
    if (!target) return false;
    target.send(data);
    return true;
  }

  close(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    return new Promise((resolve, reject) => {
      this.wss.close((err) => (err ? reject(err) : resolve()));
    });
  }

  get clientCount(): number {
    return this.wss.clients.size;
  }
}

let instance: NestorWsServer | null = null;

export function createWsServer(httpServer: HttpServer): NestorWsServer {
  instance = new NestorWsServer(httpServer);
  return instance;
}

export function getWsServer(): NestorWsServer | null {
  return instance;
}

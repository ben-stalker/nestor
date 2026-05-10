import createApp from './app';
import { closeDb, getDb } from './db/connection';
import { runMigrations } from './db/migrationRunner';
import { Scheduler, registerBuiltinJobs } from './scheduler';
import logger from './utils/logger';
import { createWsServer } from './ws/server';

const PORT = Number(process.env.NESTOR_PORT ?? 3000);

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
  process.exit(1);
});

const db = getDb();
runMigrations(db);

const app = createApp();
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server listening');
});

const wsServer = createWsServer(server);

registerBuiltinJobs();
logger.info({ jobs: Scheduler.list().map((j) => j.name) }, 'Scheduler started');

const SHUTDOWN_TIMEOUT_MS = 10_000;

function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutdown signal received');
  const timer = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  timer.unref();

  Scheduler.stop();
  void wsServer.close().finally(() => {
    server.close(() => {
      closeDb();
      logger.info('Server closed cleanly');
      process.exit(0);
    });
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

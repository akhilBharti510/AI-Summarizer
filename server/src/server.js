import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDb, disconnectDb } from './config/db.js';

const server = http.createServer(app);

async function start() {
  try {
    await connectDb();
    server.listen(env.PORT, () => {
      logger.info(`🚀 ${env.APP_NAME} API listening on :${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    logger.error('Failed to start server', { err: err.message });
    process.exit(1);
  }
}

function shutdown(signal) {
  return async () => {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
      await disconnectDb();
      logger.info('Process exit 0');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after 10s');
      process.exit(1);
    }, 10_000).unref();
  };
}

process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason?.stack || reason });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { err: err.stack || err.message });
  process.exit(1);
});

start();

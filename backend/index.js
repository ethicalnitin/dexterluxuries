require('dotenv').config();
const { config, checkConfig } = require('./config/env');
const { logger } = require('./utils/logger');

const { errors, warnings } = checkConfig(config);
warnings.forEach((warning) => logger.warn(`Config: ${warning}`));
if (errors.length) {
  errors.forEach((error) => logger.error(`Config: ${error}`));
  logger.error('Fix the configuration above (see .env.example) and restart.');
  process.exit(1);
}

const { startServer } = require('./server');

const SHUTDOWN_TIMEOUT_MS = 10000;
let running = null;
let shuttingDown = false;

async function shutdown(reason, exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('Shutting down', { reason });

  setTimeout(() => {
    logger.error('Forced exit: shutdown took too long', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  try {
    if (running) await running.stop();
    process.exit(exitCode);
  } catch (err) {
    logger.error('Error during shutdown', { err });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { err });
  shutdown('uncaughtException', 1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { err: reason instanceof Error ? reason : String(reason) });
  shutdown('unhandledRejection', 1);
});

startServer({ mongoUrl: config.mongoUrl, port: config.port, selfPingUrl: config.selfPingUrl })
  .then((instance) => {
    running = instance;
  })
  .catch((err) => {
    logger.error('Startup failed — could not connect to MongoDB or open the port', { err });
    process.exit(1);
  });

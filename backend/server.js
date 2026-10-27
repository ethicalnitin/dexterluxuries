const mongoose = require('mongoose');
const fetch = require('node-fetch');
const app = require('./app');
const { logger } = require('./utils/logger');
const lifecycle = require('./services/lifecycle');

let connectionEventsBound = false;

function bindConnectionEvents() {
  if (connectionEventsBound) return;
  connectionEventsBound = true;
  mongoose.connection.on('disconnected', () => {
    if (!lifecycle.isShuttingDown()) logger.warn('MongoDB disconnected — the driver will keep retrying');
  });
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', { err }));
}

async function startServer({ mongoUrl, port, selfPingUrl } = {}) {
  bindConnectionEvents();
  await mongoose.connect(mongoUrl);
  logger.info('MongoDB connected', { db: mongoose.connection.name });

  const server = await new Promise((resolve, reject) => {
    const s = app.listen(port, () => resolve(s));
    s.once('error', reject);
  });
  logger.info('Server listening', { port: server.address().port });

  let selfPingTimer = null;
  if (selfPingUrl) {
    selfPingTimer = setInterval(() => {
      fetch(`${selfPingUrl}/health`).catch((err) => logger.warn('Self-ping failed', { err: err.message }));
    }, 5 * 60 * 1000);
    selfPingTimer.unref();
  }

  let stopping = null;
  function stop() {
    if (stopping) return stopping;
    lifecycle.markShuttingDown();
    if (selfPingTimer) clearInterval(selfPingTimer);
    stopping = (async () => {
      await new Promise((resolve) => {
        server.close(() => resolve());
        if (typeof server.closeIdleConnections === 'function') server.closeIdleConnections();
      });
      await mongoose.connection.close();
      logger.info('Server stopped cleanly');
    })();
    return stopping;
  }

  return { server, stop };
}

module.exports = { startServer };

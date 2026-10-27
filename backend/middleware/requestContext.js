const crypto = require('crypto');
const { logger } = require('../utils/logger');

const SAFE_ID = /^[\w-]{1,64}$/;

function requestContext(req, res, next) {
  const incoming = req.get('x-request-id');
  req.id = incoming && SAFE_ID.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const path = req.path;
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const isApi = path.startsWith('/api/');
    const isHealth = path.startsWith('/health');
    if (!isApi && !isHealth) return;
    const fields = {
      requestId: req.id,
      method: req.method,
      path,
      status: res.statusCode,
      ms: Math.round(Number(process.hrtime.bigint() - started) / 1e6),
    };
    if (isHealth) logger.debug('request', fields);
    else logger.info('request', fields);
  });

  next();
}

module.exports = { requestContext };

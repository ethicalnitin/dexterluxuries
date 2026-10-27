const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  logger.error('Unhandled error', { requestId: req.id, method: req.method, path: req.path, err });
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong', requestId: req.id });
}

module.exports = { errorHandler };

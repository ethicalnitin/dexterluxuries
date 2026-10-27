const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
process.env.LOG_LEVEL = 'info';
delete process.env.LOG_FORMAT;

const { logger, redact, maskEmail } = require('../utils/logger');
const { errorHandler } = require('../middleware/errorHandler');

let lines;
let restore;
beforeEach(() => {
  lines = [];
  const original = { out: process.stdout.write, err: process.stderr.write };
  process.stdout.write = (chunk) => lines.push({ stream: 'stdout', text: String(chunk) }) && true;
  process.stderr.write = (chunk) => lines.push({ stream: 'stderr', text: String(chunk) }) && true;
  restore = () => {
    process.stdout.write = original.out;
    process.stderr.write = original.err;
  };
});
afterEach(() => restore());

describe('logger', () => {
  it('writes one JSON object per line in production', () => {
    logger.info('Order recorded', { orderRef: 'DX-1' });
    restore();
    assert.equal(lines.length, 1);
    const entry = JSON.parse(lines[0].text);
    assert.equal(entry.level, 'info');
    assert.equal(entry.msg, 'Order recorded');
    assert.equal(entry.orderRef, 'DX-1');
    assert.ok(!Number.isNaN(Date.parse(entry.time)));
  });

  it('sends warnings and errors to stderr, and drops levels below LOG_LEVEL', () => {
    logger.debug('noise');
    logger.warn('careful');
    logger.error('broken');
    restore();
    assert.deepEqual(lines.map((l) => [l.stream, JSON.parse(l.text).msg]), [['stderr', 'careful'], ['stderr', 'broken']]);
  });

  it('redacts secrets at any depth', () => {
    logger.info('login attempt', {
      body: { email: 'a@b.co', password: 'hunter2', nested: { token: 'abc', Authorization: 'Bearer x' } },
      passwordHash: 'scrypt$...',
    });
    restore();
    const text = lines[0].text;
    for (const secret of ['hunter2', '"abc"', 'Bearer x', 'scrypt$']) assert.ok(!text.includes(secret), `leaked ${secret}`);
    assert.equal(JSON.parse(text).body.password, '[REDACTED]');
  });

  it('serialises errors with their code and stack', () => {
    const err = Object.assign(new Error('boom'), { code: 'E_TEST' });
    assert.deepEqual(Object.keys(redact(err)), ['name', 'message', 'code', 'stack']);
    assert.equal(redact({ err }).err.code, 'E_TEST');
  });

  it('masks emails for log fields', () => {
    assert.equal(maskEmail('jane.doe@gmail.com'), 'j***@gmail.com');
    assert.equal(maskEmail('nonsense'), '***');
  });
});

describe('errorHandler', () => {
  const fakeRes = () => {
    const res = { headersSent: false, statusCode: 200, body: null };
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.body = body;
      return res;
    };
    return res;
  };
  const req = { id: 'req-123', method: 'GET', path: '/api/x' };

  it('turns unexpected errors into a 500 with the request id, and logs the details', () => {
    const res = fakeRes();
    errorHandler(new Error('db exploded'), req, res, () => {});
    restore();
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: 'Something went wrong', requestId: 'req-123' });
    const entry = JSON.parse(lines[0].text);
    assert.equal(entry.requestId, 'req-123');
    assert.equal(entry.err.message, 'db exploded');
  });

  it('maps body-parser errors to 400 and 413', () => {
    const bad = fakeRes();
    errorHandler({ type: 'entity.parse.failed' }, req, bad, () => {});
    const big = fakeRes();
    errorHandler({ type: 'entity.too.large' }, req, big, () => {});
    assert.equal(bad.statusCode, 400);
    assert.equal(big.statusCode, 413);
  });

  it('delegates to Express when the response has already started', () => {
    const res = { ...fakeRes(), headersSent: true };
    let passed;
    errorHandler(new Error('late'), req, res, (err) => {
      passed = err;
    });
    assert.equal(passed.message, 'late');
  });
});

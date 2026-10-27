const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig, checkConfig } = require('../config/env');

const LONG_SECRET = 'x'.repeat(48);
const base = { MONGO_URL: 'mongodb://127.0.0.1/db', JWT_SECRET: LONG_SECRET, OTP_SECRET: 'pepper' };
const check = (env) => checkConfig(loadConfig(env), env);

describe('config', () => {
  it('applies defaults', () => {
    const config = loadConfig({});
    assert.equal(config.port, 3046);
    assert.equal(config.nodeEnv, 'development');
    assert.deepEqual(config.allowedOrigins, []);
    assert.equal(config.smtp, null);
    assert.equal(config.telegram, null);
  });

  it('parses lists and groups SMTP / Telegram settings', () => {
    const config = loadConfig({
      ALLOWED_ORIGINS: ' https://a.example , https://b.example,, ',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
      TELEGRAM_BOT_TOKEN: 't',
      TELEGRAM_CHAT_ID: 'c',
    });
    assert.deepEqual(config.allowedOrigins, ['https://a.example', 'https://b.example']);
    assert.deepEqual(config.smtp, { host: 'smtp.example.com', port: 465, user: 'user', pass: 'pass', from: 'user' });
    assert.deepEqual(config.telegram, { botToken: 't', chatId: 'c' });
  });

  it('requires MONGO_URL and JWT_SECRET', () => {
    const { errors } = check({});
    assert.ok(errors.some((e) => e.includes('MONGO_URL')));
    assert.ok(errors.some((e) => e.includes('JWT_SECRET')));
    assert.deepEqual(check(base).errors, []);
  });

  it('requires OTP_SECRET only in production', () => {
    const env = { ...base, OTP_SECRET: '' };
    assert.deepEqual(check(env).errors, []);
    assert.ok(check(env).warnings.some((w) => w.includes('OTP_SECRET')));
    assert.ok(check({ ...env, NODE_ENV: 'production' }).errors.some((e) => e.includes('OTP_SECRET')));
  });

  it('rejects a non-numeric PORT or SMTP_PORT', () => {
    assert.ok(check({ ...base, PORT: 'abc' }).errors.some((e) => e.includes('PORT')));
    const smtp = { SMTP_HOST: 'h', SMTP_PORT: 'abc', SMTP_USER: 'u', SMTP_PASS: 'p' };
    assert.ok(check({ ...base, ...smtp }).errors.some((e) => e.includes('SMTP_PORT')));
  });

  it('logs JSON in production and is silent in tests by default', () => {
    assert.deepEqual([loadConfig({ NODE_ENV: 'production' }).logFormat, loadConfig({ NODE_ENV: 'production' }).logLevel], ['json', 'info']);
    assert.deepEqual([loadConfig({}).logFormat, loadConfig({ NODE_ENV: 'test' }).logLevel], ['pretty', 'silent']);
  });

  it('rejects unknown log settings', () => {
    assert.ok(check({ ...base, LOG_LEVEL: 'verbose' }).errors.some((e) => e.includes('LOG_LEVEL')));
    assert.ok(check({ ...base, LOG_FORMAT: 'xml' }).errors.some((e) => e.includes('LOG_FORMAT')));
  });

  it('rejects ALLOWED_ORIGINS entries that browsers would never match', () => {
    const bad = check({ ...base, ALLOWED_ORIGINS: 'https://shop.example/, shop.example, https://ok.example' });
    const error = bad.errors.find((e) => e.includes('ALLOWED_ORIGINS'));
    assert.ok(error);
    assert.match(error, /https:\/\/shop\.example\/, shop\.example/);
    assert.ok(!error.includes('https://ok.example'));
    assert.deepEqual(check({ ...base, ALLOWED_ORIGINS: 'https://shop.example,http://localhost:3000' }).errors, []);
  });

  it('warns about partial SMTP, short secrets and open CORS in production', () => {
    const partial = check({ ...base, SMTP_HOST: 'h', SMTP_USER: 'u' }).warnings.join('\n');
    assert.match(partial, /partly configured \(missing SMTP_PORT, SMTP_PASS\)/);
    assert.ok(check({ ...base, JWT_SECRET: 'short' }).warnings.some((w) => w.includes('shorter than 32')));
    assert.ok(check({ ...base, NODE_ENV: 'production' }).warnings.some((w) => w.includes('ALLOWED_ORIGINS')));
    assert.ok(!check({ ...base, NODE_ENV: 'production', ALLOWED_ORIGINS: 'https://a.example' }).warnings.some((w) => w.includes('ALLOWED_ORIGINS')));
  });
});

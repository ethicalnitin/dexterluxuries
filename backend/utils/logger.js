const { config } = require('../config/env');

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const SENSITIVE_KEY = /^(password|passwordhash|pass|token|authorization|cookie|secret|otp|jwt|apikey|smtp_pass)$/i;
const MAX_DEPTH = 5;

function redact(value, depth = 0) {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, code: value.code, stack: value.stack };
  }
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[Object]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  const out = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(item, depth + 1);
  }
  return out;
}

function maskEmail(email) {
  const [user, domain] = String(email || '').split('@');
  return user && domain ? `${user[0]}***@${domain}` : '***';
}

function format(entry) {
  if (config.logFormat === 'json') return JSON.stringify(entry);
  const { time, level, msg, ...fields } = entry;
  const extra = Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : '';
  return `${time} ${level.toUpperCase().padEnd(5)} ${msg}${extra}`;
}

function write(level, msg, fields) {
  if (LEVELS[level] < (LEVELS[config.logLevel] ?? LEVELS.info)) return;
  const entry = { time: new Date().toISOString(), level, msg, ...redact(fields || {}) };
  const stream = LEVELS[level] >= LEVELS.warn ? process.stderr : process.stdout;
  stream.write(`${format(entry)}\n`);
}

const logger = {
  debug: (msg, fields) => write('debug', msg, fields),
  info: (msg, fields) => write('info', msg, fields),
  warn: (msg, fields) => write('warn', msg, fields),
  error: (msg, fields) => write('error', msg, fields),
};

module.exports = { logger, redact, maskEmail };

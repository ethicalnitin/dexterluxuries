const SMTP_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'];
const LOG_FORMATS = ['json', 'pretty'];
const ORIGIN_PATTERN = /^https?:\/\/[^/\s]+$/;

const parseList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';
  const smtpComplete = SMTP_KEYS.every((key) => env[key]);

  return {
    nodeEnv,
    isProduction,
    isTest,
    logLevel: env.LOG_LEVEL || (isTest ? 'silent' : 'info'),
    logFormat: env.LOG_FORMAT || (isProduction ? 'json' : 'pretty'),
    port: Number(env.PORT) || 3046,
    mongoUrl: env.MONGO_URL || '',
    jwtSecret: env.JWT_SECRET || '',
    otpSecret: env.OTP_SECRET || '',
    allowedOrigins: parseList(env.ALLOWED_ORIGINS),
    brandName: env.BRAND_NAME || 'MKR Tools & Softwares',
    selfPingUrl: env.SELF_PING_URL || '',
    smtp: smtpComplete
      ? {
          host: env.SMTP_HOST,
          port: Number(env.SMTP_PORT),
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
          from: env.SMTP_FROM || env.SMTP_USER,
        }
      : null,
    telegram:
      env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID
        ? { botToken: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID }
        : null,
  };
}

function checkConfig(config, env = process.env) {
  const errors = [];
  const warnings = [];

  if (!config.mongoUrl) errors.push('MONGO_URL is not set.');
  if (!config.jwtSecret) errors.push('JWT_SECRET is not set.');
  else if (config.jwtSecret.length < 32) warnings.push('JWT_SECRET is shorter than 32 characters — use a long random value.');

  if (!config.otpSecret) {
    const message = 'OTP_SECRET is not set — password reset codes are hashed with an insecure default.';
    (config.isProduction ? errors : warnings).push(message);
  }

  if (env.PORT !== undefined && !/^\d+$/.test(String(env.PORT))) errors.push('PORT must be a whole number.');
  if (!LOG_LEVELS.includes(config.logLevel)) errors.push(`LOG_LEVEL must be one of: ${LOG_LEVELS.join(', ')}.`);
  if (!LOG_FORMATS.includes(config.logFormat)) errors.push(`LOG_FORMAT must be one of: ${LOG_FORMATS.join(', ')}.`);

  const badOrigins = config.allowedOrigins.filter((origin) => !ORIGIN_PATTERN.test(origin));
  if (badOrigins.length) {
    errors.push(
      `ALLOWED_ORIGINS has invalid entries (${badOrigins.join(', ')}) — use scheme://host[:port] with no path or trailing slash.`
    );
  }

  const smtpSet = SMTP_KEYS.filter((key) => env[key]);
  if (!config.smtp) {
    warnings.push(
      smtpSet.length
        ? `SMTP is only partly configured (missing ${SMTP_KEYS.filter((key) => !env[key]).join(', ')}) — email is disabled.`
        : config.isProduction
          ? 'SMTP is not configured — password reset and order delivery emails are disabled.'
          : 'SMTP is not configured — reset codes are logged to the console and delivery emails fail.'
    );
  } else if (!Number.isInteger(config.smtp.port) || config.smtp.port <= 0) {
    errors.push('SMTP_PORT must be a whole number.');
  }

  if (!config.telegram) warnings.push('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — Telegram notifications are skipped.');
  if (config.isProduction && !config.allowedOrigins.length) {
    warnings.push('ALLOWED_ORIGINS is not set — any website can call the API.');
  }

  return { errors, warnings };
}

const config = loadConfig();

module.exports = { config, loadConfig, checkConfig };

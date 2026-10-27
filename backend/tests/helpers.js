const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.OTP_SECRET = 'test-otp-secret';
for (const key of Object.keys(process.env)) {
  if (/^(TELEGRAM_|SMTP_|SELF_PING_URL$|ALLOWED_ORIGINS$)/.test(key)) delete process.env[key];
}

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function startMongo() {
  if (process.env.TEST_MONGO_URL) return { url: process.env.TEST_MONGO_URL, stop: async () => {} };

  const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dexter-test-db-'));
  const port = await freePort();
  const proc = spawn(process.env.MONGOD_PATH || 'mongod', ['--dbpath', dbPath, '--port', String(port), '--bind_ip', '127.0.0.1', '--quiet'], {
    stdio: 'ignore',
  });
  let spawnError = null;
  proc.on('error', (err) => {
    spawnError = err;
  });

  const stop = async () => {
    if (proc.exitCode === null) {
      const exited = new Promise((resolve) => proc.once('exit', resolve));
      proc.kill();
      await exited;
    }
    fs.rmSync(dbPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  };

  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (spawnError) {
      await stop();
      throw new Error(`Couldn't start mongod (${spawnError.message}). Install MongoDB, or set MONGOD_PATH or TEST_MONGO_URL.`);
    }
    const ok = await new Promise((resolve) => {
      const sock = net.connect(port, '127.0.0.1', () => {
        sock.end();
        resolve(true);
      });
      sock.on('error', () => resolve(false));
    });
    if (ok) return { url: `mongodb://127.0.0.1:${port}/dexter_test`, stop };
    await new Promise((r) => setTimeout(r, 200));
  }
  await stop();
  throw new Error('mongod did not start within 30s');
}

async function dropDatabase(url, dbName) {
  const conn = await mongoose.createConnection(url, { dbName }).asPromise();
  await conn.dropDatabase();
  await conn.close();
}

const TEST_DB_NAME = `dexter_test_${process.pid}`;

async function startTestServer() {
  const mongo = await startMongo();
  await mongoose.connect(mongo.url, { dbName: TEST_DB_NAME });
  await mongoose.connection.db.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, urlPath, { body, token, rawBody, ip } = {}) {
    const headers = {};
    if (body !== undefined || rawBody !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    if (ip) headers['X-Forwarded-For'] = ip;
    const res = await fetch(baseUrl + urlPath, {
      method,
      headers,
      body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: res.status, body: json, text };
  }

  async function stop() {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    if (process.env.TEST_MONGO_URL) await dropDatabase(mongo.url, TEST_DB_NAME);
    await mongo.stop();
  }

  return { baseUrl, request, stop };
}

async function createUser({ email, password = 'password123', name = 'Test User', role } = {}) {
  const user = await User.create({ email, name, passwordHash: await hashPassword(password), role });
  const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token, password };
}

module.exports = { startTestServer, startMongo, createUser, dropDatabase, TEST_DB_NAME };

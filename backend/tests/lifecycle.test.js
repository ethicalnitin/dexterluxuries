const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startMongo, dropDatabase, TEST_DB_NAME } = require('./helpers');
const mongoose = require('mongoose');
const { startServer } = require('../server');

const DB_NAME = `${TEST_DB_NAME}_lifecycle`;
let mongo;
let instance;
let baseUrl;

before(async () => {
  mongo = await startMongo();
  const url = new URL(mongo.url);
  url.pathname = `/${DB_NAME}`;
  instance = await startServer({ mongoUrl: url.toString(), port: 0 });
  baseUrl = `http://127.0.0.1:${instance.server.address().port}`;
});
after(async () => {
  if (instance) await instance.stop();
  if (process.env.TEST_MONGO_URL) await dropDatabase(mongo.url, DB_NAME);
  await mongo.stop();
});

describe('server lifecycle', () => {
  it('is ready once started', async () => {
    const res = await fetch(`${baseUrl}/health/ready`);
    assert.equal(res.status, 200);
  });

  it('lets an in-flight request finish, then closes the server and the database', async () => {
    const received = new Promise((resolve) => instance.server.once('request', resolve));
    const inFlight = fetch(`${baseUrl}/api/products`).then((r) => r.status);
    await received;
    const stopping = instance.stop();
    assert.equal(await inFlight, 200);
    await stopping;

    assert.equal(instance.server.listening, false);
    assert.equal(mongoose.connection.readyState, 0);
    await assert.rejects(fetch(`${baseUrl}/health`));
  });

  it('can be stopped twice safely', async () => {
    await instance.stop();
    await instance.stop();
  });
});

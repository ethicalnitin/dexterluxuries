const express = require('express');
const mongoose = require('mongoose');
const lifecycle = require('../services/lifecycle');

const router = express.Router();

const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is awake!', uptime: Math.round(process.uptime()) });
});

router.get('/ready', (req, res) => {
  const db = DB_STATES[mongoose.connection.readyState] || 'unknown';
  if (lifecycle.isShuttingDown()) {
    return res.status(503).json({ status: 'unavailable', reason: 'shutting down', db });
  }
  if (db !== 'connected') {
    return res.status(503).json({ status: 'unavailable', reason: 'database not connected', db });
  }
  res.json({ status: 'ready', db });
});

module.exports = router;

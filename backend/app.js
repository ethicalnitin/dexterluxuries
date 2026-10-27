const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const { config } = require('./config/env');
const { requestContext } = require('./middleware/requestContext');
const { errorHandler } = require('./middleware/errorHandler');
const { securityHeaders, apiHeaders } = require('./middleware/securityHeaders');
const { rateLimit } = require('./middleware/rateLimit');
const healthRoutes = require('./routes/healthRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const customerOrderRoutes = require('./routes/customerOrderRoutes');

const FRONTEND_BUILD = path.join(__dirname, '../frontend/build');
const HAS_FRONTEND_BUILD = fs.existsSync(path.join(FRONTEND_BUILD, 'index.html'));

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(requestContext);
app.use(securityHeaders);
app.use(
  cors({
    origin: config.allowedOrigins.length ? config.allowedOrigins : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id', 'Retry-After'],
    maxAge: 600,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
if (HAS_FRONTEND_BUILD) app.use(express.static(FRONTEND_BUILD));

app.use('/health', healthRoutes);

app.use('/api', apiHeaders(), rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.use('/api/products', productRoutes);
app.use('/api/auth', apiHeaders({ noStore: true }), authRoutes);
app.use('/api/admin', apiHeaders({ noStore: true }), adminRoutes);
app.use('/api/orders', apiHeaders({ noStore: true }), orderRoutes);
app.use('/api/orders', customerOrderRoutes);
app.use('/api/cart', apiHeaders({ noStore: true }), cartRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (HAS_FRONTEND_BUILD) {
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

app.use(errorHandler);

module.exports = app;

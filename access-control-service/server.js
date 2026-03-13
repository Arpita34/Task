// ============================================================
// ACCESS CONTROL SERVICE (API GATEWAY)
// ============================================================
// This service acts as the single entry point for all client
// requests. It does THREE things:
//   1. Stores a registry of routes (received from downstream services)
//   2. Validates JWT tokens on incoming requests
//   3. Proxies authenticated requests to the correct service
// ============================================================

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const authMiddleware = require('./middleware/auth');
const registryRoutes = require('./routes/registry');
const proxyHandler = require('./middleware/proxy');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));     // Logs every request (method, url, status, time)
app.use(express.json());

// ── In-memory Route Registry ───────────────────────────────
// This Map stores all routes registered by downstream services.
// Key:   "METHOD:/path"   (e.g., "GET:/tasks")
// Value: { method, path, serviceUrl }
const routeRegistry = new Map();

// Make the registry accessible to other modules via app.locals
app.locals.routeRegistry = routeRegistry;

// ── Route Registration Endpoint ────────────────────────────
// POST /register  — called by downstream services at startup
// This is NOT protected by JWT (the service itself calls it)
app.use('/register', registryRoutes);

// ── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Access Control Service (Gateway)',
    registeredRoutes: routeRegistry.size,
    timestamp: new Date().toISOString()
  });
});

// ── View Registered Routes (debug helper) ──────────────────
app.get('/routes', (req, res) => {
  const routes = [];
  routeRegistry.forEach((value, key) => {
    routes.push({ key, ...value });
  });
  res.json({ totalRoutes: routes.length, routes });
});

// ── Gateway Proxy (all other requests) ─────────────────────
// Every request that isn't /register, /health, or /routes
// goes through JWT auth → proxy to the correct service.
//
// SPECIAL CASE: POST /login is proxied WITHOUT JWT validation
// because the user doesn't have a token yet!
app.use('*', (req, res, next) => {
  const method = req.method.toUpperCase();
  const path = req.originalUrl;

  // Allow POST /login without a token
  if (method === 'POST' && path === '/login') {
    return proxyHandler(req, res, next);
  }

  // Everything else requires JWT authentication
  authMiddleware(req, res, (err) => {
    if (err) return; // authMiddleware already sent the response
    proxyHandler(req, res, next);
  });
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Access Control Service (Gateway) running on port ${PORT}`);
  console.log(`   Health check:  http://localhost:${PORT}/health`);
  console.log(`   View routes:   http://localhost:${PORT}/routes\n`);
});

// ============================================================
// ROUTE REGISTRY ENDPOINT (Gateway)
// ============================================================
// POST /register
//
// This endpoint is called by downstream services when they
// start up. Each service sends a list of its routes, and
// the gateway stores them in its in-memory registry.
//
// Request body format:
// {
//   "serviceName": "business-logic-service",
//   "serviceUrl":  "http://localhost:5000",
//   "routes": [
//     { "method": "GET",  "path": "/tasks" },
//     { "method": "POST", "path": "/tasks" },
//     { "method": "GET",  "path": "/tasks/:id" },
//     ...
//   ]
// }
// ============================================================

const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { serviceName, serviceUrl, routes } = req.body;

  // ── Validate request body ────────────────────────────────
  if (!serviceName || !serviceUrl || !routes || !Array.isArray(routes)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid registration. Required: serviceName, serviceUrl, routes[]'
    });
  }

  const registry = req.app.locals.routeRegistry;
  let registeredCount = 0;

  // ── Register each route ──────────────────────────────────
  routes.forEach((route) => {
    const key = `${route.method.toUpperCase()}:${route.path}`;
    registry.set(key, {
      method: route.method.toUpperCase(),
      path: route.path,
      serviceUrl: serviceUrl,
      serviceName: serviceName
    });
    registeredCount++;
    console.log(`  ✓ Registered: ${route.method.toUpperCase()} ${route.path} → ${serviceUrl}`);
  });

  console.log(`\n📋 ${serviceName} registered ${registeredCount} routes\n`);

  res.status(200).json({
    success: true,
    message: `${registeredCount} routes registered successfully from ${serviceName}`,
    registeredRoutes: registeredCount
  });
});

module.exports = router;

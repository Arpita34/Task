// ============================================================
// PROXY MIDDLEWARE (Gateway)
// ============================================================
// After JWT validation passes, this middleware looks up the
// requested route in the route registry and forwards (proxies)
// the request to the correct downstream service.
//
// How it works:
//   1. Build a lookup key from the request method + path
//   2. Search the registry for a matching route
//   3. If found → forward the request using axios
//   4. If not found → return 404
//
// The proxy also forwards the original headers (including the
// Authorization header) so the downstream service can also
// know who the user is if needed.
// ============================================================

const axios = require('axios');

function proxyHandler(req, res, next) {
  const registry = req.app.locals.routeRegistry;
  const method = req.method.toUpperCase();
  const originalPath = req.originalUrl;

  // ── Find matching route in registry ──────────────────────
  // We need to handle parameterized routes like /tasks/:id
  // The registry stores "/tasks/:id" but the actual request
  // comes as "/tasks/5". We need to match them.
  let matchedRoute = null;

  // First, try exact match
  const exactKey = `${method}:${originalPath}`;
  if (registry.has(exactKey)) {
    matchedRoute = registry.get(exactKey);
  }

  // If no exact match, try pattern matching for parameterized routes
  if (!matchedRoute) {
    for (const [key, route] of registry) {
      if (route.method !== method) continue;

      // Convert route pattern "/tasks/:id" to regex "/tasks/[^/]+"
      const pattern = route.path
        .replace(/:[^/]+/g, '[^/]+')   // Replace :param with regex
        .replace(/\//g, '\\/');         // Escape slashes

      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(originalPath)) {
        matchedRoute = route;
        break;
      }
    }
  }

  // ── Route not found in registry ──────────────────────────
  if (!matchedRoute) {
    return res.status(404).json({
      success: false,
      message: `Route ${method} ${originalPath} is not registered with the gateway.`,
      hint: 'This route has not been registered by any downstream service.'
    });
  }

  // ── Forward request to downstream service ────────────────
  const targetUrl = `${matchedRoute.serviceUrl}${originalPath}`;

  console.log(`  ↳ Proxying ${method} ${originalPath} → ${targetUrl}`);

  const headersToForward = { ...req.headers };
  delete headersToForward.host; // Remove host header cleanly so axios doesn't break
  delete headersToForward['content-length']; // Crucial: Let axios calculate the new content length

  const axiosConfig = {
    method: method.toLowerCase(),
    url: targetUrl,
    headers: headersToForward,
    data: req.body,
    // Don't throw on non-2xx status codes (let the downstream
    // service's error responses pass through)
    validateStatus: () => true
  };

  axios(axiosConfig)
    .then((response) => {
      // Forward the downstream service's response back to client
      res.status(response.status).json(response.data);
    })
    .catch((error) => {
      console.error(`  ✗ Proxy error: ${error.message}`);
      res.status(502).json({
        success: false,
        message: 'Bad Gateway. The downstream service is unavailable.',
        error: error.message
      });
    });
}

module.exports = proxyHandler;

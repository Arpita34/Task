// ============================================================
// DYNAMIC ROUTE REGISTRATION (Business Logic Service)
// ============================================================
// This module runs when the Business Logic Service starts up.
// It sends a POST request to the Gateway's /register endpoint
// with a list of all routes that this service exposes.
//
// The Gateway then stores these routes and knows where to
// proxy matching incoming requests.
//
// This is the KEY feature of the architecture:
//   → Services are self-registering
//   → The gateway doesn't need hardcoded route configuration
//   → New services can register themselves dynamically
// ============================================================

const axios = require('axios');

async function registerWithGateway(servicePort) {
  const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';
  const SERVICE_URL = `http://localhost:${servicePort}`;

  // ── Define all routes this service exposes ───────────────
  const routes = [
    { method: 'POST',   path: '/login'      },
    { method: 'POST',   path: '/tasks'      },
    { method: 'GET',    path: '/tasks'      },
    { method: 'GET',    path: '/tasks/:id'  },
    { method: 'PUT',    path: '/tasks/:id'  },
    { method: 'DELETE', path: '/tasks/:id'  }
  ];

  const registrationPayload = {
    serviceName: 'business-logic-service',
    serviceUrl: SERVICE_URL,
    routes: routes
  };

  try {
    console.log('  📡 Registering routes with Gateway...');

    const response = await axios.post(
      `${GATEWAY_URL}/register`,
      registrationPayload
    );

    console.log(`  ✅ ${response.data.message}`);
    console.log('  Registered routes:');
    routes.forEach(r => {
      console.log(`     ${r.method.padEnd(6)} ${r.path}`);
    });
    console.log('');
  } catch (error) {
    console.error('  ❌ Failed to register with Gateway!');
    console.error(`     Error: ${error.message}`);
    console.error('     Make sure the Access Control Service (Gateway) is running first.\n');
  }
}

module.exports = registerWithGateway;

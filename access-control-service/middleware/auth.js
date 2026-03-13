// ============================================================
// JWT AUTHENTICATION MIDDLEWARE (Gateway)
// ============================================================
// This middleware runs on EVERY request coming through the
// gateway (except /login and /register).
//
// It checks the Authorization header for a valid JWT token.
// If the token is missing or invalid → 401 Unauthorized.
// If the token is valid → it attaches the decoded user info
// to req.user and passes control to the proxy handler.
// ============================================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_jwt_signing_2024';

function authMiddleware(req, res, next) {
  // 1. Extract the token from the Authorization header
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
      hint: 'Include an Authorization header: Bearer <your_token>'
    });
  }

  // 2. The header format should be: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token format. Use: Bearer <token>'
    });
  }

  const token = parts[1];

  // 3. Verify the token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach decoded user data to the request (id, username, role)
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid token. Authentication failed.'
    });
  }
}

module.exports = authMiddleware;

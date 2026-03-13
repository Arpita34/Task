// ============================================================
// AUTH ROUTES (Business Logic Service)
// ============================================================
// POST /login
//
// Takes { username, password } in the request body.
// Validates credentials against the database.
// Returns a JWT token on success.
//
// The token contains: { id, username, role }
// Token expires in 1 hour.
// ============================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_jwt_signing_2024';

// POST /login
router.post('/', (req, res) => {
  const { username, password } = req.body;

  // ── Validate input ───────────────────────────────────────
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  // ── Find user in database ────────────────────────────────
  const db = req.app.locals.db;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. User not found.'
    });
  }

  // ── Compare password ─────────────────────────────────────
  const isPasswordValid = bcrypt.compareSync(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Wrong password.'
    });
  }

  // ── Generate JWT Token ───────────────────────────────────
  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

  console.log(`  🔑 User "${username}" logged in successfully`);

  res.status(200).json({
    success: true,
    message: 'Login successful!',
    token: token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

module.exports = router;

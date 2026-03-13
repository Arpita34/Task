// ============================================================
// BUSINESS LOGIC SERVICE
// ============================================================
// This service contains the actual application logic:
//   1. POST /login  — authenticates users and returns JWT
//   2. CRUD APIs for "tasks" (POST, GET, GET/:id, PUT/:id, DELETE/:id)
//   3. On startup, registers ALL its routes with the Gateway
//
// The database is SQLite (file-based, no installation needed).
// ============================================================

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const registerWithGateway = require('./utils/registerRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ── Initialize Database ────────────────────────────────────
// Creates tables if they don't exist, seeds a default user
const db = initializeDatabase();
app.locals.db = db;   // Make db accessible in route handlers

// ── Mount Routes ───────────────────────────────────────────
app.use('/login', authRoutes);     // POST /login
app.use('/tasks', taskRoutes);     // CRUD /tasks

// ── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Business Logic Service',
    timestamp: new Date().toISOString()
  });
});

// ── Start Server & Register with Gateway ───────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Business Logic Service running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);

  // Wait 1 second for the gateway to be ready, then register
  setTimeout(async () => {
    await registerWithGateway(PORT);
  }, 1500);
});

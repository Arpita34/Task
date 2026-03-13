// ============================================================
// DATABASE CONFIGURATION (SQLite)
// ============================================================
// We use SQLite because:
//   - No installation needed (it's a file on disk)
//   - Perfect for assignments and demos
//   - The 'better-sqlite3' package is synchronous (simpler code)
//
// This module creates two tables:
//   1. users  — for authentication (login)
//   2. tasks  — for CRUD operations
//
// It also seeds a default user so you can login immediately.
// ============================================================

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

function initializeDatabase() {
  // Database file is stored in the service's root directory
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // ── Create Users Table ─────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    UNIQUE NOT NULL,
      password    TEXT    NOT NULL,
      role        TEXT    DEFAULT 'user',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Create Tasks Table ─────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT,
      status      TEXT    DEFAULT 'pending',
      priority    TEXT    DEFAULT 'medium',
      created_by  INTEGER,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // ── Seed Default Users ─────────────────────────────────
  // Check if users already exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const hashedAdminPassword = bcrypt.hashSync('admin123', 10);

    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run('john', hashedPassword, 'user');

    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run('admin', hashedAdminPassword, 'admin');

    console.log('  📦 Database seeded with default users:');
    console.log('     • john  / password123  (role: user)');
    console.log('     • admin / admin123     (role: admin)');
  }

  // ── Seed Sample Tasks ──────────────────────────────────
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();

  if (taskCount.count === 0) {
    const insertTask = db.prepare(
      'INSERT INTO tasks (title, description, status, priority, created_by) VALUES (?, ?, ?, ?, ?)'
    );

    insertTask.run('Complete assignment 13', 'Build microservices architecture', 'in-progress', 'high', 1);
    insertTask.run('Review JWT documentation', 'Understand token structure', 'pending', 'medium', 1);
    insertTask.run('Test API endpoints', 'Use Postman to test all routes', 'pending', 'low', 2);

    console.log('  📦 Database seeded with 3 sample tasks');
  }

  console.log('  ✅ Database initialized successfully\n');
  return db;
}

module.exports = { initializeDatabase };

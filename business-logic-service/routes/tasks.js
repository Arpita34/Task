// ============================================================
// TASK ROUTES (Business Logic Service) — CRUD APIs
// ============================================================
// These are the core CRUD endpoints:
//
//   POST   /tasks       → Create a new task
//   GET    /tasks       → Get all tasks
//   GET    /tasks/:id   → Get a single task by ID
//   PUT    /tasks/:id   → Update a task by ID
//   DELETE /tasks/:id   → Delete a task by ID
//
// All of these are registered with the gateway on startup.
// The gateway proxies authenticated requests here.
// ============================================================

const express = require('express');
const router = express.Router();

// ── POST /tasks — Create a new task ────────────────────────
router.post('/', (req, res) => {
  const { title, description, status, priority } = req.body;
  const db = req.app.locals.db;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required to create a task.'
    });
  }

  try {
    const result = db.prepare(
      `INSERT INTO tasks (title, description, status, priority, created_by)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      title,
      description || null,
      status || 'pending',
      priority || 'medium',
      1  // Default user ID
    );

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    console.log(`  ✓ Task created: "${title}" (ID: ${newTask.id})`);

    res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      task: newTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create task.',
      error: error.message
    });
  }
});

// ── GET /tasks — Get all tasks ─────────────────────────────
router.get('/', (req, res) => {
  const db = req.app.locals.db;

  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks.',
      error: error.message
    });
  }
});

// ── GET /tasks/:id — Get a single task ─────────────────────
router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      task: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task.',
      error: error.message
    });
  }
});

// ── PUT /tasks/:id — Update a task ─────────────────────────
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { title, description, status, priority } = req.body;

  try {
    // Check if task exists
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found.`
      });
    }

    // Update only fields that were provided
    db.prepare(
      `UPDATE tasks 
       SET title = ?, description = ?, status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(
      title || existingTask.title,
      description !== undefined ? description : existingTask.description,
      status || existingTask.status,
      priority || existingTask.priority,
      id
    );

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    console.log(`  ✓ Task updated: ID ${id}`);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully!',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task.',
      error: error.message
    });
  }
});

// ── DELETE /tasks/:id — Delete a task ──────────────────────
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${id} not found.`
      });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    console.log(`  ✗ Task deleted: ID ${id}`);

    res.status(200).json({
      success: true,
      message: `Task with ID ${id} deleted successfully!`,
      deletedTask: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task.',
      error: error.message
    });
  }
});

module.exports = router;

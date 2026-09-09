const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const VALID_STATUSES = ['todo', 'in_progress', 'done'];

function getTaskOr404(id, res) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return null;
  }
  return task;
}

function getOwnedProjectOr403(projectId, userId, res) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }
  if (project.ownerId !== userId) {
    res.status(403).json({ error: 'Only the project owner can manage tasks in this project' });
    return null;
  }
  return project;
}

// POST /api/tasks   body: { title, description, status, dueDate, projectId, assigneeId }
router.post('/', (req, res) => {
  const { title, description, status, dueDate, projectId, assigneeId } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ error: 'title and projectId are required' });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const project = getOwnedProjectOr403(projectId, req.user.id, res);
  if (!project) return;

  if (assigneeId) {
    const assignee = db.prepare('SELECT id FROM users WHERE id = ?').get(assigneeId);
    if (!assignee) return res.status(400).json({ error: 'assigneeId does not reference an existing user' });
  }

  const info = db
    .prepare(
      `INSERT INTO tasks (title, description, status, dueDate, projectId, assigneeId)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title, description || null, status || 'todo', dueDate || null, projectId, assigneeId || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(task);
});

// GET /api/tasks?projectId=&assigneeId=&status=  (filterable list)
router.get('/', (req, res) => {
  const { projectId, assigneeId, status } = req.query;
  let sql = `
    SELECT tasks.* FROM tasks
    JOIN projects ON projects.id = tasks.projectId
    WHERE projects.ownerId = ?
  `;
  const params = [req.user.id];

  if (projectId) {
    sql += ' AND tasks.projectId = ?';
    params.push(projectId);
  }
  if (assigneeId) {
    sql += ' AND tasks.assigneeId = ?';
    params.push(assigneeId);
  }
  if (status) {
    sql += ' AND tasks.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY tasks.id';

  const tasks = db.prepare(sql).all(...params);
  res.json(tasks);
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = getTaskOr404(req.params.id, res);
  if (!task) return;
  res.json(task);
});

// PATCH /api/tasks/:id  (project owner, OR the assignee updating only status)
router.patch('/:id', (req, res) => {
  const task = getTaskOr404(req.params.id, res);
  if (!task) return;

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(task.projectId);
  const isOwner = project.ownerId === req.user.id;
  const isAssignee = task.assigneeId === req.user.id;

  if (!isOwner && !isAssignee) {
    return res.status(403).json({ error: 'Only the project owner or the assignee can update this task' });
  }

  // Assignees who are not the owner may only change status
  const incomingKeys = Object.keys(req.body);
  if (!isOwner && incomingKeys.some((k) => k !== 'status')) {
    return res.status(403).json({ error: 'Assignees may only update the task status' });
  }

  const status = req.body.status ?? task.status;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const title = req.body.title ?? task.title;
  const description = req.body.description ?? task.description;
  const dueDate = req.body.dueDate ?? task.dueDate;
  const assigneeId = req.body.assigneeId ?? task.assigneeId;

  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, status = ?, dueDate = ?, assigneeId = ? WHERE id = ?`
  ).run(title, description, status, dueDate, assigneeId, task.id);

  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

// DELETE /api/tasks/:id (project owner only)
router.delete('/:id', (req, res) => {
  const task = getTaskOr404(req.params.id, res);
  if (!task) return;

  const project = getOwnedProjectOr403(task.projectId, req.user.id, res);
  if (!project) return;

  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.status(204).send();
});

module.exports = router;

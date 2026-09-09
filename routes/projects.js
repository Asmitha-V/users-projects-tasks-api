const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function getProjectOr404(id, res) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }
  return project;
}

// POST /api/projects
router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const info = db
    .prepare('INSERT INTO projects (name, description, ownerId) VALUES (?, ?, ?)')
    .run(name, description || null, req.user.id);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(project);
});

// GET /api/projects  (only projects the logged-in user owns)
router.get('/', (req, res) => {
  const projects = db
    .prepare('SELECT * FROM projects WHERE ownerId = ? ORDER BY id')
    .all(req.user.id);
  res.json(projects);
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const project = getProjectOr404(req.params.id, res);
  if (!project) return;
  res.json(project);
});

// PATCH /api/projects/:id  (owner only)
router.patch('/:id', (req, res) => {
  const project = getProjectOr404(req.params.id, res);
  if (!project) return;
  if (project.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Only the project owner can edit this project' });
  }

  const name = req.body.name ?? project.name;
  const description = req.body.description ?? project.description;

  db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?').run(
    name,
    description,
    project.id
  );
  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id));
});

// DELETE /api/projects/:id (owner only) — cascades to tasks
router.delete('/:id', (req, res) => {
  const project = getProjectOr404(req.params.id, res);
  if (!project) return;
  if (project.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Only the project owner can delete this project' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
  res.status(204).send();
});

module.exports = router;

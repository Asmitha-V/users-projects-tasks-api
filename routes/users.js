const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/users
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, name, email, createdAt FROM users ORDER BY id').all();
  res.json(users);
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, createdAt FROM users WHERE id = ?')
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:id  (self-service update: name only, must be the logged-in user)
router.patch('/:id', (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId !== req.user.id) {
    return res.status(403).json({ error: 'You can only update your own profile' });
  }
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, targetId);
  const user = db
    .prepare('SELECT id, name, email, createdAt FROM users WHERE id = ?')
    .get(targetId);
  res.json(user);
});

// DELETE /api/users/:id (self only)
router.delete('/:id', (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own account' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  res.status(204).send();
});

module.exports = router;

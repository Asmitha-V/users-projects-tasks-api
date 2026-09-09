require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'Users, Projects & Tasks REST API',
    status: 'ok',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login'],
      users: ['GET /api/users', 'GET /api/users/:id', 'PATCH /api/users/:id', 'DELETE /api/users/:id'],
      projects: [
        'POST /api/projects',
        'GET /api/projects',
        'GET /api/projects/:id',
        'PATCH /api/projects/:id',
        'DELETE /api/projects/:id',
      ],
      tasks: [
        'POST /api/tasks',
        'GET /api/tasks?projectId=&assigneeId=&status=',
        'GET /api/tasks/:id',
        'PATCH /api/tasks/:id',
        'DELETE /api/tasks/:id',
      ],
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

# Task 2 — Users, Projects & Tasks REST API

Internship Task 2 (Innovation Hacks Full Stack Development Internship): a REST API for managing
Users, Projects, and Tasks with JWT authentication and ownership-based permissions.

**Stack:** Node.js + Express + SQLite (`better-sqlite3`), JWT auth, bcrypt password hashing.
No external database to install — SQLite is a local file (`data.sqlite`) created automatically on first run.

## Live demo

`<paste your https://your-app-name.onrender.com URL here once deployed>`

## Tested and verified

- ✅ Server boots and root route lists all endpoints
- ✅ Register creates a user and returns a JWT (201)
- ✅ Duplicate email registration is correctly rejected (409)
- ✅ Authenticated project creation works (201) and is scoped to the logged-in user
- ✅ Task creation and filtering by `projectId`/`status` work
- ✅ A user cannot modify or delete another user's project (403)

Verified manually via Postman; screenshots available on request.

## 1. Run it

```bash
cd task2-api
cp .env.example .env      # edit JWT_SECRET if you want
npm install
npm start
```

Server starts on `http://localhost:4000`. Visiting `/` lists all routes.

## 2. Try it (curl)

**Register:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"secret123"}'
```
Response includes a `token` — save it.

**Create a project:**
```bash
TOKEN="paste-token-here"
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Website Revamp","description":"Q4 redesign"}'
```

**Create a task in that project:**
```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Design homepage","projectId":1,"status":"in_progress"}'
```

**List tasks, filtered:**
```bash
curl "http://localhost:4000/api/tasks?projectId=1&status=in_progress" \
  -H "Authorization: Bearer $TOKEN"
```

## 3. How it's organized

```
task2-api/
├── server.js            # app entrypoint, mounts routes, error handling
├── db/index.js          # SQLite connection + schema (auto-migrates on boot)
├── middleware/auth.js   # JWT verification middleware
├── routes/
│   ├── auth.js          # register, login
│   ├── users.js         # list/get/update-self/delete-self
│   ├── projects.js      # CRUD, owner-scoped
│   └── tasks.js         # CRUD, filterable, owner/assignee permissions
├── .env.example
└── data.sqlite           # created on first run (gitignored)
```

## 4. Endpoints

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create a user, returns JWT |
| POST | `/api/auth/login` | No | Log in, returns JWT |
| GET | `/api/users` | Yes | List all users |
| GET | `/api/users/:id` | Yes | Get a user |
| PATCH | `/api/users/:id` | Yes (self only) | Update own name |
| DELETE | `/api/users/:id` | Yes (self only) | Delete own account |
| POST | `/api/projects` | Yes | Create a project |
| GET | `/api/projects` | Yes | List your projects |
| GET | `/api/projects/:id` | Yes | Get a project |
| PATCH | `/api/projects/:id` | Yes (owner only) | Update a project |
| DELETE | `/api/projects/:id` | Yes (owner only) | Delete a project (cascades to tasks) |
| POST | `/api/tasks` | Yes (project owner) | Create a task |
| GET | `/api/tasks?projectId=&assigneeId=&status=` | Yes | List/filter tasks |
| GET | `/api/tasks/:id` | Yes | Get a task |
| PATCH | `/api/tasks/:id` | Yes (owner or assignee) | Update a task (assignee: status only) |
| DELETE | `/api/tasks/:id` | Yes (project owner) | Delete a task |

## 5. Design decisions worth knowing

- **Auth model**: every route except register/login requires `Authorization: Bearer <token>`.
- **Ownership**: a project belongs to the user who created it. Only the owner can edit/delete
  the project or its tasks. A task's assignee can update its `status` only — not title/description.
- **Cascade deletes**: deleting a project deletes its tasks. Deleting a user who's an assignee
  just nulls out `assigneeId` on their tasks rather than deleting the task.
- **Validation**: kept intentionally simple (manual checks) rather than a schema library.

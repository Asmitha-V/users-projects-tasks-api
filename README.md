# Users, Projects & Tasks REST API


A REST API for managing Users, Projects, and Tasks with JWT authentication and ownership-based permissions.

**Repo:** https://github.com/Asmitha-V/users-projects-tasks-api

---

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** SQLite (`better-sqlite3`) — zero setup, file-based
- **Auth:** JWT (`jsonwebtoken`) + password hashing (`bcryptjs`)



## Tested & Verified

- ✅ Server boots, root route lists all endpoints
- ✅ Register creates a user and returns a JWT (`201`)
- ✅ Duplicate email registration correctly rejected (`409`)
- ✅ Login with wrong password correctly rejected (`401`)
- ✅ Authenticated project creation, scoped to the logged-in user (`201`)
- ✅ Task creation and filtering by `projectId` / `status` work
- ✅ A user cannot modify or delete another user's project (`403`)

Verified manually via Postman.

---

## Getting Started

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm

### Installation

```bash
git clone https://github.com/Asmitha-V/users-projects-tasks-api.git
cd users-projects-tasks-api
cp .env.example .env
npm install
npm start
```

The server starts on `http://localhost:4000`. Visit `/` for a list of all routes.

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server runs on | `4000` |
| `JWT_SECRET` | Secret used to sign JWTs | any long random string |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |

---

## API Reference

### Auth

| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | Create a user, returns a JWT |
| POST | `/api/auth/login` | `{ email, password }` | Log in, returns a JWT |

### Users
*(all require `Authorization: Bearer <token>`)*

| Method | Route | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get a single user |
| PATCH | `/api/users/:id` | Update your own name (self only) |
| DELETE | `/api/users/:id` | Delete your own account (self only) |

### Projects
*(all require auth)*

| Method | Route | Description |
|---|---|---|
| POST | `/api/projects` | Create a project |
| GET | `/api/projects` | List your projects |
| GET | `/api/projects/:id` | Get a project |
| PATCH | `/api/projects/:id` | Update a project (owner only) |
| DELETE | `/api/projects/:id` | Delete a project — cascades to its tasks (owner only) |

### Tasks
*(all require auth)*

| Method | Route | Description |
|---|---|---|
| POST | `/api/tasks` | Create a task (project owner only) |
| GET | `/api/tasks?projectId=&assigneeId=&status=` | List/filter tasks |
| GET | `/api/tasks/:id` | Get a task |
| PATCH | `/api/tasks/:id` | Update a task — owner can edit anything, assignee can only change `status` |
| DELETE | `/api/tasks/:id` | Delete a task (project owner only) |

### Example Request

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"secret123"}'
```

```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Website Revamp","description":"Q4 redesign"}'
```

---

## Project Structure

```
users-projects-tasks-api/
├── server.js            # App entrypoint, route mounting, error handling
├── db/index.js          # SQLite connection + schema (auto-migrates on boot)
├── middleware/auth.js   # JWT verification middleware
├── routes/
│   ├── auth.js          # register, login
│   ├── users.js         # list/get/update-self/delete-self
│   ├── projects.js      # CRUD, owner-scoped
│   └── tasks.js         # CRUD, filterable, owner/assignee permissions
├── .env.example
└── package.json
```

## Design Notes

- **Ownership model:** a project belongs to the user who created it. Only the owner can edit or delete the project and its tasks.
- **Assignee permissions:** a task's assignee can update its `status` only — not its title, description, or due date.
- **Cascading deletes:** deleting a project deletes its tasks. Deleting a user who is an assignee nulls out `assigneeId` on their tasks rather than deleting the task.
- **Validation:** handled with explicit manual checks for clarity, rather than a schema library.

## Author

**Asmitha V** 

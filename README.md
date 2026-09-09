# Task 2 — Users, Projects & Tasks REST API

Stack: **Node.js + Express + SQLite** (via `better-sqlite3`), JWT auth, bcrypt password hashing.
No external database to install — SQLite is a local file (`data.sqlite`) created automatically on first run.

## ⚠️ Note on testing

This was built and syntax-checked in a sandboxed environment with no network access, so
`npm install` and an actual server boot could not be run there. Every file passed
`node --check` (valid JS), and the logic was reviewed carefully — but please do a real
smoke test (the steps below) before treating this as done. If anything breaks, paste me
the error and I'll fix it fast.

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
├── server.js           # app entrypoint, mounts routes, error handling
├── db/index.js          # SQLite connection + schema (auto-migrates on boot)
├── middleware/auth.js   # JWT verification middleware
├── routes/
│   ├── auth.js          # register, login
│   ├── users.js         # list/get/update-self/delete-self
│   ├── projects.js       # CRUD, owner-scoped
│   └── tasks.js          # CRUD, filterable, owner/assignee permissions
├── .env.example
└── data.sqlite           # created on first run (gitignore this)
```

## 4. Design decisions worth knowing

- **Auth model**: every route except register/login requires `Authorization: Bearer <token>`.
- **Ownership**: a project belongs to the user who created it. Only the owner can edit/delete
  the project or its tasks. A task's **assignee** can update its `status` only (not title/description/etc.) —
  this is a common real-world permission split worth keeping or changing based on your spec.
- **Cascade deletes**: deleting a project deletes its tasks (`ON DELETE CASCADE`). Deleting a
  user who's an assignee just nulls out `assigneeId` on their tasks rather than deleting the task.
- **Validation**: kept intentionally simple (manual checks) rather than pulling in a schema
  library like `zod` or `joi` — easy to swap in if your rubric wants that.

## 5. What I'd extend first

1. **Pagination** on `GET /api/tasks` and `GET /api/users` — right now they return everything.
2. **Role-based access** (e.g. project "members" beyond just the owner, so a team can share a project).
3. **Input validation library** (`zod`) instead of manual `if` checks, for cleaner error messages.
4. **Testing** — add `jest` + `supertest` for route-level tests; there are none yet.
5. **Refresh tokens** — current JWTs are long-lived (`7d`) with no revocation; fine for a prototype,
   not for production.
6. **Task comments / activity log**, since Task 4 in your guide (AI-powered platform) will likely
   want a history to feed into an AI summarizer.

## 6. Feeding into Task 3 / Task 4

This API is already structured so Task 3 ("Persistent Data Layer") mostly reduces to swapping
`db/index.js` for a different backend (Postgres via `pg`, or an ORM like Prisma) while keeping the
same route logic — the SQL is isolated to that one file and the `routes/*.js` files, so the blast
radius of that change is small by design.

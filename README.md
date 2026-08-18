# Titan SMS — Starter

FastAPI (Python) + MongoDB backend, React + Tailwind frontend. Login,
JWT auth, and the server-side permission system are wired up end to end.
Everything else (students, attendance, slots, vouchers...) gets built on
top of this.

## What's already working
- Login with email (admin/trainer) or CNIC (student)
- JWT issued on login, checked on every protected request
- `require_permission(module, action)` — the one place all permission
  logic lives; attach it to any route to guard it server-side
- Role-based routing in React: Super Admin/Sub Admin -> `/admin`,
  Trainer -> `/trainer`, Student -> `/student`
- 4 seeded test logins (see below) so you can test each role immediately

## 1. Backend setup

You need MongoDB running somewhere — either installed locally, or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster (easier, no install).

```bash
cd server
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set MONGO_URI (and JWT_SECRET to something random)

python -m app.seed               # creates the 4 test logins below
uvicorn app.main:app --reload --port 8000
```

API now running at http://localhost:8000 — check http://localhost:8000/docs
for interactive Swagger docs (test every endpoint here before touching the
frontend).

## 2. Frontend setup

```bash
cd client
npm install

cp .env.example .env
# default VITE_API_URL=http://localhost:8000 is already correct

npm run dev
```

App running at http://localhost:5173

## Test logins (created by `python -m app.seed`)

| Role | Login ID | Password |
|---|---|---|
| Super Admin | superadmin@titan.com | Passw0rd! |
| Sub Admin (limited) | reception@titan.com | Passw0rd! |
| Trainer | trainer@titan.com | Passw0rd! |
| Student | 4230112223334 | Passw0rd! |

Log in as each one and confirm you land on the right portal (`/admin`,
`/trainer`, `/student`) and can't reach the others by editing the URL.

## Adding your next feature (example: Students)

1. **Model**: `server/app/models/student.py` — a Beanie `Document`, add it
   to `DOCUMENT_MODELS` in `app/core/database.py`.
2. **Schema**: `server/app/schemas/student.py` — Pydantic request/response
   shapes.
3. **Router**: `server/app/routers/students.py` — CRUD endpoints, each one
   guarded with `Depends(require_permission(Module.STUDENTS, "read"))` (or
   `"write"`/`"update"`/`"export"`).
4. Register it in `app/main.py`: `app.include_router(students.router)`.
5. **Frontend**: `client/src/pages/admin/Students.jsx` — call the new
   endpoint with the shared `api` client in `src/api/client.js` (it already
   attaches the JWT for you). Add the route in `App.jsx`.

Repeat this pattern for every module in the guide (Attendance, Slots,
Trainers, Vouchers, Assignments, Quizzes...). The auth, permissions, and
layout shell you build features into never change.

## Notes
- Passwords are hashed with bcrypt, never stored in plain text.
- CORS is restricted to `CORS_ORIGINS` in `.env` — add your deployed
  frontend URL there later.
- `User.has_permission()` in `app/models/user.py` is where Super Admin's
  "bypass everything" rule lives — Sub Admins/Trainers/Students always go
  through their `permissions` list.

# FauxDetect

Intelligent expense reimbursement system with fraud detection powered by Tesseract OCR.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Node.js + AdonisJS v6 |
| Queue | @rlanz/bull-queue + BullMQ (Redis) |
| Database | PostgreSQL + Lucid ORM |
| Auth | AdonisJS Auth (access tokens) |
| OCR | Tesseract.js + Taggun OCR |
| Email | AdonisJS Mail (SMTP) |

## Prerequisites

- Node.js 20+
- Docker + Docker Compose

## Getting started

### 1. Start infrastructure (PostgreSQL + Redis + Mailpit)

```bash
docker compose up -d
```

| Service | URL |
|---------|-----|
| API | http://localhost:3333 |
| Mailpit (email UI) | http://localhost:8025 |
| Bull Board (queue UI) | http://localhost:9999/queues |

### 2. Backend setup

```bash
cd backend
cp .env.example .env
node ace generate:key   # paste the output into APP_KEY in .env
npm install
node ace migration:run
node ace db:seed
node ace serve --hmr
```

The API will be available at `http://localhost:3333`.

### 3. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local   # if applicable
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

| Route | Description |
|-------|-------------|
| `/login` | Login page |
| `/dashboard` | Employee dashboard |
| `/expenses/new` | Submit new expense |
| `/expenses/[id]` | Expense detail |
| `/hr/dashboard` | HR dashboard |
| `/hr/expenses` | HR expense review table |

> Route protection is handled at the Edge via `src/proxy.ts`. Unauthenticated requests are redirected to `/login`; role isolation prevents employees from accessing HR routes and vice-versa.

### 4. Start the queue worker

The worker processes expense files in the background (Taggun OCR + fraud detection). Run it in a **separate terminal**:

```bash
cd backend
npm run worker
# or: node ace queue:listen
```

To listen on a specific queue only:

```bash
node ace queue:listen --queue=default
```

> The worker requires Redis to be running (`docker compose up -d`).  
> Each uploaded expense starts as `processing`. The worker updates it to `pending`, `manual_review`, or `rejected` after analysis.

### 5. Running tests

**Backend** — create the test database (first time only):

```bash
sudo docker exec fauxdetect-postgres createdb -U postgres fauxdetect_test
```

Then run the suite from `backend/`:

```bash
cd backend
node ace test
```

**Frontend** — unit tests (Vitest):

```bash
cd frontend
npm test
```

**Frontend** — E2E tests (Playwright, requires the dev server running):

```bash
cd frontend
npm run test:e2e
```

The test runner applies migrations automatically via `testUtils.db().migrate()`, so no manual backend setup is needed beyond creating the database.

### Test credentials (seeded)

| Role | Email | Password |
|------|-------|----------|
| HR | hr@company.com | admin123 |
| Employee | john@company.com | password123 |

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DB_*` | PostgreSQL connection (matches docker-compose defaults) |
| `REDIS_HOST / REDIS_PORT` | Redis connection (matches docker-compose defaults) |
| `SMTP_HOST / SMTP_PORT` | SMTP server — defaults point to Mailpit (`localhost:1025`) |
| `SMTP_USER / SMTP_PASS` | Optional — leave empty when using Mailpit |
| `TAGGUN_API_KEY` | Taggun OCR API key (https://www.taggun.io) |

## Project structure

```
faux-detect/
├── docker-compose.yml      # PostgreSQL + Redis + Mailpit
├── backend/                # AdonisJS v6
│   ├── app/
│   │   ├── models/         # User, Category, Expense
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/       # Taggun OCR, fraud detector, category matcher
│   │   └── jobs/           # ProcessExpenseJob, SendEmailJob (Bull Queue)
│   ├── config/             # database, auth, mail, queue
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── start/
│       ├── routes.ts
│       └── kernel.ts
└── frontend/               # Next.js 16 (App Router)
    ├── src/
    │   ├── app/
    │   │   ├── (employee)/     # /dashboard, /expenses/new, /expenses/[id]
    │   │   ├── (hr)/           # /hr/dashboard, /hr/expenses, /hr/expenses/[id]
    │   │   ├── api/            # BFF proxy routes (/api/auth/session, /api/proxy/*)
    │   │   └── login/
    │   ├── components/         # StatusBadge, FraudSignalsCard, FileViewer, …
    │   ├── contexts/           # AuthContext
    │   ├── hooks/              # useAuth, useAuthContext
    │   └── proxy.ts            # Edge middleware: route protection + role isolation
    ├── __tests__/unit/         # Vitest unit tests (proxy logic, useAuth hook)
    ├── e2e/                    # Playwright E2E tests (auth flows)
    └── playwright.config.ts
```

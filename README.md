# FauxDetect

Intelligent expense reimbursement system with AI fraud detection powered by Google Cloud Document AI.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Node.js + AdonisJS v6 |
| Queue | @rlanz/bull-queue + BullMQ (Redis) |
| Database | PostgreSQL + Lucid ORM |
| Auth | AdonisJS Auth (access tokens) |
| OCR / AI | Google Cloud Document AI |
| Email | AdonisJS Mail (SMTP) |

## Prerequisites

- Node.js 20+
- Docker + Docker Compose

## Getting started

### 1. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env   # fill in your credentials
npm install
node ace migration:run
node ace db:seed
node ace serve --hmr
```

The API will be available at `http://localhost:3333`.

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
| `SMTP_*` | SMTP credentials for outgoing email |
| `GOOGLE_PROJECT_ID` | GCP project ID |
| `GOOGLE_PROCESSOR_ID` | Document AI processor ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account JSON |

## Project structure

```
faux-detect/
├── docker-compose.yml      # PostgreSQL + Redis
├── backend/                # AdonisJS v6
│   ├── app/
│   │   ├── models/         # User, Category, Expense
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/       # Google Doc AI, fraud detector, category matcher, email
│   │   └── jobs/           # ProcessExpenseJob, SendEmailJob (Bull Queue)
│   ├── config/             # database, auth, mail, queue
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── start/
│       ├── routes.ts
│       └── kernel.ts
└── frontend/               # Next.js (App Router) — coming soon
```

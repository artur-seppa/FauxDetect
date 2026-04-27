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
└── frontend/               # Next.js (App Router) — coming soon
```

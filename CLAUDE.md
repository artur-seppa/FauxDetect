# FauxDetect — Intelligent Expense Reimbursement with AI Fraud Detection

Expense reimbursement management system with fraud detection powered by Tesseract OCR.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Node.js + AdonisJS v6 |
| Queue | @rlanz/bull-queue + BullMQ (Redis) |
| Database | PostgreSQL + Lucid ORM (AdonisJS) |
| Auth | AdonisJS Auth (access tokens) |
| File Upload | AdonisJS Drive |
| OCR | Tesseract.js (`tesseract.js` + `pdf-parse`) |
| Email | AdonisJS Mail (dispatched via Adonis Queue) |

## Repository Structure

```
faux-detect/
├── backend/          # AdonisJS v6
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   │   ├── ocr_service.ts             # OcrService interface
│   │   │   ├── tesseract_ocr_service.ts   # Tesseract implementation
│   │   │   ├── fraud_detector_service.ts
│   │   │   └── category_matcher_service.ts
│   │   ├── jobs/                          # Bull Queue jobs
│   │   │   ├── process_expense_job.ts     # OCR + fraud analysis
│   │   │   └── send_email_job.ts          # Sends email via queue
│   │   └── middleware/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── config/
│   └── start/routes.ts
└── frontend/         # Next.js (App Router)
    ├── app/
    │   ├── (employee)/   # Employee routes
    │   └── (hr)/         # HR routes
    ├── components/
    └── lib/
```

## Data Models (Lucid ORM)

### User
- `id`, `email`, `name`, `password`, `role` (employee | hr | admin), `department`

### Category
- `id`, `name` (unique), `max_amount` (nullable), `active`

### Expense
- `id`, `user_id`, `original_filename`, `file_hash` (SHA256, unique — prevents duplicates)
- `extracted_amount`, `extracted_date`, `extracted_vendor`, `extracted_description`
- `fraud_signals` (JSON), `fraud_score` (0–100), `fraud_details`
- `selected_category_id`, `category_match` (boolean)
- `status` (pending | approved | rejected | manual_review)
- `rejection_reason`, `approved_by`, `approved_at`

## Business Rules

### Fraud Score (0–100)
```
duplicate_file                → +50  (SHA256 match in DB)
amount_exceeds_category_limit → +20  (extracted > category.max_amount)
low_ocr_confidence            → +15  (Tesseract avg confidence < 70%)
suspicious_words              → +10  (keywords: test, fake, lorem, etc.)

>= 70  → REJECTED automatically
40–69  → MANUAL_REVIEW
< 40   → PENDING (goes to HR queue)
```

### Category Match
Compare `extracted_vendor` + `extracted_description` against category keywords:
```
Lunch:              ["restaurant", "food", "lunch", "snack", "ifood"]
Uber:               ["uber", "99", "ride", "transport", "taxi"]
Hotel:              ["hotel", "airbnb", "accommodation", "inn"]
Office Supplies:    ["stationery", "office", "pen", "notebook"]
Parking:            ["parking", "valet", "garage"]
```

### Deduplication
SHA256 hash of the file buffer. If it already exists in the database → `duplicate_file` signal adds +50 to fraud score, triggering automatic rejection.

## Processing Flow (Queue)

```
1. Employee uploads file → backend saves it + creates Expense with status=processing
2. Dispatcher enqueues ProcessExpenseJob
3. ProcessExpenseJob:
   a. Reads file from storage → computes SHA256 → checks for duplicate
   b. Runs Tesseract OCR (image) or pdf-parse (PDF)
   c. Calculates fraudScore + categoryMatch
   d. Updates Expense (final status + extracted data)
   e. Enqueues SendEmailJob if status = rejected (high score)
4. HR reviews → approves or rejects
5. SendEmailJob → AdonisJS Mail → HTML template
```

## Environment Variables (.env)

```
# Database
DATABASE_URL=postgresql://...

# AdonisJS
APP_KEY=...

# Queue (Redis)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=noreply@company.com
```

## Seed Data

**Categories:** Lunch, Uber, Hotel, Office Supplies, Parking

**Test users:**
- HR: `hr@company.com` / `admin123` (role: hr)
- Employee: `john@company.com` / `password123` (role: employee)

## Roles and Permissions

| Role | Access |
|------|--------|
| employee | Own expenses only (create, list, view detail) |
| hr | All expenses + approve/reject + manage categories + export CSV |
| admin | Everything above + manage users |

## API Endpoints (AdonisJS)

```
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/expenses          (employee: own | hr: all)
POST   /api/expenses          (employee — upload + category)
GET    /api/expenses/:id
PATCH  /api/expenses/:id/approve   (hr only)
PATCH  /api/expenses/:id/reject    (hr only)

GET    /api/categories         (all authenticated)
POST   /api/categories         (hr only)
PUT    /api/categories/:id     (hr only)
DELETE /api/categories/:id     (hr only)

GET    /api/hr/dashboard       (hr only — counters)
GET    /api/hr/export/csv      (hr only)
```

## Frontend Screens (Next.js)

### Employee (`/app/(employee)/`)
- `/dashboard` — My expenses with color-coded status
- `/expenses/new` — File upload + category selection
- `/expenses/[id]` — Detail view with fraud signals and rejection reason

### HR (`/app/(hr)/`)
- `/dashboard` — Cards: Pending / Under review / Approved today
- `/expenses` — Table with filters (status, category, employee, date)
- `/expenses/[id]` — Review screen: inline file viewer, extracted data, fraud signals card, category match badge, approve/reject buttons

## Reusable Components

- `StatusBadge` — Color by status (pending=orange, approved=green, rejected=red, manual_review=yellow)
- `FraudSignalsCard` — Green/red icons for each Google signal
- `CategoryMatchBadge` — ✅ / ❌ with explanatory text
- `FileViewer` — `<iframe>` for PDF or `<img>` for images

## Code Conventions

- Backend: TypeScript, snake_case for database/Lucid columns, camelCase in application code
- Frontend: TypeScript, PascalCase for components, camelCase with `use` prefix for hooks
- All input validated with AdonisJS Validator on the backend
- Never persist the raw file after processing — use in-memory buffer; use Drive for permanent storage
- Rate limit: max 5 uploads/min per user (AdonisJS Rate Limiter)
- Allowed upload extensions: `.jpg`, `.jpeg`, `.png`, `.pdf` (max 5 MB)

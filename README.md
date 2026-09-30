# PMEC Student Service Request Portal

A full-stack portal for Parala Maharaja Engineering College where students submit
service requests (semester registration, mark correction, back paper, revaluation,
exam grievance, bonafide certificate, scholarship verification) and admins review,
approve/reject/forward them — approvals are **e-signed** and auto-generate a signed
PDF certificate or approval memo.

## Tech Stack
- **Frontend:** React + React Router + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (raw SQL via `pg`, no ORM)
- **Auth:** JWT with a `role` (`student` / `admin`) claim, enforced by middleware
- **PDF generation:** pdfkit (certificates + approval memos, with the admin's e-signature image stamped on)
- **Email:** nodemailer (placeholder SMTP — wire up real credentials to go live)

## Folder Structure
```
pmec-portal/
  backend/
    config/db.js            # PostgreSQL pool
    migrations/001_init.sql # full schema (tables, enums, indexes, triggers)
    migrations/run.js       # applies all .sql files
    seed/seed.js             # 2 admins + 3 students
    models/                  # thin query modules (Student, Admin, Request, ...)
    middleware/auth.js        # JWT verify + requireRole()
    middleware/upload.js      # multer configs (documents / signatures)
    controllers/              # business logic
    routes/                   # Express routers
    utils/mailer.js           # nodemailer wrapper
    utils/pdfGenerator.js     # certificate + approval-memo PDF builder (e-signature stamping)
    utils/certNumber.js       # certificate number formatting
    uploads/                  # documents/, signatures/, certificates/ (served at /uploads)
    server.js
  frontend/
    src/
      api/axios.js            # axios instance with JWT interceptor
      context/AuthContext.jsx
      components/             # StatusBadge, Navbar, RequestCard, Timeline, SignaturePad, ProtectedRoute
      pages/Login.jsx, Register.jsx
      pages/student/           # StudentDashboard, NewRequest, RequestDetail
      pages/admin/              # AdminDashboard, AdminRequestDetail, AdminSignatureSetup
      App.jsx
```

## Key Features

### Student
- Register / login (JWT)
- Dashboard with color-coded status badges (yellow=submitted, blue=under_review, green=approved, red=rejected, purple=forwarded)
- Single **adaptive** "New Request" form — fields change per request type (e.g. bonafide asks for "purpose", back paper asks for "subject code + semester", scholarship asks for "scheme name" + a required document upload)
- File upload for supporting documents
- Request detail page with full status timeline
- Certificate download once a bonafide/scholarship request is approved

### Admin
- Login (accounts are provisioned/seeded, not self-registered)
- Pending queue, filterable by status / type / department
- Request detail: student info, uploaded docs, Approve / Reject / Forward / Mark-under-review — every action requires a comment
- **E-signature**: an admin draws (canvas pad) or uploads their signature once; it's stored and automatically stamped on every certificate/approval memo they sign from then on. Approval is blocked until a signature is on file. Each approval log entry snapshots the signature used, so history stays correct even if the signature is later changed.
- On approval of `bonafide_certificate` / `scholarship_verification`: auto-generates a PDF certificate with student details, a unique certificate number, issue date, and the e-signature
- On approval of any other type: auto-generates a signed "Approval Memo" PDF so every approval has a signed record
- Audit log per request (every action, who took it, when, and the signature used)

### Shared
- Email notification (nodemailer, placeholder SMTP) on every status change
- Role-based route protection, both on the API (`requireRole` middleware) and the frontend (`ProtectedRoute`)
- Responsive, card-based Tailwind UI

## Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Database
```bash
createdb pmec_portal
```

### 3. Backend
```bash
cd backend
cp .env.example .env
# edit .env: set PGUSER/PGPASSWORD/PGDATABASE, JWT_SECRET, and SMTP_* if you want real emails
npm install
npm run migrate   # creates all tables/enums/indexes
npm run seed      # inserts 2 admins + 3 students
npm run dev       # starts on http://localhost:5000
```

**Seeded accounts** (all share the password `Password@123`):
- Admin: `ashok.examcell@pmec.edu` (Examination Cell)
- Admin: `sunita.hod.cse@pmec.edu` (HOD, CSE)
- Student: `ravi.sahoo@student.pmec.edu`
- Student: `priya.patnaik@student.pmec.edu`
- Student: `suman.behera@student.pmec.edu`

> Before an admin can approve anything, they must set up their e-signature at
> **E-Signature** in the top nav (draw it on the pad, or upload an image).

### 4. Frontend
```bash
cd frontend
npm install
npm start   # starts on http://localhost:3000
```
The frontend reads the API URL from `REACT_APP_API_URL` (defaults to `http://localhost:5000/api`). Create `frontend/.env` if you need to override it:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Try it out
1. Log in as a student, submit a `bonafide_certificate` request with a purpose.
2. Log in as an admin, go to the Queue, open the request.
3. Set up your e-signature first if you haven't (top nav → E-Signature).
4. Approve the request with a comment — a PDF certificate is generated and e-signed automatically.
5. Log back in as the student and download the certificate from the request detail page.

## Notes / Production Considerations
- File storage is local disk (`backend/uploads/`) for simplicity; swap `middleware/upload.js` for an S3-compatible SDK (e.g. `@aws-sdk/client-s3` + `multer-s3`) to go to object storage without touching the rest of the app.
- SMTP is a placeholder — plug in real credentials (Gmail app password, SendGrid, Mailtrap, etc.) in `.env`, or replace `utils/mailer.js` with your provider's SDK.
- Certificate numbers use a Postgres sequence (`certificate_seq`) for atomicity under concurrent approvals.
- Passwords are hashed with bcrypt; never store plaintext passwords.
- For production, put the app behind HTTPS, rotate `JWT_SECRET`, and consider short-lived access tokens + refresh tokens instead of a single 7-day JWT.

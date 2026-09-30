-- PMEC Student Service Request Portal - Initial Schema
-- Run with: psql -U <user> -d <db> -f migrations/001_init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== ENUM TYPES ==========
DO $$ BEGIN
  CREATE TYPE request_type AS ENUM (
    'semester_registration',
    'internal_mark_correction',
    'back_paper',
    'revaluation',
    'exam_grievance',
    'bonafide_certificate',
    'scholarship_verification'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'forwarded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_action AS ENUM (
    'submitted',
    'reviewed',
    'approved',
    'rejected',
    'forwarded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========== STUDENTS ==========
CREATE TABLE IF NOT EXISTS students (
  id            SERIAL PRIMARY KEY,
  roll_no       VARCHAR(30) UNIQUE NOT NULL,
  name          VARCHAR(150) NOT NULL,
  department    VARCHAR(100) NOT NULL,
  semester      INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 12),
  email         VARCHAR(150) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  status        VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active' or 'pending_verification'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== ADMINS ==========
-- signature_url / signature_updated_at support the e-signature feature:
-- an admin uploads or draws a signature once; it is stamped onto every
-- approval PDF / certificate they sign off on afterwards.
CREATE TABLE IF NOT EXISTS admins (
  id                   SERIAL PRIMARY KEY,
  name                 VARCHAR(150) NOT NULL,
  role                 VARCHAR(50) NOT NULL DEFAULT 'admin', -- e.g. admin, hod, exam_cell, registrar
  department           VARCHAR(100),
  email                VARCHAR(150) UNIQUE NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  signature_url         TEXT,              -- path/URL to stored signature image (PNG)
  signature_updated_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== REQUESTS ==========
CREATE TABLE IF NOT EXISTS requests (
  id            SERIAL PRIMARY KEY,
  student_id    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type          request_type NOT NULL,
  status        request_status NOT NULL DEFAULT 'submitted',
  details       JSONB NOT NULL DEFAULT '{}'::jsonb, -- dynamic per-type fields (purpose, subject_code, scheme_name, etc.)
  remarks       TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_student ON requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(type);

-- ========== REQUEST DOCUMENTS ==========
CREATE TABLE IF NOT EXISTS request_documents (
  id           SERIAL PRIMARY KEY,
  request_id   INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  file_url     TEXT NOT NULL,
  doc_type     VARCHAR(100) NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== APPROVAL LOGS ==========
-- signature_url is a snapshot: the signature image the admin had on file
-- at the moment they took this action, so history stays accurate even if
-- the admin later replaces their signature.
CREATE TABLE IF NOT EXISTS approval_logs (
  id            SERIAL PRIMARY KEY,
  request_id    INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  admin_id      INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  action        approval_action NOT NULL,
  comment       TEXT,
  signature_url TEXT,
  "timestamp"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_logs_request ON approval_logs(request_id);

-- ========== NOTIFICATIONS ==========
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  request_id  INTEGER REFERENCES requests(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  channel     VARCHAR(20) NOT NULL DEFAULT 'email',
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== CERTIFICATES ==========
CREATE TABLE IF NOT EXISTS certificates (
  id              SERIAL PRIMARY KEY,
  request_id      INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  certificate_no  VARCHAR(50) UNIQUE NOT NULL,
  pdf_url         TEXT NOT NULL,
  signed_by       INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shared sequence for human-readable certificate numbers
CREATE SEQUENCE IF NOT EXISTS certificate_seq START 1;

-- Trigger to keep requests.updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_requests_updated_at ON requests;
CREATE TRIGGER trg_requests_updated_at
BEFORE UPDATE ON requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

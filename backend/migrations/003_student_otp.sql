-- Migration 003: Student Login 2-Step OTP Authentication
ALTER TABLE students ADD COLUMN IF NOT EXISTS otp_code_hash TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;

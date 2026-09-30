-- PMEC Student Service Request Portal - Feature 1 & 2 Migration
-- 1. Student ID-Card verification fields
-- 2. Admin 2-Step OTP email verification fields

ALTER TABLE students ADD COLUMN IF NOT EXISTS id_card_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS id_card_uploaded_at TIMESTAMPTZ;

ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp_code_hash TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;

-- Migration: add password_hash column to users table
-- Run: wrangler d1 execute tts-db --file=migrations/001_add_password_hash.sql

ALTER TABLE users ADD COLUMN password_hash TEXT;

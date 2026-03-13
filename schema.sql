-- ─────────────────────────────────────────────────────────────────────────────
-- NGHI-TTS Database Schema (Cloudflare D1 / SQLite)
-- Run: wrangler d1 execute tts-db --file=schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          TEXT    PRIMARY KEY,          -- UUIDv4
  email       TEXT    UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  password_hash TEXT,                        -- NULL for Google-only accounts
  role        TEXT    NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  plan        TEXT    NOT NULL DEFAULT 'free',   -- 'free' | 'pro'
  quota_daily INTEGER NOT NULL DEFAULT 5000,     -- chars/day (free=5000, pro=50000)
  is_active   INTEGER NOT NULL DEFAULT 1,        -- 0=banned
  created_at  INTEGER NOT NULL,                  -- Unix ms
  updated_at  INTEGER NOT NULL
);


-- ── OAuth Providers ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oauth_providers (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,          -- 'google'
  provider_uid TEXT NOT NULL,          -- Google `sub` field
  UNIQUE(provider, provider_uid)
);

-- ── Sessions ──────────────────────────────────────────────────────────────────
-- Stored in both D1 (for lookup) and KV (for fast auth middleware)
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT    PRIMARY KEY,      -- 32-byte random hex
  user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,         -- Unix ms
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ── TTS Processing Queue ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tts_queue (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL REFERENCES users(id),
  text        TEXT    NOT NULL,
  model       TEXT    NOT NULL,
  voice       TEXT,
  speed       REAL    NOT NULL DEFAULT 1.0,
  lang        TEXT    NOT NULL DEFAULT 'vi',
  status      TEXT    NOT NULL DEFAULT 'pending',
    -- 'pending' | 'processing' | 'done' | 'error' | 'cancelled'
  priority    INTEGER NOT NULL DEFAULT 0,
    -- 0 = free, 1 = pro, 2 = admin (higher = processed first)
  result_key  TEXT,                    -- R2 object key when done
  error_msg   TEXT,
  char_count  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  started_at  INTEGER,
  done_at     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_queue_pending ON tts_queue(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_queue_user    ON tts_queue(user_id, created_at DESC);

-- ── Daily Usage Logs ─────────────────────────────────────────────────────────
-- One row per (user, date); upserted on each TTS job
CREATE TABLE IF NOT EXISTS usage_logs (
  id         TEXT    PRIMARY KEY,
  user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT    NOT NULL,         -- 'YYYY-MM-DD'
  char_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_logs(user_id, date);

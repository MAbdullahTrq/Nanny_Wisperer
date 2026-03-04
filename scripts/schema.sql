-- Nanny Whisperer – PostgreSQL schema (replaces Airtable)
-- Run: psql "$DATABASE_URL" -f scripts/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (auth + profile link)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  user_type TEXT NOT NULL DEFAULT 'Host',
  password_hash TEXT,
  ghl_contact_id TEXT,
  airtable_host_id TEXT,
  airtable_nanny_id TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_matchmaker BOOLEAN NOT NULL DEFAULT false,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Hosts (profile + JSONB for all onboarding fields)
CREATE TABLE IF NOT EXISTS hosts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  location TEXT,
  tier TEXT,
  data JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_hosts_user_id ON hosts(user_id);
CREATE INDEX IF NOT EXISTS idx_hosts_tier ON hosts(tier);

-- Nannies
CREATE TABLE IF NOT EXISTS nannies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  location TEXT,
  tier TEXT,
  data JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_nannies_user_id ON nannies(user_id);
CREATE INDEX IF NOT EXISTS idx_nannies_tier ON nannies(tier);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  host_id TEXT NOT NULL,
  nanny_id TEXT NOT NULL,
  score INTEGER,
  host_proceed BOOLEAN DEFAULT false,
  nanny_proceed BOOLEAN DEFAULT false,
  both_proceed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  match_source TEXT DEFAULT 'auto',
  sent_to_host_at TIMESTAMPTZ,
  sent_to_caregiver_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_matches_host ON matches(host_id);
CREATE INDEX IF NOT EXISTS idx_matches_nanny ON matches(nanny_id);

-- Shortlists and their match IDs (array stored as junction table)
CREATE TABLE IF NOT EXISTS shortlists (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  host_id TEXT NOT NULL,
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS shortlist_matches (
  shortlist_id TEXT NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  ord INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (shortlist_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_shortlists_host ON shortlists(host_id);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  match_id TEXT NOT NULL,
  host_id TEXT NOT NULL,
  nanny_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_match ON conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_conversations_host ON conversations(host_id);
CREATE INDEX IF NOT EXISTS idx_conversations_nanny ON conversations(nanny_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  content TEXT,
  attachment_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Interview requests
CREATE TABLE IF NOT EXISTS interview_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  match_id TEXT NOT NULL,
  host_id TEXT NOT NULL,
  nanny_id TEXT NOT NULL,
  slot1 TEXT,
  slot2 TEXT,
  slot3 TEXT,
  slot4 TEXT,
  slot5 TEXT,
  selected_slot_index INTEGER,
  google_meet_link TEXT,
  google_calendar_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_slots',
  is_vip BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_interview_requests_match ON interview_requests(match_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_host ON interview_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_nanny ON interview_requests(nanny_id);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Google Calendar tokens (one per user)
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL,
  calendar_id TEXT,
  updated_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user ON google_calendar_tokens(user_id);

-- Reported issues (user-submitted; admin list/update status)
CREATE TABLE IF NOT EXISTS reported_issues (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved'))
);

CREATE INDEX IF NOT EXISTS idx_reported_issues_user ON reported_issues(user_id);
CREATE INDEX IF NOT EXISTS idx_reported_issues_status ON reported_issues(status);

-- Notifications (in-app; bell in nav)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

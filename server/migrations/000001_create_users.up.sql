CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    total_score     INT  NOT NULL DEFAULT 0,
    problems_solved INT  NOT NULL DEFAULT 0,
    current_streak  INT  NOT NULL DEFAULT 0,
    max_streak      INT  NOT NULL DEFAULT 0,
    last_contest_date DATE,
    role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

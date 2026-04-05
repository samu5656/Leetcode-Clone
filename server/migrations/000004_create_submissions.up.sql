CREATE TABLE submissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    problem_id  UUID NOT NULL REFERENCES problems(id)  ON DELETE CASCADE,
    contest_id  UUID REFERENCES contests(id)           ON DELETE SET NULL,
    language    TEXT NOT NULL,
    source_code TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','wrong_answer','tle','runtime_error','compilation_error')),
    passed      INT  NOT NULL DEFAULT 0,
    total       INT  NOT NULL DEFAULT 0,
    time_ms     REAL,
    memory_kb   REAL,
    score       INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_user    ON submissions(user_id);
CREATE INDEX idx_submissions_contest ON submissions(contest_id) WHERE contest_id IS NOT NULL;

CREATE TABLE contests (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title      TEXT        NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time   TIMESTAMPTZ NOT NULL,
    status     TEXT        NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE TABLE contest_problems (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    points     INT  NOT NULL,
    UNIQUE(contest_id, problem_id)
);

CREATE TABLE contest_participants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID        NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    score      INT         NOT NULL DEFAULT 0,
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(contest_id, user_id)
);

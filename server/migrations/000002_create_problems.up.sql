CREATE TABLE problems (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title              TEXT    NOT NULL,
    slug               TEXT    NOT NULL UNIQUE,
    description        TEXT    NOT NULL,
    difficulty         TEXT    NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    function_signature TEXT,
    time_limit_ms      INT     NOT NULL DEFAULT 2000,
    memory_limit_kb    INT     NOT NULL DEFAULT 256000,
    is_active          BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE test_cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id      UUID    NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input           TEXT    NOT NULL,
    expected_output TEXT    NOT NULL,
    is_sample       BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE boilerplates (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language   TEXT NOT NULL,
    code       TEXT NOT NULL,
    UNIQUE(problem_id, language)
);

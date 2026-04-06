package data

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Problem struct {
	ID                string    `json:"id"`
	Title             string    `json:"title"`
	Slug              string    `json:"slug"`
	Description       string    `json:"description"`
	Difficulty        string    `json:"difficulty"`
	FunctionSignature *string   `json:"function_signature,omitempty"`
	TimeLimitMs       int       `json:"time_limit_ms"`
	MemoryLimitKb     int       `json:"memory_limit_kb"`
	IsActive          bool      `json:"is_active"`
	CreatedAt         time.Time `json:"created_at"`
}

type TestCase struct {
	ID             string `json:"id"`
	ProblemID      string `json:"problem_id"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	IsSample       bool   `json:"is_sample"`
}

type Boilerplate struct {
	ID        string `json:"id"`
	ProblemID string `json:"problem_id"`
	Language  string `json:"language"`
	Code      string `json:"code"`
}

// CreateProblemInput holds everything needed to create a problem.
type CreateProblemInput struct {
	Title             string              `json:"title"`
	Slug              string              `json:"slug"`
	Description       string              `json:"description"`
	Difficulty        string              `json:"difficulty"`
	FunctionSignature *string             `json:"function_signature,omitempty"`
	TimeLimitMs       int                 `json:"time_limit_ms"`
	MemoryLimitKb     int                 `json:"memory_limit_kb"`
	TestCases         []CreateTestCase    `json:"test_cases"`
	Boilerplates      []CreateBoilerplate `json:"boilerplates,omitempty"`
}

type CreateTestCase struct {
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	IsSample       bool   `json:"is_sample"`
}

type CreateBoilerplate struct {
	Language string `json:"language"`
	Code     string `json:"code"`
}

type ProblemModel struct {
	DB *pgxpool.Pool
}

// Insert creates a problem along with its test cases and boilerplates in a transaction.
func (m ProblemModel) Insert(input *CreateProblemInput) (*Problem, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tx, err := m.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var problem Problem
	query := `
		INSERT INTO problems (title, slug, description, difficulty, function_signature, time_limit_ms, memory_limit_kb)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, title, slug, description, difficulty, function_signature, time_limit_ms, memory_limit_kb, is_active, created_at`

	err = tx.QueryRow(ctx, query,
		input.Title, input.Slug, input.Description, input.Difficulty,
		input.FunctionSignature, input.TimeLimitMs, input.MemoryLimitKb,
	).Scan(
		&problem.ID, &problem.Title, &problem.Slug, &problem.Description,
		&problem.Difficulty, &problem.FunctionSignature,
		&problem.TimeLimitMs, &problem.MemoryLimitKb, &problem.IsActive, &problem.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Insert test cases.
	for _, tc := range input.TestCases {
		_, err = tx.Exec(ctx,
			`INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES ($1, $2, $3, $4)`,
			problem.ID, tc.Input, tc.ExpectedOutput, tc.IsSample,
		)
		if err != nil {
			return nil, err
		}
	}

	// Insert boilerplates.
	for _, bp := range input.Boilerplates {
		_, err = tx.Exec(ctx,
			`INSERT INTO boilerplates (problem_id, language, code) VALUES ($1, $2, $3)`,
			problem.ID, bp.Language, bp.Code,
		)
		if err != nil {
			return nil, err
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, err
	}

	return &problem, nil
}

// GetBySlug returns a problem by its slug.
func (m ProblemModel) GetBySlug(slug string) (*Problem, error) {
	query := `
		SELECT id, title, slug, description, difficulty, function_signature,
		       time_limit_ms, memory_limit_kb, is_active, created_at
		FROM problems WHERE slug = $1 AND is_active = true`

	var p Problem
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, slug).Scan(
		&p.ID, &p.Title, &p.Slug, &p.Description, &p.Difficulty,
		&p.FunctionSignature, &p.TimeLimitMs, &p.MemoryLimitKb,
		&p.IsActive, &p.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	return &p, nil
}

// GetByID returns a problem by ID.
func (m ProblemModel) GetByID(id string) (*Problem, error) {
	query := `
		SELECT id, title, slug, description, difficulty, function_signature,
		       time_limit_ms, memory_limit_kb, is_active, created_at
		FROM problems WHERE id = $1`

	var p Problem
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.Title, &p.Slug, &p.Description, &p.Difficulty,
		&p.FunctionSignature, &p.TimeLimitMs, &p.MemoryLimitKb,
		&p.IsActive, &p.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	return &p, nil
}

// List returns paginated active problems, optionally filtered by difficulty.
func (m ProblemModel) List(difficulty string, filters Filters) ([]*Problem, Metadata, error) {
	query := `
		SELECT count(*) OVER(), id, title, slug, description, difficulty,
		       function_signature, time_limit_ms, memory_limit_kb, is_active, created_at
		FROM problems
		WHERE is_active = true AND ($1 = '' OR difficulty = $1)
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	rows, err := m.DB.Query(ctx, query, difficulty, filters.Limit(), filters.Offset())
	if err != nil {
		return nil, Metadata{}, err
	}
	defer rows.Close()

	totalRecords := 0
	problems := []*Problem{}

	for rows.Next() {
		var p Problem
		err := rows.Scan(
			&totalRecords, &p.ID, &p.Title, &p.Slug, &p.Description, &p.Difficulty,
			&p.FunctionSignature, &p.TimeLimitMs, &p.MemoryLimitKb,
			&p.IsActive, &p.CreatedAt,
		)
		if err != nil {
			return nil, Metadata{}, err
		}
		problems = append(problems, &p)
	}

	metadata := CalculateMetadata(filters.Page, filters.PageSize, totalRecords)

	return problems, metadata, nil
}

// Delete soft-deletes a problem.
func (m ProblemModel) Delete(id string) error {
	query := `UPDATE problems SET is_active = false WHERE id = $1`
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	result, err := m.DB.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrRecordNotFound
	}
	return nil
}

// GetTestCases returns all test cases for a problem. If sampleOnly is true, only sample cases.
func (m ProblemModel) GetTestCases(problemID string, sampleOnly bool) ([]TestCase, error) {
	query := `
		SELECT id, problem_id, input, expected_output, is_sample
		FROM test_cases
		WHERE problem_id = $1 AND ($2 = false OR is_sample = true)
		ORDER BY id`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	rows, err := m.DB.Query(ctx, query, problemID, sampleOnly)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var testCases []TestCase
	for rows.Next() {
		var tc TestCase
		err := rows.Scan(&tc.ID, &tc.ProblemID, &tc.Input, &tc.ExpectedOutput, &tc.IsSample)
		if err != nil {
			return nil, err
		}
		testCases = append(testCases, tc)
	}

	return testCases, nil
}

// GetBoilerplates returns all boilerplates for a problem.
func (m ProblemModel) GetBoilerplates(problemID string) ([]Boilerplate, error) {
	query := `SELECT id, problem_id, language, code FROM boilerplates WHERE problem_id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	rows, err := m.DB.Query(ctx, query, problemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var boilerplates []Boilerplate
	for rows.Next() {
		var bp Boilerplate
		err := rows.Scan(&bp.ID, &bp.ProblemID, &bp.Language, &bp.Code)
		if err != nil {
			return nil, err
		}
		boilerplates = append(boilerplates, bp)
	}

	return boilerplates, nil
}

// GetBoilerplate returns a specific boilerplate for a problem and language.
func (m ProblemModel) GetBoilerplate(problemID, language string) (*Boilerplate, error) {
	query := `SELECT id, problem_id, language, code FROM boilerplates WHERE problem_id = $1 AND language = $2`

	var bp Boilerplate
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, problemID, language).Scan(&bp.ID, &bp.ProblemID, &bp.Language, &bp.Code)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	return &bp, nil
}

// IsCompletedByUser checks if a user has an accepted submission for a problem.
// If contestID is provided, only checks submissions within that contest.
func (m ProblemModel) IsCompletedByUser(problemID, userID string, contestID *string) (bool, error) {
	var query string
	var args []any

	if contestID != nil {
		query = `SELECT EXISTS(SELECT 1 FROM submissions WHERE problem_id = $1 AND user_id = $2 AND contest_id = $3 AND status = 'accepted')`
		args = []any{problemID, userID, *contestID}
	} else {
		query = `SELECT EXISTS(SELECT 1 FROM submissions WHERE problem_id = $1 AND user_id = $2 AND status = 'accepted')`
		args = []any{problemID, userID}
	}

	var exists bool
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, args...).Scan(&exists)
	return exists, err
}

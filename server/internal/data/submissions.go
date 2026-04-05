package data

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Submission struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	ProblemID    string    `json:"problem_id"`
	ContestID    *string   `json:"contest_id,omitempty"`
	Language     string    `json:"language"`
	SourceCode   string    `json:"source_code,omitempty"`
	Status       string    `json:"status"`
	Passed       int       `json:"passed"`
	Total        int       `json:"total"`
	TimeMs       *float64  `json:"time_ms,omitempty"`
	MemoryKb     *float64  `json:"memory_kb,omitempty"`
	Score        int       `json:"score"`
	ErrorMessage *string   `json:"error_message,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type SubmissionModel struct {
	DB *pgxpool.Pool
}

// Insert creates a new submission in pending state.
func (m SubmissionModel) Insert(sub *Submission) error {
	query := `
		INSERT INTO submissions (user_id, problem_id, contest_id, language, source_code)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, status, passed, total, score, created_at`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	return m.DB.QueryRow(ctx, query,
		sub.UserID, sub.ProblemID, sub.ContestID, sub.Language, sub.SourceCode,
	).Scan(&sub.ID, &sub.Status, &sub.Passed, &sub.Total, &sub.Score, &sub.CreatedAt)
}

// UpdateResult updates a submission after evaluation is complete.
func (m SubmissionModel) UpdateResult(id, status string, passed, total int, timeMs, memoryKb float64, score int, errorMessage *string) error {
	query := `
		UPDATE submissions
		SET status = $2, passed = $3, total = $4, time_ms = $5, memory_kb = $6, score = $7, error_message = $8
		WHERE id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	_, err := m.DB.Exec(ctx, query, id, status, passed, total, timeMs, memoryKb, score, errorMessage)
	return err
}

// GetByID returns a submission by ID.
func (m SubmissionModel) GetByID(id string) (*Submission, error) {
	query := `
		SELECT id, user_id, problem_id, contest_id, language, source_code,
		       status, passed, total, time_ms, memory_kb, score, error_message, created_at
		FROM submissions WHERE id = $1`

	var s Submission
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.UserID, &s.ProblemID, &s.ContestID, &s.Language, &s.SourceCode,
		&s.Status, &s.Passed, &s.Total, &s.TimeMs, &s.MemoryKb, &s.Score, &s.ErrorMessage, &s.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	return &s, nil
}

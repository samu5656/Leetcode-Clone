package data

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Contest struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type ContestProblem struct {
	ProblemID string `json:"problem_id"`
	Points    int    `json:"points"`
	// Embedded problem detail (populated on read).
	Title      string `json:"title,omitempty"`
	Slug       string `json:"slug,omitempty"`
	Difficulty string `json:"difficulty,omitempty"`
}

type ContestParticipant struct {
	UserID      string    `json:"user_id"`
	Username    string    `json:"username"`
	DisplayName string    `json:"display_name"`
	Score       int       `json:"score"`
	JoinedAt    time.Time `json:"joined_at"`
}

type CreateContestInput struct {
	Title    string               `json:"title"`
	StartTime time.Time           `json:"start_time"`
	EndTime   time.Time           `json:"end_time"`
	Problems  []ContestProblemInput `json:"problems"`
}

type ContestProblemInput struct {
	ProblemID string `json:"problem_id"`
	Points    int    `json:"points"`
}

type ContestModel struct {
	DB *pgxpool.Pool
}

// Insert creates a contest with its problems in a transaction.
func (m ContestModel) Insert(input *CreateContestInput) (*Contest, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tx, err := m.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var contest Contest
	query := `
		INSERT INTO contests (title, start_time, end_time)
		VALUES ($1, $2, $3)
		RETURNING id, title, start_time, end_time, status, created_at`

	err = tx.QueryRow(ctx, query, input.Title, input.StartTime, input.EndTime).Scan(
		&contest.ID, &contest.Title, &contest.StartTime, &contest.EndTime,
		&contest.Status, &contest.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	for _, p := range input.Problems {
		_, err = tx.Exec(ctx,
			`INSERT INTO contest_problems (contest_id, problem_id, points) VALUES ($1, $2, $3)`,
			contest.ID, p.ProblemID, p.Points,
		)
		if err != nil {
			return nil, err
		}
	}

	return &contest, tx.Commit(ctx)
}

// GetByID returns a contest by ID.
func (m ContestModel) GetByID(id string) (*Contest, error) {
	query := `SELECT id, title, start_time, end_time, status, created_at FROM contests WHERE id = $1`

	var c Contest
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.Title, &c.StartTime, &c.EndTime, &c.Status, &c.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	return &c, nil
}

// List returns contests optionally filtered by status.
func (m ContestModel) List(status string, filters Filters) ([]*Contest, Metadata, error) {
	query := `
		SELECT count(*) OVER(), id, title, start_time, end_time, status, created_at
		FROM contests
		WHERE ($1 = '' OR status = $1)
		ORDER BY start_time DESC
		LIMIT $2 OFFSET $3`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	rows, err := m.DB.Query(ctx, query, status, filters.Limit(), filters.Offset())
	if err != nil {
		return nil, Metadata{}, err
	}
	defer rows.Close()

	totalRecords := 0
	contests := []*Contest{}

	for rows.Next() {
		var c Contest
		err := rows.Scan(&totalRecords, &c.ID, &c.Title, &c.StartTime, &c.EndTime, &c.Status, &c.CreatedAt)
		if err != nil {
			return nil, Metadata{}, err
		}
		contests = append(contests, &c)
	}

	return contests, CalculateMetadata(filters.Page, filters.PageSize, totalRecords), nil
}

// GetProblems returns the problems for a contest with details.
func (m ContestModel) GetProblems(contestID string) ([]ContestProblem, error) {
	query := `
		SELECT cp.problem_id, cp.points, p.title, p.slug, p.difficulty
		FROM contest_problems cp
		JOIN problems p ON p.id = cp.problem_id
		WHERE cp.contest_id = $1
		ORDER BY cp.points`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	rows, err := m.DB.Query(ctx, query, contestID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var problems []ContestProblem
	for rows.Next() {
		var cp ContestProblem
		err := rows.Scan(&cp.ProblemID, &cp.Points, &cp.Title, &cp.Slug, &cp.Difficulty)
		if err != nil {
			return nil, err
		}
		problems = append(problems, cp)
	}

	return problems, nil
}

// Join adds a user as a participant in a contest.
func (m ContestModel) Join(contestID, userID string) error {
	query := `INSERT INTO contest_participants (contest_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	_, err := m.DB.Exec(ctx, query, contestID, userID)
	return err
}

// IsParticipant checks if a user has joined a contest.
func (m ContestModel) IsParticipant(contestID, userID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM contest_participants WHERE contest_id = $1 AND user_id = $2)`

	var exists bool
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, contestID, userID).Scan(&exists)
	return exists, err
}

// GetPointsForProblem returns the points assigned to a problem in a contest.
func (m ContestModel) GetPointsForProblem(contestID, problemID string) (int, error) {
	query := `SELECT points FROM contest_problems WHERE contest_id = $1 AND problem_id = $2`

	var points int
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, contestID, problemID).Scan(&points)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrRecordNotFound
		}
		return 0, err
	}
	return points, nil
}

// RecomputeParticipantScore recalculates a participant's score from submissions.
func (m ContestModel) RecomputeParticipantScore(contestID, userID string) error {
	query := `
		UPDATE contest_participants SET score = (
			SELECT COALESCE(SUM(best), 0) FROM (
				SELECT DISTINCT ON (problem_id) score AS best
				FROM submissions
				WHERE user_id = $1 AND contest_id = $2 AND status = 'accepted'
				ORDER BY problem_id, score DESC
			) s
		) WHERE user_id = $1 AND contest_id = $2`

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := m.DB.Exec(ctx, query, userID, contestID)
	return err
}

// TransitionStatuses moves contests from upcoming→active and active→ended.
func (m ContestModel) TransitionStatuses() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := m.DB.Exec(ctx, `UPDATE contests SET status = 'active' WHERE status = 'upcoming' AND start_time <= NOW()`)
	if err != nil {
		return err
	}

	_, err = m.DB.Exec(ctx, `UPDATE contests SET status = 'ended' WHERE status = 'active' AND end_time <= NOW()`)
	return err
}

// GetParticipantIDs returns all user IDs for a contest.
func (m ContestModel) GetParticipantIDs(contestID string) ([]string, error) {
	query := `SELECT user_id FROM contest_participants WHERE contest_id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	rows, err := m.DB.Query(ctx, query, contestID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

package data

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrDuplicateEmail    = errors.New("duplicate email")
	ErrDuplicateUsername = errors.New("duplicate username")
	ErrRecordNotFound    = errors.New("record not found")
)

type User struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	Username        string     `json:"username"`
	PasswordHash    string     `json:"-"`
	DisplayName     string     `json:"display_name"`
	TotalScore      int        `json:"total_score"`
	ProblemsSolved  int        `json:"problems_solved"`
	CurrentStreak   int        `json:"current_streak"`
	MaxStreak       int        `json:"max_streak"`
	LastContestDate *time.Time `json:"last_contest_date"`
	Role            string     `json:"role"`
	CreatedAt       time.Time  `json:"created_at"`
}

type UserModel struct {
	DB *pgxpool.Pool
}

// Insert creates a new user with a hashed password.
func (m UserModel) Insert(user *User, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO users (email, username, password_hash, display_name, role)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err = m.DB.QueryRow(ctx, query,
		user.Email, user.Username, string(hash), user.DisplayName, user.Role,
	).Scan(&user.ID, &user.CreatedAt)

	if err != nil {
		switch {
		case err.Error() == `ERROR: duplicate key value violates unique constraint "users_email_key" (SQLSTATE 23505)`:
			return ErrDuplicateEmail
		case err.Error() == `ERROR: duplicate key value violates unique constraint "users_username_key" (SQLSTATE 23505)`:
			return ErrDuplicateUsername
		default:
			return err
		}
	}

	return nil
}

// GetByEmail returns a user by email.
func (m UserModel) GetByEmail(email string) (*User, error) {
	query := `
		SELECT id, email, username, password_hash, display_name,
		       total_score, problems_solved, current_streak, max_streak,
		       last_contest_date, role, created_at
		FROM users WHERE email = $1`

	var user User
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.DisplayName,
		&user.TotalScore, &user.ProblemsSolved, &user.CurrentStreak, &user.MaxStreak,
		&user.LastContestDate, &user.Role, &user.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	return &user, nil
}

// GetByID returns a user by ID.
func (m UserModel) GetByID(id string) (*User, error) {
	query := `
		SELECT id, email, username, password_hash, display_name,
		       total_score, problems_solved, current_streak, max_streak,
		       last_contest_date, role, created_at
		FROM users WHERE id = $1`

	var user User
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.DB.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.DisplayName,
		&user.TotalScore, &user.ProblemsSolved, &user.CurrentStreak, &user.MaxStreak,
		&user.LastContestDate, &user.Role, &user.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	return &user, nil
}

// Update updates a user's display name.
func (m UserModel) Update(id, displayName string) error {
	query := `UPDATE users SET display_name = $1 WHERE id = $2`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	_, err := m.DB.Exec(ctx, query, displayName, id)
	return err
}

// MatchPassword checks a plaintext password against the hash.
func MatchPassword(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// RecomputeStats recalculates total_score and problems_solved from the submissions table.
func (m UserModel) RecomputeStats(userID string) error {
	query := `
		UPDATE users SET
			total_score     = COALESCE(s.total, 0),
			problems_solved = COALESCE(s.solved, 0)
		FROM (
			SELECT COUNT(*) AS solved, SUM(best) AS total FROM (
				SELECT DISTINCT ON (problem_id) score AS best
				FROM submissions WHERE user_id = $1 AND status = 'accepted'
				ORDER BY problem_id, score DESC
			) p
		) s
		WHERE id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := m.DB.Exec(ctx, query, userID)
	return err
}

// UpdateStreak updates the contest attendance streak for a user.
func (m UserModel) UpdateStreak(userID string, contestDate time.Time) error {
	query := `
		UPDATE users SET
			current_streak = CASE
				WHEN last_contest_date = $2::date - INTERVAL '1 day' THEN current_streak + 1
				WHEN last_contest_date = $2::date THEN current_streak
				ELSE 1
			END,
			max_streak = GREATEST(max_streak, CASE
				WHEN last_contest_date = $2::date - INTERVAL '1 day' THEN current_streak + 1
				WHEN last_contest_date = $2::date THEN current_streak
				ELSE 1
			END),
			last_contest_date = $2::date
		WHERE id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	_, err := m.DB.Exec(ctx, query, userID, contestDate)
	return err
}

// ResetBrokenStreaks sets streak to 0 for users who didn't attend yesterday.
func (m UserModel) ResetBrokenStreaks() error {
	query := `
		UPDATE users SET current_streak = 0
		WHERE last_contest_date < CURRENT_DATE - INTERVAL '1 day'
		  AND current_streak > 0`

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := m.DB.Exec(ctx, query)
	return err
}

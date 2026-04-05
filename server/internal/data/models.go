package data

import "github.com/jackc/pgx/v5/pgxpool"

// Models wraps all database models for dependency injection.
type Models struct {
	Users        UserModel
	Problems     ProblemModel
	Contests     ContestModel
	Submissions  SubmissionModel
	Leaderboard  LeaderboardModel
}

// NewModels returns a Models instance backed by the given connection pool.
func NewModels(db *pgxpool.Pool) Models {
	return Models{
		Users:       UserModel{DB: db},
		Problems:    ProblemModel{DB: db},
		Contests:    ContestModel{DB: db},
		Submissions: SubmissionModel{DB: db},
		Leaderboard: LeaderboardModel{DB: db},
	}
}

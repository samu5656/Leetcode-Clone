package data

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type LeaderboardEntry struct {
	Rank        int    `json:"rank"`
	UserID      string `json:"user_id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Score       int    `json:"score"`
}

type LeaderboardModel struct {
	DB *pgxpool.Pool
}

func (m LeaderboardModel) scanLeaderboardRows(ctx context.Context, query string, args ...any) ([]LeaderboardEntry, int, error) {
	rows, err := m.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	totalRecords := 0
	var entries []LeaderboardEntry

	for rows.Next() {
		var e LeaderboardEntry
		err := rows.Scan(&totalRecords, &e.Rank, &e.UserID, &e.Username, &e.DisplayName, &e.Score)
		if err != nil {
			return nil, 0, err
		}
		entries = append(entries, e)
	}

	return entries, totalRecords, nil
}

// Global returns the overall leaderboard sorted by total_score.
func (m LeaderboardModel) Global(filters Filters) ([]LeaderboardEntry, Metadata, error) {
	query := `
		SELECT count(*) OVER(),
		       ROW_NUMBER() OVER (ORDER BY total_score DESC) AS rank,
		       id, username, display_name, total_score
		FROM users
		WHERE role = 'user'
		ORDER BY total_score DESC
		LIMIT $1 OFFSET $2`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	entries, totalRecords, err := m.scanLeaderboardRows(ctx, query, filters.Limit(), filters.Offset())
	if err != nil {
		return nil, Metadata{}, err
	}

	return entries, CalculateMetadata(filters.Page, filters.PageSize, totalRecords), nil
}

// Contest returns the leaderboard for a specific contest.
func (m LeaderboardModel) Contest(contestID string, filters Filters) ([]LeaderboardEntry, Metadata, error) {
	query := `
		SELECT count(*) OVER(),
		       ROW_NUMBER() OVER (ORDER BY cp.score DESC) AS rank,
		       u.id, u.username, u.display_name, cp.score
		FROM contest_participants cp
		JOIN users u ON u.id = cp.user_id
		WHERE cp.contest_id = $1
		ORDER BY cp.score DESC
		LIMIT $2 OFFSET $3`

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	entries, totalRecords, err := m.scanLeaderboardRows(ctx, query, contestID, filters.Limit(), filters.Offset())
	if err != nil {
		return nil, Metadata{}, err
	}

	return entries, CalculateMetadata(filters.Page, filters.PageSize, totalRecords), nil
}

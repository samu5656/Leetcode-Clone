package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/vj/dsa-contest-backend/internal/data"
	"github.com/vj/dsa-contest-backend/internal/executor"
)

type config struct {
	port int
	env  string
	db   struct {
		dsn          string
		maxOpenConns int
	}
	jwt struct {
		accessSecret  string
		refreshSecret string
		accessExpiry  time.Duration
		refreshExpiry time.Duration
	}
	pistonURL string
}

type application struct {
	config   config
	logger   *slog.Logger
	models   data.Models
	executor *executor.Executor
	wg       sync.WaitGroup
}

func main() {
	var cfg config

	flag.IntVar(&cfg.port, "port", 4000, "API server port")
	flag.StringVar(&cfg.env, "env", "development", "Environment (development|staging|production)")
	flag.StringVar(&cfg.db.dsn, "db-dsn", "", "PostgreSQL DSN")
	flag.IntVar(&cfg.db.maxOpenConns, "db-max-open-conns", 25, "PostgreSQL max open connections")
	flag.StringVar(&cfg.jwt.accessSecret, "jwt-access-secret", "", "JWT access token secret")
	flag.StringVar(&cfg.jwt.refreshSecret, "jwt-refresh-secret", "", "JWT refresh token secret")
	flag.StringVar(&cfg.pistonURL, "piston-url", "http://localhost:2000/api/v2/", "Piston API base URL")
	flag.Parse()

	cfg.jwt.accessExpiry = 15 * time.Minute
	cfg.jwt.refreshExpiry = 7 * 24 * time.Hour

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	// Connect to database.
	dbpool, err := openDB(cfg)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer dbpool.Close()
	logger.Info("database connection pool established")

	// Connect to Piston.
	exec, err := executor.New(cfg.pistonURL)
	if err != nil {
		logger.Warn("failed to connect to Piston (code execution disabled)", "error", err)
		exec = nil
	} else {
		logger.Info("piston connection established")
	}

	app := &application{
		config:   cfg,
		logger:   logger,
		models:   data.NewModels(dbpool),
		executor: exec,
	}

	// Start contest status transition cron.
	app.startCronJobs()

	err = app.serve()
	if err != nil {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}
}

func openDB(cfg config) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.db.dsn)
	if err != nil {
		return nil, err
	}

	poolConfig.MaxConns = int32(cfg.db.maxOpenConns)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, err
	}

	err = pool.Ping(ctx)
	if err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}

// startCronJobs runs background tickers for contest transitions and streak resets.
func (app *application) startCronJobs() {
	// Contest status transitions every 30 seconds.
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			err := app.models.Contests.TransitionStatuses()
			if err != nil {
				app.logger.Error("contest transition error", "error", err)
			}
		}
	}()

	// Streak reset daily at startup check (runs every hour).
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			err := app.models.Users.ResetBrokenStreaks()
			if err != nil {
				app.logger.Error("streak reset error", "error", err)
			}
		}
	}()
}

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/vj/dsa-contest-backend/internal/data"
	"github.com/vj/dsa-contest-backend/internal/executor"
)

// testApplication creates an application instance backed by a real PostgreSQL database.
// Set DSA_TEST_DB_DSN env var to run these tests. Example:
//
//	DSA_TEST_DB_DSN="postgres://postgres:postgres@localhost:5432/dsa_contest_test?sslmode=disable"
func testApplication(t *testing.T) (*application, func()) {
	t.Helper()

	dsn := os.Getenv("DSA_TEST_DB_DSN")
	if dsn == "" {
		t.Skip("DSA_TEST_DB_DSN not set; skipping integration tests")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("failed to connect to test db: %v", err)
	}

	// Clean and recreate tables.
	setupTestDB(t, pool)

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))

	// Try to connect to Piston (optional).
	pistonURL := os.Getenv("DSA_TEST_PISTON_URL")
	if pistonURL == "" {
		pistonURL = "http://localhost:2000/api/v2/"
	}

	var exec *executor.Executor
	exec, err = executor.New(pistonURL)
	if err != nil {
		t.Logf("Piston not available, submission tests will be skipped: %v", err)
		exec = nil
	}

	app := &application{
		config: config{
			port: 0,
			env:  "testing",
			pistonURL: pistonURL,
		},
		logger:   logger,
		models:   data.NewModels(pool),
		executor: exec,
	}

	app.config.jwt.accessSecret = "test-access-secret"
	app.config.jwt.refreshSecret = "test-refresh-secret"
	app.config.jwt.accessExpiry = 15 * time.Minute
	app.config.jwt.refreshExpiry = 24 * time.Hour

	cleanup := func() {
		teardownTestDB(t, pool)
		pool.Close()
	}

	return app, cleanup
}

func setupTestDB(t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	ctx := context.Background()

	// Drop all tables in reverse dependency order.
	tables := []string{"submissions", "contest_participants", "contest_problems", "contests", "boilerplates", "test_cases", "problems", "users"}
	for _, table := range tables {
		pool.Exec(ctx, fmt.Sprintf("DROP TABLE IF EXISTS %s CASCADE", table))
	}

	// Create tables.
	migrations := []string{
		`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
		`CREATE TABLE users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE,
			username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, display_name TEXT NOT NULL,
			total_score INT NOT NULL DEFAULT 0, problems_solved INT NOT NULL DEFAULT 0,
			current_streak INT NOT NULL DEFAULT 0, max_streak INT NOT NULL DEFAULT 0,
			last_contest_date DATE, role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
		`CREATE TABLE problems (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
			description TEXT NOT NULL, difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
			problem_type TEXT NOT NULL DEFAULT 'full_code' CHECK (problem_type IN ('full_code', 'function_only')),
			function_signature TEXT, time_limit_ms INT NOT NULL DEFAULT 2000,
			memory_limit_kb INT NOT NULL DEFAULT 256000, is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
		`CREATE TABLE test_cases (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
			input TEXT NOT NULL, expected_output TEXT NOT NULL, is_sample BOOLEAN NOT NULL DEFAULT false)`,
		`CREATE TABLE boilerplates (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
			language TEXT NOT NULL, code TEXT NOT NULL, UNIQUE(problem_id, language))`,
		`CREATE TABLE contests (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL,
			start_time TIMESTAMPTZ NOT NULL, end_time TIMESTAMPTZ NOT NULL,
			status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CHECK (end_time > start_time))`,
		`CREATE TABLE contest_problems (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
			problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
			points INT NOT NULL, UNIQUE(contest_id, problem_id))`,
		`CREATE TABLE contest_participants (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			score INT NOT NULL DEFAULT 0, joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(contest_id, user_id))`,
		`CREATE TABLE submissions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
			contest_id UUID REFERENCES contests(id) ON DELETE SET NULL,
			language TEXT NOT NULL, source_code TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','wrong_answer','tle','runtime_error','compilation_error')),
			passed INT NOT NULL DEFAULT 0, total INT NOT NULL DEFAULT 0,
			time_ms REAL, memory_kb REAL, score INT NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
	}

	for _, m := range migrations {
		_, err := pool.Exec(ctx, m)
		if err != nil {
			t.Fatalf("migration failed: %v\nSQL: %s", err, m)
		}
	}
}

func teardownTestDB(t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	ctx := context.Background()
	tables := []string{"submissions", "contest_participants", "contest_problems", "contests", "boilerplates", "test_cases", "problems", "users"}
	for _, table := range tables {
		pool.Exec(ctx, fmt.Sprintf("DROP TABLE IF EXISTS %s CASCADE", table))
	}
}

// --- Helpers ---

func makeRequest(app *application, method, url string, body any, token string) *httptest.ResponseRecorder {
	var reqBody io.Reader
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		reqBody = bytes.NewReader(jsonBody)
	}

	req := httptest.NewRequest(method, url, reqBody)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	rr := httptest.NewRecorder()
	app.routes().ServeHTTP(rr, req)
	return rr
}

func parseResponse(t *testing.T, rr *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var result map[string]any
	err := json.Unmarshal(rr.Body.Bytes(), &result)
	if err != nil {
		t.Fatalf("failed to parse response: %v\nbody: %s", err, rr.Body.String())
	}
	return result
}

// --- Tests ---

func TestHealthcheck(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	rr := makeRequest(app, "GET", "/v1/healthcheck", nil, "")

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}

	result := parseResponse(t, rr)
	if result["status"] != "available" {
		t.Errorf("expected status=available, got %v", result["status"])
	}
}

func TestAuthFlow(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	// --- Register ---
	t.Run("Register", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/auth/register", map[string]string{
			"email": "test@test.com", "username": "testuser",
			"password": "Test@1234", "display_name": "Test User",
		}, "")

		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
		}

		result := parseResponse(t, rr)
		if result["access_token"] == nil || result["refresh_token"] == nil {
			t.Fatal("expected tokens in response")
		}
	})

	// --- Register duplicate email ---
	t.Run("RegisterDuplicateEmail", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/auth/register", map[string]string{
			"email": "test@test.com", "username": "testuser2",
			"password": "Test@1234", "display_name": "Test User 2",
		}, "")

		if rr.Code != http.StatusUnprocessableEntity {
			t.Errorf("expected 422, got %d", rr.Code)
		}
	})

	// --- Register validation ---
	t.Run("RegisterValidation", func(t *testing.T) {
		cases := []struct {
			name string
			body map[string]string
		}{
			{"no email", map[string]string{"username": "u", "password": "Test@1234", "display_name": "d"}},
			{"short password", map[string]string{"email": "a@b.com", "username": "u2", "password": "short", "display_name": "d"}},
			{"no uppercase", map[string]string{"email": "c@d.com", "username": "u3", "password": "alllower1", "display_name": "d"}},
			{"no digit", map[string]string{"email": "e@f.com", "username": "u4", "password": "NoDigitHere", "display_name": "d"}},
		}

		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				rr := makeRequest(app, "POST", "/v1/auth/register", tc.body, "")
				if rr.Code != http.StatusUnprocessableEntity {
					t.Errorf("expected 422, got %d: %s", rr.Code, rr.Body.String())
				}
			})
		}
	})

	// --- Login ---
	t.Run("Login", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/auth/login", map[string]string{
			"email": "test@test.com", "password": "Test@1234",
		}, "")

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}

		result := parseResponse(t, rr)
		if result["access_token"] == nil {
			t.Fatal("expected access_token in response")
		}
	})

	// --- Login wrong password ---
	t.Run("LoginWrongPassword", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/auth/login", map[string]string{
			"email": "test@test.com", "password": "WrongPass1",
		}, "")

		if rr.Code != http.StatusUnauthorized {
			t.Errorf("expected 401, got %d", rr.Code)
		}
	})

	// --- Refresh token ---
	t.Run("RefreshToken", func(t *testing.T) {
		// First login to get tokens.
		loginRR := makeRequest(app, "POST", "/v1/auth/login", map[string]string{
			"email": "test@test.com", "password": "Test@1234",
		}, "")
		loginResult := parseResponse(t, loginRR)
		refreshToken := loginResult["refresh_token"].(string)

		rr := makeRequest(app, "POST", "/v1/auth/refresh", map[string]string{
			"refresh_token": refreshToken,
		}, "")

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}

		result := parseResponse(t, rr)
		if result["access_token"] == nil {
			t.Fatal("expected new access_token")
		}
	})
}

func TestUserFlow(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	// Register and get token.
	rr := makeRequest(app, "POST", "/v1/auth/register", map[string]string{
		"email": "user@test.com", "username": "userflow",
		"password": "Test@1234", "display_name": "User Flow",
	}, "")
	result := parseResponse(t, rr)
	token := result["access_token"].(string)
	userMap := result["user"].(map[string]any)
	userID := userMap["id"].(string)

	// --- Get current user ---
	t.Run("GetMe", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/users/me", nil, token)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		result := parseResponse(t, rr)
		user := result["user"].(map[string]any)
		if user["username"] != "userflow" {
			t.Errorf("expected username=userflow, got %v", user["username"])
		}
	})

	// --- Update display name ---
	t.Run("UpdateMe", func(t *testing.T) {
		rr := makeRequest(app, "PUT", "/v1/users/me", map[string]string{"display_name": "Updated Name"}, token)
		if rr.Code != http.StatusOK {
			t.Errorf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	// --- Get public profile ---
	t.Run("GetPublicProfile", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/users/"+userID, nil, "")
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		result := parseResponse(t, rr)
		user := result["user"].(map[string]any)
		// Email should NOT be in public profile.
		if user["email"] != nil {
			t.Error("email should not be in public profile")
		}
	})

	// --- Unauthenticated access ---
	t.Run("UnauthenticatedGetMe", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/users/me", nil, "")
		if rr.Code != http.StatusUnauthorized {
			t.Errorf("expected 401, got %d", rr.Code)
		}
	})
}

func TestProblemFlow(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	// Register admin (seed directly).
	adminUser := &data.User{Email: "admin@test.com", Username: "admin", DisplayName: "Admin", Role: "admin"}
	app.models.Users.Insert(adminUser, "Admin@1234")

	// Login admin.
	loginRR := makeRequest(app, "POST", "/v1/auth/login", map[string]string{
		"email": "admin@test.com", "password": "Admin@1234",
	}, "")
	adminToken := parseResponse(t, loginRR)["access_token"].(string)

	// Register regular user.
	regRR := makeRequest(app, "POST", "/v1/auth/register", map[string]string{
		"email": "user@test.com", "username": "user1", "password": "User@1234", "display_name": "User",
	}, "")
	userToken := parseResponse(t, regRR)["access_token"].(string)

	// --- Create problem (admin) ---
	t.Run("CreateProblem", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/admin/problems", map[string]any{
			"title": "Hello World", "slug": "hello-world",
			"description": "Print Hello World", "difficulty": "easy",
			"problem_type": "full_code", "time_limit_ms": 2000, "memory_limit_kb": 256000,
			"test_cases": []map[string]any{
				{"input": "", "expected_output": "Hello World", "is_sample": true},
				{"input": "", "expected_output": "Hello World", "is_sample": false},
			},
		}, adminToken)

		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	// --- Non-admin cannot create ---
	t.Run("NonAdminCannotCreate", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/admin/problems", map[string]any{
			"title": "Test", "slug": "test", "description": "...", "difficulty": "easy",
			"problem_type": "full_code", "time_limit_ms": 2000, "memory_limit_kb": 256000,
			"test_cases": []map[string]any{{"input": "", "expected_output": "x", "is_sample": true}},
		}, userToken)

		if rr.Code != http.StatusForbidden {
			t.Errorf("expected 403, got %d", rr.Code)
		}
	})

	// --- List problems ---
	t.Run("ListProblems", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/problems", nil, userToken)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		result := parseResponse(t, rr)
		problems := result["problems"].([]any)
		if len(problems) != 1 {
			t.Errorf("expected 1 problem, got %d", len(problems))
		}
	})

	// --- Get problem by slug ---
	t.Run("GetProblemBySlug", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/problems/hello-world", nil, userToken)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		result := parseResponse(t, rr)
		problem := result["problem"].(map[string]any)
		if problem["slug"] != "hello-world" {
			t.Errorf("expected slug=hello-world, got %v", problem["slug"])
		}
		samples := result["sample_test_cases"].([]any)
		if len(samples) != 1 {
			t.Errorf("expected 1 sample test case, got %d", len(samples))
		}
	})

	// --- Filter by difficulty ---
	t.Run("FilterByDifficulty", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/problems?difficulty=hard", nil, userToken)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		result := parseResponse(t, rr)
		problems := result["problems"].([]any)
		if len(problems) != 0 {
			t.Errorf("expected 0 hard problems, got %d", len(problems))
		}
	})

	// --- Soft delete ---
	t.Run("SoftDeleteProblem", func(t *testing.T) {
		// Get problem ID from list.
		listRR := makeRequest(app, "GET", "/v1/problems", nil, userToken)
		listResult := parseResponse(t, listRR)
		problems := listResult["problems"].([]any)
		problemID := problems[0].(map[string]any)["id"].(string)

		// Delete.
		rr := makeRequest(app, "DELETE", "/v1/admin/problems/"+problemID, nil, adminToken)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}

		// Should not appear in list.
		listRR = makeRequest(app, "GET", "/v1/problems", nil, userToken)
		listResult = parseResponse(t, listRR)
		problems = listResult["problems"].([]any)
		if len(problems) != 0 {
			t.Errorf("expected 0 problems after delete, got %d", len(problems))
		}
	})
}

func TestContestFlow(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	// Create admin.
	admin := &data.User{Email: "admin@test.com", Username: "admin", DisplayName: "Admin", Role: "admin"}
	app.models.Users.Insert(admin, "Admin@1234")
	loginRR := makeRequest(app, "POST", "/v1/auth/login", map[string]string{
		"email": "admin@test.com", "password": "Admin@1234",
	}, "")
	adminToken := parseResponse(t, loginRR)["access_token"].(string)

	// Create user.
	regRR := makeRequest(app, "POST", "/v1/auth/register", map[string]string{
		"email": "user@test.com", "username": "user1", "password": "User@1234", "display_name": "User",
	}, "")
	userToken := parseResponse(t, regRR)["access_token"].(string)

	// Create a problem first.
	problemRR := makeRequest(app, "POST", "/v1/admin/problems", map[string]any{
		"title": "Test Problem", "slug": "test-problem",
		"description": "Test", "difficulty": "easy",
		"problem_type": "full_code", "time_limit_ms": 2000, "memory_limit_kb": 256000,
		"test_cases": []map[string]any{{"input": "hello", "expected_output": "hello", "is_sample": true}},
	}, adminToken)
	problemResult := parseResponse(t, problemRR)
	problemID := problemResult["problem"].(map[string]any)["id"].(string)

	var contestID string

	// --- Create contest ---
	t.Run("CreateContest", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/admin/contests", map[string]any{
			"title":      "Daily Contest #1",
			"start_time": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
			"end_time":   time.Now().Add(1 * time.Hour).Format(time.RFC3339),
			"problems":   []map[string]any{{"problem_id": problemID, "points": 100}},
		}, adminToken)

		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
		}

		result := parseResponse(t, rr)
		contestID = result["contest"].(map[string]any)["id"].(string)
	})

	// Trigger status transition (upcoming → active since start_time is in the past).
	app.models.Contests.TransitionStatuses()

	// --- List contests ---
	t.Run("ListContests", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/contests", nil, userToken)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	// --- Get contest details (should show problems since active) ---
	t.Run("GetActiveContest", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/contests/"+contestID, nil, userToken)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		result := parseResponse(t, rr)
		if result["problems"] == nil {
			t.Error("expected problems to be shown for active contest")
		}
	})

	// --- Join contest ---
	t.Run("JoinContest", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/contests/"+contestID+"/join", nil, userToken)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	// --- Contest leaderboard ---
	t.Run("ContestLeaderboard", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/contests/"+contestID+"/leaderboard", nil, userToken)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
	})
}

func TestSubmissionFlow(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	if app.executor == nil {
		t.Skip("Piston not available; skipping submission tests")
	}

	// Create admin.
	admin := &data.User{Email: "admin@test.com", Username: "admin", DisplayName: "Admin", Role: "admin"}
	app.models.Users.Insert(admin, "Admin@1234")
	loginRR := makeRequest(app, "POST", "/v1/auth/login", map[string]string{
		"email": "admin@test.com", "password": "Admin@1234",
	}, "")
	adminToken := parseResponse(t, loginRR)["access_token"].(string)

	// Create user.
	regRR := makeRequest(app, "POST", "/v1/auth/register", map[string]string{
		"email": "coder@test.com", "username": "coder", "password": "Coder@1234", "display_name": "Coder",
	}, "")
	regResult := parseResponse(t, regRR)
	userToken := regResult["access_token"].(string)
	userID := regResult["user"].(map[string]any)["id"].(string)

	// Create problem with test cases.
	problemRR := makeRequest(app, "POST", "/v1/admin/problems", map[string]any{
		"title": "Echo Input", "slug": "echo-input",
		"description": "Print whatever you receive as input.", "difficulty": "easy",
		"problem_type": "full_code", "time_limit_ms": 5000, "memory_limit_kb": 256000,
		"test_cases": []map[string]any{
			{"input": "hello", "expected_output": "hello", "is_sample": true},
			{"input": "world", "expected_output": "world", "is_sample": false},
			{"input": "test123", "expected_output": "test123", "is_sample": false},
		},
	}, adminToken)
	problemID := parseResponse(t, problemRR)["problem"].(map[string]any)["id"].(string)

	// --- Submit correct Python solution ---
	t.Run("CorrectSubmission", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/submissions", map[string]any{
			"problem_id":  problemID,
			"language":    "python",
			"source_code": "print(input())",
		}, userToken)

		if rr.Code != http.StatusAccepted {
			t.Fatalf("expected 202, got %d: %s", rr.Code, rr.Body.String())
		}

		result := parseResponse(t, rr)
		subID := result["submission"].(map[string]any)["id"].(string)

		// Wait for background evaluation.
		time.Sleep(10 * time.Second)
		app.wg.Wait()

		// Check result.
		getRR := makeRequest(app, "GET", "/v1/submissions/"+subID, nil, userToken)
		if getRR.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", getRR.Code, getRR.Body.String())
		}

		subResult := parseResponse(t, getRR)
		sub := subResult["submission"].(map[string]any)

		if sub["status"] != "accepted" {
			t.Errorf("expected accepted, got %v", sub["status"])
		}
		if int(sub["passed"].(float64)) != 3 {
			t.Errorf("expected 3 passed, got %v", sub["passed"])
		}
		if int(sub["total"].(float64)) != 3 {
			t.Errorf("expected 3 total, got %v", sub["total"])
		}
		if int(sub["score"].(float64)) != 100 {
			t.Errorf("expected score 100, got %v", sub["score"])
		}
	})

	// --- Submit wrong answer ---
	t.Run("WrongAnswer", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/submissions", map[string]any{
			"problem_id":  problemID,
			"language":    "python",
			"source_code": `print("wrong output")`,
		}, userToken)

		subID := parseResponse(t, rr)["submission"].(map[string]any)["id"].(string)
		time.Sleep(10 * time.Second)
		app.wg.Wait()

		getRR := makeRequest(app, "GET", "/v1/submissions/"+subID, nil, userToken)
		sub := parseResponse(t, getRR)["submission"].(map[string]any)

		if sub["status"] != "wrong_answer" {
			t.Errorf("expected wrong_answer, got %v", sub["status"])
		}
	})

	// --- Submit compilation error ---
	t.Run("CompilationError", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/submissions", map[string]any{
			"problem_id":  problemID,
			"language":    "c++",
			"source_code": `this is not valid c++ code!!!`,
		}, userToken)

		subID := parseResponse(t, rr)["submission"].(map[string]any)["id"].(string)
		time.Sleep(10 * time.Second)
		app.wg.Wait()

		getRR := makeRequest(app, "GET", "/v1/submissions/"+subID, nil, userToken)
		sub := parseResponse(t, getRR)["submission"].(map[string]any)

		if sub["status"] != "compilation_error" {
			t.Errorf("expected compilation_error, got %v", sub["status"])
		}
	})

	// --- Validation: unsupported language ---
	t.Run("UnsupportedLanguage", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/submissions", map[string]any{
			"problem_id":  problemID,
			"language":    "brainfuck",
			"source_code": "hello",
		}, userToken)

		if rr.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", rr.Code)
		}
	})

	// --- Validation: source code too large ---
	t.Run("SourceCodeTooLarge", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/submissions", map[string]any{
			"problem_id":  problemID,
			"language":    "python",
			"source_code": strings.Repeat("x", 65*1024),
		}, userToken)

		if rr.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", rr.Code)
		}
	})

	// --- User stats should be updated after correct submission ---
	t.Run("UserStatsUpdated", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/users/"+userID, nil, "")
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}
		user := parseResponse(t, rr)["user"].(map[string]any)

		if int(user["problems_solved"].(float64)) != 1 {
			t.Errorf("expected problems_solved=1, got %v", user["problems_solved"])
		}
		if int(user["total_score"].(float64)) != 100 {
			t.Errorf("expected total_score=100, got %v", user["total_score"])
		}
	})
}

func TestContestSubmissionFlow(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	if app.executor == nil {
		t.Skip("Piston not available; skipping contest submission tests")
	}

	// Setup admin.
	admin := &data.User{Email: "admin@test.com", Username: "admin", DisplayName: "Admin", Role: "admin"}
	app.models.Users.Insert(admin, "Admin@1234")
	loginRR := makeRequest(app, "POST", "/v1/auth/login", map[string]string{
		"email": "admin@test.com", "password": "Admin@1234",
	}, "")
	adminToken := parseResponse(t, loginRR)["access_token"].(string)

	// Setup user.
	regRR := makeRequest(app, "POST", "/v1/auth/register", map[string]string{
		"email": "player@test.com", "username": "player", "password": "Player@1234", "display_name": "Player",
	}, "")
	userToken := parseResponse(t, regRR)["access_token"].(string)

	// Create problem.
	problemRR := makeRequest(app, "POST", "/v1/admin/problems", map[string]any{
		"title": "Add Two Numbers", "slug": "add-two",
		"description": "Read two numbers and print their sum.", "difficulty": "easy",
		"problem_type": "full_code", "time_limit_ms": 5000, "memory_limit_kb": 256000,
		"test_cases": []map[string]any{
			{"input": "1 2", "expected_output": "3", "is_sample": true},
			{"input": "10 20", "expected_output": "30", "is_sample": false},
		},
	}, adminToken)
	problemID := parseResponse(t, problemRR)["problem"].(map[string]any)["id"].(string)

	// Create active contest.
	contestRR := makeRequest(app, "POST", "/v1/admin/contests", map[string]any{
		"title":      "Test Contest",
		"start_time": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		"end_time":   time.Now().Add(1 * time.Hour).Format(time.RFC3339),
		"problems":   []map[string]any{{"problem_id": problemID, "points": 200}},
	}, adminToken)
	contestID := parseResponse(t, contestRR)["contest"].(map[string]any)["id"].(string)

	// Transition to active.
	app.models.Contests.TransitionStatuses()

	// Join contest.
	makeRequest(app, "POST", "/v1/contests/"+contestID+"/join", nil, userToken)

	// Submit correct solution to contest.
	t.Run("ContestSubmit", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/submissions", map[string]any{
			"problem_id":  problemID,
			"contest_id":  contestID,
			"language":    "python",
			"source_code": "a, b = map(int, input().split())\nprint(a + b)",
		}, userToken)

		if rr.Code != http.StatusAccepted {
			t.Fatalf("expected 202, got %d: %s", rr.Code, rr.Body.String())
		}

		subID := parseResponse(t, rr)["submission"].(map[string]any)["id"].(string)
		time.Sleep(10 * time.Second)
		app.wg.Wait()

		// Check submission result.
		getRR := makeRequest(app, "GET", "/v1/submissions/"+subID, nil, userToken)
		sub := parseResponse(t, getRR)["submission"].(map[string]any)

		if sub["status"] != "accepted" {
			t.Errorf("expected accepted, got %v", sub["status"])
		}
		if int(sub["score"].(float64)) != 200 {
			t.Errorf("expected score=200 (contest points), got %v", sub["score"])
		}
	})

	// Check contest leaderboard.
	t.Run("ContestLeaderboardAfterSubmit", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/contests/"+contestID+"/leaderboard", nil, userToken)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		result := parseResponse(t, rr)
		entries := result["leaderboard"].([]any)
		if len(entries) != 1 {
			t.Fatalf("expected 1 entry, got %d", len(entries))
		}
		entry := entries[0].(map[string]any)
		if int(entry["score"].(float64)) != 200 {
			t.Errorf("expected leaderboard score=200, got %v", entry["score"])
		}
		if int(entry["rank"].(float64)) != 1 {
			t.Errorf("expected rank=1, got %v", entry["rank"])
		}
	})

	// Check global leaderboard.
	t.Run("GlobalLeaderboard", func(t *testing.T) {
		rr := makeRequest(app, "GET", "/v1/leaderboard", nil, "")
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	// Non-participant cannot submit to contest.
	t.Run("NonParticipantCannotSubmit", func(t *testing.T) {
		// Register another user.
		reg2 := makeRequest(app, "POST", "/v1/auth/register", map[string]string{
			"email": "other@test.com", "username": "other", "password": "Other@1234", "display_name": "Other",
		}, "")
		otherToken := parseResponse(t, reg2)["access_token"].(string)

		rr := makeRequest(app, "POST", "/v1/submissions", map[string]any{
			"problem_id":  problemID,
			"contest_id":  contestID,
			"language":    "python",
			"source_code": "print(1)",
		}, otherToken)

		if rr.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for non-participant, got %d: %s", rr.Code, rr.Body.String())
		}
	})
}

func TestFunctionOnlyProblem(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	if app.executor == nil {
		t.Skip("Piston not available; skipping function_only tests")
	}

	// Admin setup.
	admin := &data.User{Email: "admin@test.com", Username: "admin", DisplayName: "Admin", Role: "admin"}
	app.models.Users.Insert(admin, "Admin@1234")
	loginRR := makeRequest(app, "POST", "/v1/auth/login", map[string]string{
		"email": "admin@test.com", "password": "Admin@1234",
	}, "")
	adminToken := parseResponse(t, loginRR)["access_token"].(string)

	// User setup.
	regRR := makeRequest(app, "POST", "/v1/auth/register", map[string]string{
		"email": "fn@test.com", "username": "fnuser", "password": "FnUser@1234", "display_name": "FN User",
	}, "")
	userToken := parseResponse(t, regRR)["access_token"].(string)

	sig := "def solution(s: str) -> str"

	// Create function_only problem with Python boilerplate.
	problemRR := makeRequest(app, "POST", "/v1/admin/problems", map[string]any{
		"title": "Reverse String", "slug": "reverse-str",
		"description": "Reverse a string", "difficulty": "easy",
		"problem_type": "function_only", "function_signature": sig,
		"time_limit_ms": 5000, "memory_limit_kb": 256000,
		"test_cases": []map[string]any{
			{"input": "hello", "expected_output": "olleh", "is_sample": true},
			{"input": "abc", "expected_output": "cba", "is_sample": false},
		},
		"boilerplates": []map[string]any{
			{
				"language": "python",
				"code":     "import sys\n\n{{USER_CODE}}\n\ns = input().strip()\nprint(solution(s))",
			},
		},
	}, adminToken)

	if problemRR.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", problemRR.Code, problemRR.Body.String())
	}
	problemID := parseResponse(t, problemRR)["problem"].(map[string]any)["id"].(string)

	// Submit correct function body.
	t.Run("CorrectFunction", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/submissions", map[string]any{
			"problem_id":  problemID,
			"language":    "python",
			"source_code": "def solution(s):\n    return s[::-1]",
		}, userToken)

		if rr.Code != http.StatusAccepted {
			t.Fatalf("expected 202, got %d: %s", rr.Code, rr.Body.String())
		}

		subID := parseResponse(t, rr)["submission"].(map[string]any)["id"].(string)
		time.Sleep(10 * time.Second)
		app.wg.Wait()

		getRR := makeRequest(app, "GET", "/v1/submissions/"+subID, nil, userToken)
		sub := parseResponse(t, getRR)["submission"].(map[string]any)

		if sub["status"] != "accepted" {
			t.Errorf("expected accepted, got %v", sub["status"])
		}
	})

	// Submit with unsupported language for this problem.
	t.Run("UnsupportedLanguageForProblem", func(t *testing.T) {
		rr := makeRequest(app, "POST", "/v1/submissions", map[string]any{
			"problem_id":  problemID,
			"language":    "go",
			"source_code": `package main; func main() {}`,
		}, userToken)

		if rr.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for unsupported language, got %d: %s", rr.Code, rr.Body.String())
		}
	})
}

func TestStreakLogic(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	// Create user directly.
	user := &data.User{Email: "streak@test.com", Username: "streaker", DisplayName: "Streaker", Role: "user"}
	app.models.Users.Insert(user, "Streak@1234")

	// Day 1: attend contest.
	day1 := time.Now().AddDate(0, 0, -3)
	err := app.models.Users.UpdateStreak(user.ID, day1)
	if err != nil {
		t.Fatal(err)
	}

	u, _ := app.models.Users.GetByID(user.ID)
	if u.CurrentStreak != 1 {
		t.Errorf("expected streak=1 after day 1, got %d", u.CurrentStreak)
	}

	// Day 2: attend contest (consecutive).
	day2 := day1.AddDate(0, 0, 1)
	app.models.Users.UpdateStreak(user.ID, day2)

	u, _ = app.models.Users.GetByID(user.ID)
	if u.CurrentStreak != 2 {
		t.Errorf("expected streak=2 after day 2, got %d", u.CurrentStreak)
	}

	// Day 3: attend contest (consecutive).
	day3 := day2.AddDate(0, 0, 1)
	app.models.Users.UpdateStreak(user.ID, day3)

	u, _ = app.models.Users.GetByID(user.ID)
	if u.CurrentStreak != 3 {
		t.Errorf("expected streak=3 after day 3, got %d", u.CurrentStreak)
	}
	if u.MaxStreak != 3 {
		t.Errorf("expected max_streak=3, got %d", u.MaxStreak)
	}

	// Day 5: skip day 4, attend day 5 (streak broken).
	day5 := day3.AddDate(0, 0, 2)
	app.models.Users.UpdateStreak(user.ID, day5)

	u, _ = app.models.Users.GetByID(user.ID)
	if u.CurrentStreak != 1 {
		t.Errorf("expected streak=1 after break, got %d", u.CurrentStreak)
	}
	if u.MaxStreak != 3 {
		t.Errorf("expected max_streak still 3, got %d", u.MaxStreak)
	}
}

func TestGlobalLeaderboard(t *testing.T) {
	app, cleanup := testApplication(t)
	defer cleanup()

	// Create users with different scores.
	ctx := context.Background()
	for i := 1; i <= 5; i++ {
		u := &data.User{
			Email:       fmt.Sprintf("user%d@test.com", i),
			Username:    fmt.Sprintf("user%d", i),
			DisplayName: fmt.Sprintf("User %d", i),
			Role:        "user",
		}
		app.models.Users.Insert(u, "Test@1234")
		// Manually set total_score.
		app.models.Users.DB.Exec(ctx, "UPDATE users SET total_score = $1 WHERE id = $2", i*100, u.ID)
	}

	rr := makeRequest(app, "GET", "/v1/leaderboard", nil, "")
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	result := parseResponse(t, rr)
	entries := result["leaderboard"].([]any)

	if len(entries) != 5 {
		t.Fatalf("expected 5 entries, got %d", len(entries))
	}

	// First entry should have highest score.
	first := entries[0].(map[string]any)
	if int(first["score"].(float64)) != 500 {
		t.Errorf("expected first place score=500, got %v", first["score"])
	}
	if int(first["rank"].(float64)) != 1 {
		t.Errorf("expected rank=1, got %v", first["rank"])
	}

	// Last entry should have lowest score.
	last := entries[4].(map[string]any)
	if int(last["score"].(float64)) != 100 {
		t.Errorf("expected last place score=100, got %v", last["score"])
	}
}

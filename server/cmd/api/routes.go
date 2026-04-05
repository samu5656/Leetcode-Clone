package main

import "net/http"

func (app *application) routes() http.Handler {
	mux := http.NewServeMux()

	// Health check.
	mux.HandleFunc("GET /v1/healthcheck", func(w http.ResponseWriter, r *http.Request) {
		app.writeJSON(w, http.StatusOK, envelope{"status": "available", "environment": app.config.env}, nil)
	})

	// Auth (public).
	mux.HandleFunc("POST /v1/auth/register", app.registerHandler)
	mux.HandleFunc("POST /v1/auth/login", app.loginHandler)
	mux.HandleFunc("POST /v1/auth/refresh", app.refreshTokenHandler)

	// Leaderboard (public).
	mux.HandleFunc("GET /v1/leaderboard", app.globalLeaderboardHandler)

	// Public user profile. The {id} will NOT match "me" because
	// the explicit "/v1/users/me" routes registered below take priority.
	mux.HandleFunc("GET /v1/users/{id}", app.getUserByIDHandler)

	// --- Authenticated: User "me" routes ---
	// Registered with explicit methods to avoid conflict with GET /v1/users/{id}.
	mux.Handle("GET /v1/users/me", app.authenticate(http.HandlerFunc(app.getCurrentUserHandler)))
	mux.Handle("PUT /v1/users/me", app.authenticate(http.HandlerFunc(app.updateCurrentUserHandler)))

	// --- Authenticated: Problem routes ---
	mux.Handle("GET /v1/problems", app.authenticate(http.HandlerFunc(app.listProblemsHandler)))
	mux.Handle("GET /v1/problems/{slug}", app.authenticate(http.HandlerFunc(app.getProblemHandler)))

	// --- Authenticated: Contest routes ---
	mux.Handle("GET /v1/contests", app.authenticate(http.HandlerFunc(app.listContestsHandler)))
	mux.Handle("GET /v1/contests/{id}", app.authenticate(http.HandlerFunc(app.getContestHandler)))
	mux.Handle("POST /v1/contests/{id}/join", app.authenticate(http.HandlerFunc(app.joinContestHandler)))
	mux.Handle("GET /v1/contests/{id}/leaderboard", app.authenticate(http.HandlerFunc(app.contestLeaderboardHandler)))

	// --- Authenticated: Submission routes ---
	mux.Handle("POST /v1/submissions", app.authenticate(http.HandlerFunc(app.createSubmissionHandler)))
	mux.Handle("GET /v1/submissions/{id}", app.authenticate(http.HandlerFunc(app.getSubmissionHandler)))

	// --- Admin routes ---
	mux.Handle("POST /v1/admin/problems", app.authenticate(app.requireAdmin(http.HandlerFunc(app.createProblemHandler))))
	mux.Handle("DELETE /v1/admin/problems/{id}", app.authenticate(app.requireAdmin(http.HandlerFunc(app.deleteProblemHandler))))
	mux.Handle("POST /v1/admin/contests", app.authenticate(app.requireAdmin(http.HandlerFunc(app.createContestHandler))))

	// Apply global middleware.
	return app.recoverPanic(app.enableCORS(app.rateLimit(mux)))
}

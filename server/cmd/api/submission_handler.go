package main

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/vj/dsa-contest-backend/internal/data"
	"github.com/vj/dsa-contest-backend/internal/executor"
)

const maxSourceCodeBytes = 64 * 1024 // 64 KB

func (app *application) createSubmissionHandler(w http.ResponseWriter, r *http.Request) {
	claims := app.userFromContext(r)

	var input struct {
		ProblemID  string  `json:"problem_id"`
		ContestID  *string `json:"contest_id,omitempty"`
		Language   string  `json:"language"`
		SourceCode string  `json:"source_code"`
	}

	err := app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate source code size.
	if len(input.SourceCode) > maxSourceCodeBytes {
		app.badRequestResponse(w, r, errors.New("source code must be under 64KB"))
		return
	}

	// Validate language.
	if !executor.SupportedLanguages[input.Language] {
		app.badRequestResponse(w, r, errors.New("unsupported language"))
		return
	}

	// Validate problem exists.
	problem, err := app.models.Problems.GetByID(input.ProblemID)
	if err != nil {
		if errors.Is(err, data.ErrRecordNotFound) {
			app.badRequestResponse(w, r, errors.New("problem not found"))
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// If contest submission, validate contest is active and user has joined.
	if input.ContestID != nil {
		contest, err := app.models.Contests.GetByID(*input.ContestID)
		if err != nil {
			app.badRequestResponse(w, r, errors.New("contest not found"))
			return
		}
		if contest.Status != "active" {
			app.badRequestResponse(w, r, errors.New("contest is not active"))
			return
		}
		isParticipant, err := app.models.Contests.IsParticipant(*input.ContestID, claims.UserID)
		if err != nil {
			app.serverErrorResponse(w, r, err)
			return
		}
		if !isParticipant {
			app.badRequestResponse(w, r, errors.New("you must join the contest first"))
			return
		}
	}

	// Wrap user code with boilerplate.
	var sourceCode string
	bp, err := app.models.Problems.GetBoilerplate(problem.ID, input.Language)
	if err != nil {
		if errors.Is(err, data.ErrRecordNotFound) {
			app.badRequestResponse(w, r, errors.New("this problem does not support "+input.Language))
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}
	bpCode := bp.Code
	startIdx := strings.Index(bpCode, "====STARTER_CODE====")
	if startIdx != -1 {
		endIdx := strings.Index(bpCode[startIdx+20:], "====STARTER_CODE====")
		if endIdx != -1 {
			// Remove the block and its surrounding tags
			bpCode = bpCode[:startIdx] + bpCode[startIdx+20+endIdx+20:]
			bpCode = strings.TrimPrefix(bpCode, "\n")
		}
	}

	sourceCode = strings.Replace(bpCode, "{{USER_CODE}}", input.SourceCode, 1)

	// Insert submission as pending.
	sub := &data.Submission{
		UserID:     claims.UserID,
		ProblemID:  input.ProblemID,
		ContestID:  input.ContestID,
		Language:   input.Language,
		SourceCode: input.SourceCode,
	}

	err = app.models.Submissions.Insert(sub)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	// Evaluate in background.
	app.background(func() {
		app.evaluateSubmission(sub.ID, problem, sourceCode, input.Language, claims.UserID, input.ContestID)
	})

	app.writeJSON(w, http.StatusAccepted, envelope{
		"submission": map[string]any{
			"id":     sub.ID,
			"status": "pending",
		},
	}, nil)
}

// evaluateSubmission runs all test cases and updates the submission.
func (app *application) evaluateSubmission(submissionID string, problem *data.Problem, sourceCode, language, userID string, contestID *string) {
	ctx := context.Background()

	testCases, err := app.models.Problems.GetTestCases(problem.ID, false)
	if err != nil {
		app.logger.Error("failed to fetch test cases", "error", err, "submission_id", submissionID)
		return
	}

	passed := 0
	total := len(testCases)
	var maxTimeMs float64
	var maxMemoryKb float64
	finalStatus := "accepted"
	var errorMessage *string

	for _, tc := range testCases {
		result := app.executor.Evaluate(ctx, language, sourceCode, tc.Input, tc.ExpectedOutput, problem.TimeLimitMs, problem.MemoryLimitKb)

		if result.TimeMs > maxTimeMs {
			maxTimeMs = result.TimeMs
		}
		if result.MemoryKb > maxMemoryKb {
			maxMemoryKb = result.MemoryKb
		}

		if result.Passed {
			passed++
		} else {
			finalStatus = result.Status
			// Capture error message from stderr if available
			if result.Stderr != "" {
				errorMessage = &result.Stderr
			}
			// Early exit on compilation error.
			if result.Status == "compilation_error" {
				break
			}
		}
	}

	if passed == total {
		finalStatus = "accepted"
	}

	// Calculate score. For contest submissions, use contest points; for practice, use a default.
	maxPoints := 100
	if contestID != nil {
		points, err := app.models.Contests.GetPointsForProblem(*contestID, problem.ID)
		if err == nil {
			maxPoints = points
		}
	}
	score := 0
	if total > 0 {
		score = (passed * maxPoints) / total
	}

	// Update submission result.
	err = app.models.Submissions.UpdateResult(submissionID, finalStatus, passed, total, maxTimeMs, maxMemoryKb, score, errorMessage)
	if err != nil {
		app.logger.Error("failed to update submission", "error", err, "submission_id", submissionID)
		return
	}

	// If contest, recompute participant score.
	if contestID != nil {
		err = app.models.Contests.RecomputeParticipantScore(*contestID, userID)
		if err != nil {
			app.logger.Error("failed to recompute contest score", "error", err)
		}
	}

	// If accepted, recompute user stats.
	if finalStatus == "accepted" {
		err = app.models.Users.RecomputeStats(userID)
		if err != nil {
			app.logger.Error("failed to recompute user stats", "error", err)
		}
	}
}

func (app *application) getSubmissionHandler(w http.ResponseWriter, r *http.Request) {
	id := app.readIDParam(r, "id")

	sub, err := app.models.Submissions.GetByID(id)
	if err != nil {
		if errors.Is(err, data.ErrRecordNotFound) {
			app.notFoundResponse(w, r)
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Don't return source_code in the response for security.
	app.writeJSON(w, http.StatusOK, envelope{"submission": map[string]any{
		"id":            sub.ID,
		"user_id":       sub.UserID,
		"problem_id":    sub.ProblemID,
		"contest_id":    sub.ContestID,
		"language":      sub.Language,
		"status":        sub.Status,
		"passed":        sub.Passed,
		"total":         sub.Total,
		"time_ms":       sub.TimeMs,
		"memory_kb":     sub.MemoryKb,
		"score":         sub.Score,
		"error_message": sub.ErrorMessage,
		"created_at":    sub.CreatedAt,
	}}, nil)
}

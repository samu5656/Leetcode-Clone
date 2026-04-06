package main

import (
	"errors"
	"net/http"
	"time"

	"github.com/vj/dsa-contest-backend/internal/data"
	"github.com/vj/dsa-contest-backend/internal/validator"
)

func (app *application) createContestHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title     string                    `json:"title"`
		StartTime time.Time                 `json:"start_time"`
		EndTime   time.Time                 `json:"end_time"`
		Problems  []data.ContestProblemInput `json:"problems"`
	}

	err := app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	v := validator.New()
	v.Check(input.Title != "", "title", "must be provided")
	v.Check(!input.StartTime.IsZero(), "start_time", "must be provided")
	v.Check(!input.EndTime.IsZero(), "end_time", "must be provided")
	v.Check(input.EndTime.After(input.StartTime), "end_time", "must be after start_time")
	v.Check(len(input.Problems) >= 1, "problems", "must have at least 1 problem")

	for _, p := range input.Problems {
		v.Check(p.Points > 0, "points", "each problem must have positive points")
	}

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	contestInput := &data.CreateContestInput{
		Title:     input.Title,
		StartTime: input.StartTime,
		EndTime:   input.EndTime,
		Problems:  input.Problems,
	}

	contest, err := app.models.Contests.Insert(contestInput)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusCreated, envelope{"contest": contest}, nil)
}

func (app *application) listContestsHandler(w http.ResponseWriter, r *http.Request) {
	status := app.readString(r, "status", "")
	filters := data.Filters{
		Page:     app.readIntWithBounds(r, "page", 1, 1, 10000),
		PageSize: app.readIntWithBounds(r, "page_size", 20, 1, 100),
	}

	contests, metadata, err := app.models.Contests.List(status, filters)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"contests": contests, "metadata": metadata}, nil)
}

func (app *application) getContestHandler(w http.ResponseWriter, r *http.Request) {
	id := app.readIDParam(r, "id")

	contest, err := app.models.Contests.GetByID(id)
	if err != nil {
		if errors.Is(err, data.ErrRecordNotFound) {
			app.notFoundResponse(w, r)
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	response := envelope{"contest": contest}

	// Check if user has joined (for authenticated requests)
	claims := app.userFromContext(r)
	if claims != nil {
		isJoined, err := app.models.Contests.IsParticipant(contest.ID, claims.UserID)
		if err != nil {
			app.serverErrorResponse(w, r, err)
			return
		}
		response["is_joined"] = isJoined
	}

	// Only show problems if contest is active or ended.
	if contest.Status == "active" || contest.Status == "ended" {
		problemsList, err := app.models.Contests.GetProblems(contest.ID)
		if err != nil {
			app.serverErrorResponse(w, r, err)
			return
		}

		problems := make([]map[string]any, 0, len(problemsList))
		for _, p := range problemsList {
			problem := map[string]any{
				"problem_id": p.ProblemID,
				"points":     p.Points,
				"title":      p.Title,
				"slug":       p.Slug,
				"difficulty": p.Difficulty,
			}
			
			// Add completion status if user is authenticated
			if claims != nil {
				isCompleted, err := app.models.Problems.IsCompletedByUser(p.ProblemID, claims.UserID, &contest.ID)
				if err != nil {
					app.serverErrorResponse(w, r, err)
					return
				}
				problem["is_completed"] = isCompleted
			}
			
			problems = append(problems, problem)
		}
		response["problems"] = problems
	}

	app.writeJSON(w, http.StatusOK, response, nil)
}

func (app *application) joinContestHandler(w http.ResponseWriter, r *http.Request) {
	contestID := app.readIDParam(r, "id")
	claims := app.userFromContext(r)

	contest, err := app.models.Contests.GetByID(contestID)
	if err != nil {
		if errors.Is(err, data.ErrRecordNotFound) {
			app.notFoundResponse(w, r)
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	if contest.Status == "ended" {
		app.badRequestResponse(w, r, errors.New("contest has already ended"))
		return
	}

	err = app.models.Contests.Join(contestID, claims.UserID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"message": "joined contest successfully"}, nil)
}

func (app *application) contestLeaderboardHandler(w http.ResponseWriter, r *http.Request) {
	contestID := app.readIDParam(r, "id")
	filters := data.Filters{
		Page:     app.readIntWithBounds(r, "page", 1, 1, 10000),
		PageSize: app.readIntWithBounds(r, "page_size", 50, 1, 100),
	}

	entries, metadata, err := app.models.Leaderboard.Contest(contestID, filters)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"leaderboard": entries, "metadata": metadata}, nil)
}

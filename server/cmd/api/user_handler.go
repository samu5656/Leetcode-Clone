package main

import (
	"errors"
	"net/http"

	"github.com/vj/dsa-contest-backend/internal/data"
)

func (app *application) getCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	claims := app.userFromContext(r)

	user, err := app.models.Users.GetByID(claims.UserID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"user": user}, nil)
}

func (app *application) updateCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	claims := app.userFromContext(r)

	var input struct {
		DisplayName string `json:"display_name"`
	}

	err := app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if input.DisplayName == "" {
		app.badRequestResponse(w, r, errors.New("display_name must be provided"))
		return
	}

	err = app.models.Users.Update(claims.UserID, input.DisplayName)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"message": "profile updated"}, nil)
}

func (app *application) getUserByIDHandler(w http.ResponseWriter, r *http.Request) {
	id := app.readIDParam(r, "id")

	user, err := app.models.Users.GetByID(id)
	if err != nil {
		if errors.Is(err, data.ErrRecordNotFound) {
			app.notFoundResponse(w, r)
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Only return public fields.
	app.writeJSON(w, http.StatusOK, envelope{"user": map[string]any{
		"id":              user.ID,
		"username":        user.Username,
		"display_name":    user.DisplayName,
		"total_score":     user.TotalScore,
		"problems_solved": user.ProblemsSolved,
		"current_streak":  user.CurrentStreak,
		"max_streak":      user.MaxStreak,
		"created_at":      user.CreatedAt,
	}}, nil)
}

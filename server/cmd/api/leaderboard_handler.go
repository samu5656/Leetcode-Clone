package main

import (
	"net/http"

	"github.com/vj/dsa-contest-backend/internal/data"
)

func (app *application) globalLeaderboardHandler(w http.ResponseWriter, r *http.Request) {
	filters := data.Filters{
		Page:     app.readIntWithBounds(r, "page", 1, 1, 10000),
		PageSize: app.readIntWithBounds(r, "page_size", 50, 1, 100),
	}

	entries, metadata, err := app.models.Leaderboard.Global(filters)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"leaderboard": entries, "metadata": metadata}, nil)
}

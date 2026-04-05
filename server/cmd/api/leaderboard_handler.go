package main

import (
	"net/http"

	"github.com/vj/dsa-contest-backend/internal/data"
)

func (app *application) globalLeaderboardHandler(w http.ResponseWriter, r *http.Request) {
	filters := data.Filters{
		Page:     app.readInt(r, "page", 1),
		PageSize: app.readInt(r, "page_size", 50),
	}

	entries, metadata, err := app.models.Leaderboard.Global(filters)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"leaderboard": entries, "metadata": metadata}, nil)
}

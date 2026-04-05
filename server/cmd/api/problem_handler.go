package main

import (
	"errors"
	"net/http"
	"strings"

	"github.com/vj/dsa-contest-backend/internal/data"
	"github.com/vj/dsa-contest-backend/internal/validator"
)

func (app *application) createProblemHandler(w http.ResponseWriter, r *http.Request) {
	var input data.CreateProblemInput

	err := app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	v := validator.New()
	v.Check(input.Title != "", "title", "must be provided")
	v.Check(input.Slug != "", "slug", "must be provided")
	v.Check(input.Description != "", "description", "must be provided")
	v.Check(validator.In(input.Difficulty, "easy", "medium", "hard"), "difficulty", "must be easy, medium, or hard")
	v.Check(input.FunctionSignature != nil && *input.FunctionSignature != "", "function_signature", "must be provided")
	v.Check(len(input.TestCases) >= 1, "test_cases", "must have at least 1 test case")
	v.Check(input.TimeLimitMs > 0, "time_limit_ms", "must be positive")
	v.Check(input.MemoryLimitKb > 0, "memory_limit_kb", "must be positive")
	v.Check(len(input.Boilerplates) >= 1, "boilerplates", "must have at least 1 boilerplate")

	for i, bp := range input.Boilerplates {
		if !strings.Contains(bp.Code, "{{USER_CODE}}") {
			v.AddError("boilerplates", "boilerplate "+string(rune('0'+i))+" must contain {{USER_CODE}} placeholder")
		}
	}

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	problem, err := app.models.Problems.Insert(&input)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusCreated, envelope{"problem": problem}, nil)
}

func (app *application) listProblemsHandler(w http.ResponseWriter, r *http.Request) {
	difficulty := app.readString(r, "difficulty", "")
	filters := data.Filters{
		Page:     app.readInt(r, "page", 1),
		PageSize: app.readInt(r, "page_size", 20),
	}

	problems, metadata, err := app.models.Problems.List(difficulty, filters)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"problems": problems, "metadata": metadata}, nil)
}

func (app *application) getProblemHandler(w http.ResponseWriter, r *http.Request) {
	slug := app.readIDParam(r, "slug")

	problem, err := app.models.Problems.GetBySlug(slug)
	if err != nil {
		if errors.Is(err, data.ErrRecordNotFound) {
			app.notFoundResponse(w, r)
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	sampleTestCases, err := app.models.Problems.GetTestCases(problem.ID, true)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	boilerplates, err := app.models.Problems.GetBoilerplates(problem.ID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	// Return available languages from boilerplates.
	var availableLanguages []string
	for _, bp := range boilerplates {
		availableLanguages = append(availableLanguages, bp.Language)
	}

	app.writeJSON(w, http.StatusOK, envelope{
		"problem":             problem,
		"sample_test_cases":   sampleTestCases,
		"boilerplates":        boilerplates,
		"available_languages": availableLanguages,
	}, nil)
}

func (app *application) deleteProblemHandler(w http.ResponseWriter, r *http.Request) {
	id := app.readIDParam(r, "id")

	err := app.models.Problems.Delete(id)
	if err != nil {
		if errors.Is(err, data.ErrRecordNotFound) {
			app.notFoundResponse(w, r)
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"message": "problem deleted"}, nil)
}

package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/vj/dsa-contest-backend/internal/data"
	"github.com/vj/dsa-contest-backend/internal/validator"
)

type BulkCreateProblemsInput struct {
	Problems []data.CreateProblemInput `json:"problems"`
}

type BulkCreateResult struct {
	Success int      `json:"success"`
	Failed  int      `json:"failed"`
	Errors  []string `json:"errors,omitempty"`
}

func (app *application) bulkCreateProblemsHandler(w http.ResponseWriter, r *http.Request) {
	var input BulkCreateProblemsInput

	err := app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if len(input.Problems) == 0 {
		app.badRequestResponse(w, r, fmt.Errorf("problems array cannot be empty"))
		return
	}

	if len(input.Problems) > 100 {
		app.badRequestResponse(w, r, fmt.Errorf("cannot create more than 100 problems at once"))
		return
	}

	result := BulkCreateResult{}
	var createdProblems []*data.Problem

	for i, problemInput := range input.Problems {
		v := validator.New()
		v.Check(problemInput.Title != "", "title", fmt.Sprintf("problem %d: must be provided", i+1))
		v.Check(problemInput.Slug != "", "slug", fmt.Sprintf("problem %d: must be provided", i+1))
		v.Check(problemInput.Description != "", "description", fmt.Sprintf("problem %d: must be provided", i+1))
		v.Check(validator.In(problemInput.Difficulty, "easy", "medium", "hard"), "difficulty", fmt.Sprintf("problem %d: must be easy, medium, or hard", i+1))
		v.Check(problemInput.FunctionSignature != nil && *problemInput.FunctionSignature != "", "function_signature", fmt.Sprintf("problem %d: must be provided", i+1))
		v.Check(len(problemInput.TestCases) >= 1, "test_cases", fmt.Sprintf("problem %d: must have at least 1 test case", i+1))
		v.Check(problemInput.TimeLimitMs > 0, "time_limit_ms", fmt.Sprintf("problem %d: must be positive", i+1))
		v.Check(problemInput.MemoryLimitKb > 0, "memory_limit_kb", fmt.Sprintf("problem %d: must be positive", i+1))
		v.Check(len(problemInput.Boilerplates) >= 1, "boilerplates", fmt.Sprintf("problem %d: must have at least 1 boilerplate", i+1))

		for j, bp := range problemInput.Boilerplates {
			if !strings.Contains(bp.Code, "{{USER_CODE}}") {
				v.AddError("boilerplates", fmt.Sprintf("problem %d boilerplate %d must contain {{USER_CODE}} placeholder", i+1, j))
			}
		}

		if !v.Valid() {
			result.Failed++
			for field, msg := range v.Errors {
				result.Errors = append(result.Errors, fmt.Sprintf("Problem '%s' (%s): %s", problemInput.Title, field, msg))
			}
			continue
		}

		problem, err := app.models.Problems.Insert(&problemInput)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("Problem '%s': %v", problemInput.Title, err))
			continue
		}

		createdProblems = append(createdProblems, problem)
		result.Success++
	}

	app.writeJSON(w, http.StatusOK, envelope{
		"result":   result,
		"problems": createdProblems,
	}, nil)
}

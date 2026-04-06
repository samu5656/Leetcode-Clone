package main

import (
	"errors"
	"net/http"
	"regexp"
	"unicode"

	"github.com/vj/dsa-contest-backend/internal/auth"
	"github.com/vj/dsa-contest-backend/internal/data"
	"github.com/vj/dsa-contest-backend/internal/validator"
)

func (app *application) registerHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email       string `json:"email"`
		Username    string `json:"username"`
		Password    string `json:"password"`
		DisplayName string `json:"display_name"`
	}

	err := app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	emailPattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	
	v := validator.New()
	v.Check(input.Email != "", "email", "must be provided")
	v.Check(regexp.MustCompile(emailPattern).MatchString(input.Email), "email", "must be a valid email address")
	v.Check(len(input.Username) >= 3 && len(input.Username) <= 20, "username", "must be between 3 and 20 characters")
	v.Check(len(input.Password) >= 8, "password", "must be at least 8 characters")
	v.Check(hasUpper(input.Password), "password", "must contain at least one uppercase letter")
	v.Check(hasDigit(input.Password), "password", "must contain at least one digit")
	v.Check(input.DisplayName != "", "display_name", "must be provided")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	user := &data.User{
		Email:       input.Email,
		Username:    input.Username,
		DisplayName: input.DisplayName,
		Role:        "user",
	}

	err = app.models.Users.Insert(user, input.Password)
	if err != nil {
		switch {
		case errors.Is(err, data.ErrDuplicateEmail):
			v.AddError("email", "a user with this email address already exists")
			app.failedValidationResponse(w, r, v.Errors)
		case errors.Is(err, data.ErrDuplicateUsername):
			v.AddError("username", "a user with this username already exists")
			app.failedValidationResponse(w, r, v.Errors)
		default:
			app.serverErrorResponse(w, r, err)
		}
		return
	}

	accessToken, err := auth.GenerateToken(user.ID, user.Role, app.config.jwt.accessSecret, app.config.jwt.accessExpiry)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	refreshToken, err := auth.GenerateToken(user.ID, user.Role, app.config.jwt.refreshSecret, app.config.jwt.refreshExpiry)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusCreated, envelope{
		"user":          user,
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	}, nil)
}

func (app *application) loginHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user, err := app.models.Users.GetByEmail(input.Email)
	if err != nil {
		if errors.Is(err, data.ErrRecordNotFound) {
			app.errorResponse(w, r, http.StatusUnauthorized, "invalid credentials")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	if !data.MatchPassword(user.PasswordHash, input.Password) {
		app.errorResponse(w, r, http.StatusUnauthorized, "invalid credentials")
		return
	}

	accessToken, err := auth.GenerateToken(user.ID, user.Role, app.config.jwt.accessSecret, app.config.jwt.accessExpiry)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	refreshToken, err := auth.GenerateToken(user.ID, user.Role, app.config.jwt.refreshSecret, app.config.jwt.refreshExpiry)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{
		"user":          user,
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	}, nil)
}

func (app *application) refreshTokenHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshToken string `json:"refresh_token"`
	}

	err := app.readJSON(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	claims, err := auth.ValidateToken(input.RefreshToken, app.config.jwt.refreshSecret)
	if err != nil {
		app.unauthorizedResponse(w, r)
		return
	}

	user, err := app.models.Users.GetByID(claims.UserID)
	if err != nil {
		app.unauthorizedResponse(w, r)
		return
	}

	accessToken, err := auth.GenerateToken(user.ID, user.Role, app.config.jwt.accessSecret, app.config.jwt.accessExpiry)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	app.writeJSON(w, http.StatusOK, envelope{"access_token": accessToken}, nil)
}

func hasUpper(s string) bool {
	for _, r := range s {
		if unicode.IsUpper(r) {
			return true
		}
	}
	return false
}

func hasDigit(s string) bool {
	for _, r := range s {
		if unicode.IsDigit(r) {
			return true
		}
	}
	return false
}

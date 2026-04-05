package main

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/vj/dsa-contest-backend/internal/auth"
)

type contextKey string

const userContextKey = contextKey("user")

// userFromContext retrieves the authenticated user's claims from the request context.
func (app *application) userFromContext(r *http.Request) *auth.Claims {
	claims, ok := r.Context().Value(userContextKey).(*auth.Claims)
	if !ok {
		return nil
	}
	return claims
}

// recoverPanic recovers from panics and returns a 500 error.
func (app *application) recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				w.Header().Set("Connection", "close")
				app.serverErrorResponse(w, r, err.(error))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// authenticate extracts and validates the JWT from the Authorization header.
func (app *application) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			app.unauthorizedResponse(w, r)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			app.unauthorizedResponse(w, r)
			return
		}

		claims, err := auth.ValidateToken(parts[1], app.config.jwt.accessSecret)
		if err != nil {
			app.unauthorizedResponse(w, r)
			return
		}

		ctx := context.WithValue(r.Context(), userContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// requireAdmin checks that the authenticated user has the admin role.
func (app *application) requireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := app.userFromContext(r)
		if claims == nil || claims.Role != "admin" {
			app.forbiddenResponse(w, r)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// rateLimit applies a simple per-IP token bucket rate limiter.
func (app *application) rateLimit(next http.Handler) http.Handler {
	type client struct {
		tokens    float64
		lastSeen  time.Time
	}

	var (
		mu      sync.Mutex
		clients = make(map[string]*client)
	)

	const (
		rate     = 2.0   // tokens per second
		capacity = 30.0  // max burst
	)

	// Clean up old entries every minute.
	go func() {
		for {
			time.Sleep(time.Minute)
			mu.Lock()
			for ip, c := range clients {
				if time.Since(c.lastSeen) > 3*time.Minute {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr

		mu.Lock()
		c, exists := clients[ip]
		if !exists {
			c = &client{tokens: capacity, lastSeen: time.Now()}
			clients[ip] = c
		}

		elapsed := time.Since(c.lastSeen).Seconds()
		c.tokens += elapsed * rate
		if c.tokens > capacity {
			c.tokens = capacity
		}
		c.lastSeen = time.Now()

		if c.tokens < 1 {
			mu.Unlock()
			app.rateLimitExceededResponse(w, r)
			return
		}

		c.tokens--
		mu.Unlock()

		next.ServeHTTP(w, r)
	})
}

// enableCORS sets headers to allow cross-origin requests from the frontend.
func (app *application) enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

# Copilot Instructions for DSA Contest Platform

A competitive programming platform with a Go backend and React frontend.

## Project Structure

```
server/         # Go backend (API server)
web/            # React frontend (Vite + Tailwind)
```

## Commands

### Backend (server/)

```bash
# Start dependencies (PostgreSQL + Piston code executor)
make docker/up

# Install language runtimes in Piston (required once)
make piston/install

# Run database migrations
make db/migrations/up

# Seed database with test data
make db/seed

# Reset database (down + up + seed)
make db/reset

# Run the API server
make run/api

# Run tests
make test                    # All tests
go test -v ./internal/data   # Single package

# Lint/vet
make audit
```

### Frontend (web/)

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

### Backend

- **Standard library `net/http`** - No web framework (Gin, Echo, etc.)
- **Go 1.22+ routing** - Uses `mux.HandleFunc("GET /v1/path", handler)` syntax
- **JWT dual-token auth** - Access token (15min) + refresh token (7 days)
- **Piston integration** - External code execution engine for submissions
- **PostgreSQL** with `pgx/v5` driver

**Handler pattern:**
```go
func (app *application) handlerName(w http.ResponseWriter, r *http.Request) {
    // Read input with app.readJSON()
    // Validate with validator.New()
    // Call app.models.X.Method()
    // Respond with app.writeJSON()
}
```

**Middleware chaining:**
```go
app.authenticate(app.requireAdmin(http.HandlerFunc(handler)))
```

### Frontend

- **React 19** with Vite
- **Tailwind CSS** with CSS custom properties for theming
- **CodeMirror 6** for the code editor
- **Axios** with auto-refresh interceptor for JWT
- **Lucide React** for icons

**API module pattern** (`api.js`):
```javascript
export const resourceAPI = {
  list: (params = {}) => api.get("/v1/resource", { params }),
  getByID: (id) => api.get(`/v1/resource/${id}`),
};
```

**Auth context** provides `{ user, isLoggedIn, isAdmin, login, logout, register }`.

## Conventions

### Backend

- Route handlers live in `cmd/api/*_handler.go`
- Data models and queries in `internal/data/`
- All API responses use `envelope{"key": value}` wrapper
- Errors return JSON: `{"error": "message"}` or `{"error": {"field": "message"}}`
- Admin routes prefixed with `/v1/admin/`

### Frontend

- Pages in `src/Pages/` (PascalCase filenames)
- Components in `src/components/`
- Use CSS variables for colors: `var(--bg-main)`, `var(--text-sub)`, etc.
- Dark mode via `html.dark` class
- Toast notifications via `useToast()` hook
- Loading states use `Loader2` from lucide-react with `animate-spin`

### Styling

Colors use CSS variables defined in `index.css`:
- Backgrounds: `--bg-main`, `--bg-card`, `--bg-alt`
- Text: `--text-main`, `--text-sub`
- Borders: `--border-line`, `--border-hover`
- Accent: `--accent` (orange #f97316)

Inline styles for CSS variables: `style={{ color: "var(--text-sub)" }}`

## Problem Types

1. **full_code** - User writes complete program (main function, I/O handling)
2. **function_only** - User writes just the solution function, wrapped with boilerplate

**Boilerplate format** (function_only):
- Must contain `{{USER_CODE}}` placeholder
- Per-language starter code delimited by `====STARTER_CODE====`

## Environment

Backend requires these env vars (see `server/.envrc`):
- `DSA_DB_DSN` - PostgreSQL connection string
- `DSA_JWT_ACCESS_SECRET`, `DSA_JWT_REFRESH_SECRET`
- `DSA_PISTON_URL` - Code executor URL (default: http://localhost:2000/api/v2/)
- `DSA_PORT` - API port (default: 4000)

Frontend: `VITE_API_URL` (defaults to http://localhost:4000)

## Testing

Backend tests use standard `testing` package:
```bash
cd server && make test
```

Frontend has no test suite yet - use `npm run lint` for static analysis.

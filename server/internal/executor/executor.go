package executor

import (
	"context"
	"net/http"
	"strings"
	"time"

	gopiston "github.com/milindmadhukar/go-piston"
)

// SupportedLanguages is the set of languages we allow submissions in.
var SupportedLanguages = map[string]bool{
	"c++": true, "java": true, "javascript": true, "python": true,
}

// Result holds the evaluation outcome of a single test case.
type Result struct {
	Passed   bool
	Status   string  // accepted | wrong_answer | tle | runtime_error | compilation_error
	Stdout   string
	Stderr   string
	TimeMs   float64
	MemoryKb float64
}

// Executor wraps the Piston client with cached language versions.
type Executor struct {
	client   *gopiston.Client
	versions map[string]string
}

// New creates an Executor, connects to Piston, and caches all language versions.
func New(baseURL string) (*Executor, error) {
	client := gopiston.New("", http.DefaultClient, baseURL)

	runtimes, err := client.GetRuntimes(context.Background())
	if err != nil {
		return nil, err
	}

	versions := make(map[string]string)
	for _, rt := range *runtimes {
		versions[rt.Language] = rt.Version
	}

	return &Executor{client: client, versions: versions}, nil
}

// Run executes source code against Piston and returns the raw execution result.
func (e *Executor) Run(ctx context.Context, language, source, stdin string, timeLimitMs, memoryLimitKb int) (*gopiston.PistonExecution, error) {
	version := e.versions[language]
	return e.client.Execute(
		ctx,
		language,
		version,
		[]gopiston.Code{{Content: source}},
		gopiston.Stdin(stdin),
		gopiston.RunTimeout(time.Duration(timeLimitMs)*time.Millisecond),
		gopiston.RunMemoryLimit(memoryLimitKb*1024),
	)
}

// Evaluate runs source code against a single test case and returns a Result.
func (e *Executor) Evaluate(ctx context.Context, language, source, stdin, expectedOutput string, timeLimitMs, memoryLimitKb int) Result {
	exec, err := e.Run(ctx, language, source, stdin, timeLimitMs, memoryLimitKb)
	if err != nil {
		return Result{Status: "runtime_error", Stderr: err.Error()}
	}

	// Compilation error (for compiled languages).
	if exec.Compile.Code != 0 {
		return Result{Status: "compilation_error", Stderr: exec.Compile.Stderr}
	}

	// Timeout.
	if exec.Run.Status == "TO" {
		return Result{Status: "tle", TimeMs: exec.Run.WallTime}
	}

	// Runtime error or killed by signal.
	if exec.Run.Code != 0 || exec.Run.Status == "SG" || exec.Run.Status == "RE" {
		return Result{Status: "runtime_error", Stderr: exec.Run.Stderr, TimeMs: exec.Run.WallTime}
	}

	// Compare output.
	actual := strings.TrimSpace(exec.Run.Stdout)
	expected := strings.TrimSpace(expectedOutput)
	passed := actual == expected

	status := "wrong_answer"
	if passed {
		status = "accepted"
	}

	return Result{
		Passed:   passed,
		Status:   status,
		Stdout:   exec.Run.Stdout,
		TimeMs:   exec.Run.WallTime,
		MemoryKb: exec.Run.Memory / 1024,
	}
}

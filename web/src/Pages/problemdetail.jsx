import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { problemAPI, submissionAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import CodeEditor from "../components/CodeEditor";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

const ALL_LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "c++", label: "C++" },
  { value: "java", label: "Java" },
];

// All problems are function-only. User writes only the function body.
// The starter code between ====STARTER_CODE==== markers is shown to the user.

export default function ProblemDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const contestId = searchParams.get("contest_id");
  const { isLoggedIn } = useAuth();

  const [problem, setProblem] = useState(null);
  const [sampleTestCases, setSampleTestCases] = useState([]);
  const [boilerplates, setBoilerplates] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState(null);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const pollRef = useRef(null);

  // Fetch problem data.
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchProblem = async () => {
      try {
        const res = await problemAPI.getBySlug(slug);
        const data = res.data;
        setProblem(data.problem);
        setSampleTestCases(data.sample_test_cases || []);
        setBoilerplates(data.boilerplates || []);

        if (data.available_languages && data.available_languages.length > 0) {
          setAvailableLanguages(data.available_languages);
          const defaultLang = data.available_languages.includes("python")
            ? "python"
            : data.available_languages[0];
          setLanguage(defaultLang);
        }
      } catch (err) {
        console.error("Failed to fetch problem:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [slug, isLoggedIn]);

  // Set starter code when language changes or problem loads.
  // Extract the function stub from between ====STARTER_CODE==== markers.
  useEffect(() => {
    if (!problem) return;

    const bp = boilerplates.find((b) => b.language === language);
    if (bp && bp.code.includes("====STARTER_CODE====")) {
      const parts = bp.code.split("====STARTER_CODE====");
      if (parts.length >= 3) {
        setCode(parts[1].trim() + "\n");
        setResult(null);
        return;
      }
    }
    // Fallback if no boilerplate found for this language
    setCode(`// Write your ${language} function here\n`);
    setResult(null);
  }, [language, problem, boilerplates]);

  // Determine which languages to show.
  const languages = availableLanguages
    ? ALL_LANGUAGES.filter((l) => availableLanguages.includes(l.value))
    : ALL_LANGUAGES;

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
  }, []);

  const resetCode = () => {
    const bp = boilerplates.find((b) => b.language === language);
    if (bp && bp.code.includes("====STARTER_CODE====")) {
      const parts = bp.code.split("====STARTER_CODE====");
      if (parts.length >= 3) {
        setCode(parts[1].trim() + "\n");
      }
    } else {
      setCode(`// Write your ${language} function here\n`);
    }
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setResult(null);

    try {
      const payload = {
        problem_id: problem.id,
        language,
        source_code: code,
      };
      if (contestId) payload.contest_id = contestId;

      const res = await submissionAPI.create(payload);
      const subId = res.data.submission.id;

      // Poll for result every 2s.
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await submissionAPI.getByID(subId);
          const sub = pollRes.data.submission;
          if (sub.status !== "pending") {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setResult(sub);
            setSubmissions((prev) => [sub, ...prev]);
            setSubmitting(false);
          }
        } catch {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setSubmitting(false);
        }
      }, 2000);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Submission failed. Please try again.";
      setResult({
        status: "error",
        message: typeof msg === "object" ? Object.values(msg)[0] : msg,
      });
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status) => {
    const map = {
      accepted: {
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        icon: <CheckCircle size={16} />,
        label: "Accepted",
      },
      wrong_answer: {
        color: "text-red-400 bg-red-500/10 border-red-500/30",
        icon: <XCircle size={16} />,
        label: "Wrong Answer",
      },
      tle: {
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        icon: <Clock size={16} />,
        label: "Time Limit Exceeded",
      },
      runtime_error: {
        color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        icon: <AlertTriangle size={16} />,
        label: "Runtime Error",
      },
      compilation_error: {
        color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
        icon: <XCircle size={16} />,
        label: "Compilation Error",
      },
      error: {
        color: "text-red-400 bg-red-500/10 border-red-500/30",
        icon: <XCircle size={16} />,
        label: "Error",
      },
    };
    return map[status] || map.error;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)]">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 text-red-400" size={48} />
          <p className="text-xl font-semibold">Problem not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      {/* ─────────── LEFT: Problem Description ─────────── */}
      <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border-line)]">
        {/* Header bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-[var(--border-line)] bg-[var(--bg-card)] flex items-center gap-2 sm:gap-3 flex-wrap">
          <h1 className="text-base sm:text-lg font-bold truncate">{problem.title}</h1>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${problem.difficulty === "easy"
                ? "text-emerald-400 bg-emerald-400/10"
                : problem.difficulty === "medium"
                  ? "text-yellow-400 bg-yellow-400/10"
                  : "text-red-400 bg-red-400/10"
              }`}
          >
                      {problem.difficulty}
          </span>
          {contestId && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-400/10 text-orange-400 uppercase">
              Contest
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-h-[50vh] lg:max-h-none">
          {/* Description */}
          <div
            className="leading-relaxed whitespace-pre-wrap mb-6 text-sm"
            style={{ color: "var(--text-sub)" }}
          >
            {problem.description}
          </div>

          {/* Function signature */}
          {problem.function_signature && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-sub)" }}>
                Function Signature
              </h3>
              <code className="bg-[var(--bg-alt)] px-4 py-3 rounded-lg font-mono text-xs sm:text-sm block border border-[var(--border-line)] overflow-x-auto">
                {problem.function_signature}
              </code>
            </div>
          )}

          {/* Supported languages */}
          {boilerplates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-sub)" }}>
                Supported Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {boilerplates.map((bp) => (
                  <span
                    key={bp.language}
                    className="text-xs px-2 py-1 rounded border border-[var(--border-line)] bg-[var(--bg-alt)]"
                    style={{ color: "var(--text-main)" }}
                  >
                    {ALL_LANGUAGES.find((l) => l.value === bp.language)?.label || bp.language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Constraints */}
          <div className="mb-6 flex gap-4">
            <div className="bg-[var(--bg-alt)] px-3 py-2 rounded border border-[var(--border-line)] text-xs">
              <span style={{ color: "var(--text-sub)" }}>Time Limit: </span>
              <span className="font-semibold">{problem.time_limit_ms}ms</span>
            </div>
            <div className="bg-[var(--bg-alt)] px-3 py-2 rounded border border-[var(--border-line)] text-xs">
              <span style={{ color: "var(--text-sub)" }}>Memory: </span>
              <span className="font-semibold">{(problem.memory_limit_kb / 1024).toFixed(0)}MB</span>
            </div>
          </div>

          {/* Sample test cases */}
          {sampleTestCases.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-sub)" }}>
                Sample Test Cases
              </h3>
              {sampleTestCases.map((tc, i) => (
                <div
                  key={tc.id || i}
                  className="mb-4 bg-[var(--bg-alt)] rounded-lg p-4 border border-[var(--border-line)]"
                >
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-sub)" }}>
                      Input
                    </span>
                    <pre className="font-mono text-sm mt-1 bg-[var(--bg-main)] p-2 rounded border border-[var(--border-line)] overflow-x-auto whitespace-pre-wrap">
                      {tc.input || "(empty)"}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-sub)" }}>
                      Expected Output
                    </span>
                    <pre className="font-mono text-sm mt-1 bg-[var(--bg-main)] p-2 rounded border border-[var(--border-line)] overflow-x-auto whitespace-pre-wrap">
                      {tc.expected_output}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Previous submissions (this session) */}
          {submissions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-sub)" }}>
                Submission History (This Session)
              </h3>
              <div className="space-y-2">
                {submissions.map((sub, i) => {
                  const cfg = getStatusConfig(sub.status);
                  return (
                    <div
                      key={sub.id || i}
                      className="bg-[var(--bg-alt)] rounded p-3 border border-[var(--border-line)] flex justify-between items-center text-sm"
                    >
                      <span className={`flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded border ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-sub)" }}>
                        <span>{sub.language}</span>
                        <span>{sub.passed}/{sub.total} passed</span>
                        {sub.score > 0 && <span className="text-orange-400 font-bold">+{sub.score}pts</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────── RIGHT: Code Editor + Submit ─────────── */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-[50vh] lg:min-h-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-[var(--border-line)] bg-[var(--bg-card)] flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[var(--bg-alt)] border border-[var(--border-line)] rounded px-2 sm:px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
              style={{ color: "var(--text-main)" }}
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            <span className="hidden sm:inline text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Write only the function body
            </span>
          </div>

          <button
            onClick={resetCode}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[var(--border-line)] hover:border-red-400 hover:text-red-400 transition"
            style={{ color: "var(--text-sub)" }}
            title="Reset to starter code"
          >
            <RotateCcw size={12} /> <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* CodeMirror Editor */}
        <div className="flex-1 overflow-hidden min-h-[200px]">
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            language={language}
            placeholder="Write your function here...\nThe boilerplate will wrap your code automatically."
          />
        </div>

        {/* Result panel */}
        {(result || submitting) && (
          <div className="px-4 py-3 border-t border-[var(--border-line)] bg-[var(--bg-card)] max-h-40 overflow-y-auto">
            {submitting ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-sub)" }}>
                <Loader2 size={16} className="animate-spin text-orange-500" />
                Evaluating your submission...
              </div>
            ) : result ? (
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {(() => {
                    const cfg = getStatusConfig(result.status);
                    return (
                      <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded border ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    );
                  })()}
                  {result.passed !== undefined && (
                    <span className="text-sm" style={{ color: "var(--text-sub)" }}>
                      {result.passed}/{result.total} test cases passed
                    </span>
                  )}
                  {result.score !== undefined && result.score > 0 && (
                    <span className="text-sm font-bold text-orange-400">+{result.score} pts</span>
                  )}
                </div>
                {(result.time_ms > 0 || result.memory_kb > 0) && (
                  <div className="text-xs flex gap-4 mb-1" style={{ color: "var(--text-sub)" }}>
                    {result.time_ms > 0 && <span>⏱ {result.time_ms.toFixed(1)}ms</span>}
                    {result.memory_kb > 0 && <span>💾 {(result.memory_kb / 1024).toFixed(2)}MB</span>}
                  </div>
                )}
                {(result.error_message || result.message) && (
                  <pre className="text-sm text-red-400 mt-2 bg-red-400/5 p-2 rounded border border-red-500/20 whitespace-pre-wrap overflow-x-auto">
                    {result.error_message || result.message}
                  </pre>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Submit button */}
        <div className="px-3 sm:px-4 py-3 bg-[var(--bg-card)] border-t border-[var(--border-line)]">
          <button
            onClick={handleSubmit}
            disabled={submitting || !code.trim()}
            className="w-full bg-emerald-500 py-2 sm:py-2.5 rounded-lg font-semibold hover:bg-emerald-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base"
          >
            <Play size={16} />
            {submitting ? "Evaluating..." : "Submit Solution"}
          </button>
        </div>
      </div>
    </div>
  );
}
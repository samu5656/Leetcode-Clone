import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { problemAPI, submissionAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import CodeEditor from "../components/CodeEditor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Database,
  Code2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
} from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

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
  const navigate = useNavigate();
  const toast = useToast();

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

  const [showTestCases, setShowTestCases] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("saved");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Track if we just restored a draft to prevent starter code from overwriting it
  const draftRestoredRef = useRef(false);
  // Track if initial code has been set for this problem/language combo
  const initialCodeSetRef = useRef(new Set());

  const getStorageKey = useCallback(() => {
    if (contestId) {
      return `draft_${slug}_${language}_contest_${contestId}`;
    }
    return `draft_${slug}_${language}`;
  }, [slug, language, contestId]);

  // Try to restore draft when problem loads or language changes
  useEffect(() => {
    if (!problem || !slug || !boilerplates.length) return;
    
    const storageKey = getStorageKey();
    const comboKey = `${slug}_${language}_${contestId || ''}`;
    
    // Skip if we already set initial code for this combo
    if (initialCodeSetRef.current.has(comboKey)) return;
    
    const savedDraft = localStorage.getItem(storageKey);
    const bp = boilerplates.find((b) => b.language === language);
    let starterCode = `// Write your ${language} function here\n`;
    
    if (bp && bp.code.includes("====STARTER_CODE====")) {
      const parts = bp.code.split("====STARTER_CODE====");
      if (parts.length >= 3) {
        starterCode = parts[1].trim() + "\n";
      }
    }
    
    // Mark this combo as initialized
    initialCodeSetRef.current.add(comboKey);
    
    // Restore draft if it exists and differs from starter
    if (savedDraft && savedDraft !== starterCode && savedDraft.trim() !== "") {
      setCode(savedDraft);
      draftRestoredRef.current = true;
      toast("Restored your draft", "info");
    } else {
      // Set starter code
      setCode(starterCode);
    }
    setResult(null);
  }, [problem, slug, language, boilerplates, contestId, getStorageKey, toast]);

  useEffect(() => {
    if (!code || !slug || !problem) return;
    
    const timeoutId = setTimeout(() => {
      setAutosaveStatus("saving");
      try {
        localStorage.setItem(getStorageKey(), code);
        setAutosaveStatus("saved");
      } catch {
        setAutosaveStatus("error");
      }
    }, 1000);
    
    setAutosaveStatus("unsaved");
    return () => clearTimeout(timeoutId);
  }, [code, getStorageKey, slug, problem]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (modKey && e.key === "Enter") {
        e.preventDefault();
        if (!submitting && code.trim()) {
          handleSubmit();
        }
      }
      
      if (modKey && e.key === "k") {
        e.preventDefault();
        setShowResetConfirm(true);
      }
      
      if (modKey && e.key === "/") {
        e.preventDefault();
        const currentIdx = languages.findIndex(l => l.value === language);
        const nextIdx = (currentIdx + 1) % languages.length;
        setLanguage(languages[nextIdx].value);
      }
      
      if (e.key === "Escape") {
        setShowResetConfirm(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitting, code, language]);

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
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [slug, isLoggedIn]);


  // Determine which languages to show.
  const languages = availableLanguages
    ? ALL_LANGUAGES.filter((l) => availableLanguages.includes(l.value))
    : ALL_LANGUAGES;

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
  }, []);

  const resetCode = () => {
    const bp = boilerplates.find((b) => b.language === language);
    let starterCode = `// Write your ${language} function here\n`;
    if (bp && bp.code.includes("====STARTER_CODE====")) {
      const parts = bp.code.split("====STARTER_CODE====");
      if (parts.length >= 3) {
        starterCode = parts[1].trim() + "\n";
      }
    }
    setCode(starterCode);
    localStorage.removeItem(getStorageKey());
    draftRestoredRef.current = false;
    setResult(null);
    setShowResetConfirm(false);
    toast("Code reset", "info");
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

      let delay = 1000;
      let attempts = 0;
      const maxAttempts = 20;

      const poll = async () => {
        try {
          const pollRes = await submissionAPI.getByID(subId);
          const sub = pollRes.data.submission;
          if (sub.status !== "pending") {
            pollRef.current = null;
            setResult(sub);
            setSubmissions((prev) => [sub, ...prev]);
            setSubmitting(false);
          } else {
            attempts++;
            if (attempts >= maxAttempts) {
              setResult({ status: "error", message: "Polling timed out. Check your history later." });
              setSubmitting(false);
            } else {
              delay = Math.min(delay * 1.5, 5000);
              pollRef.current = setTimeout(poll, delay);
            }
          }
        } catch {
          pollRef.current = null;
          setSubmitting(false);
        }
      };

      pollRef.current = setTimeout(poll, delay);
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
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        icon: <CheckCircle size={18} />,
        label: "Accepted",
        message: "Great job! Your solution passed all test cases! 🎉",
      },
      wrong_answer: {
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        icon: <AlertTriangle size={18} />,
        label: "Almost There",
        message: "You're making progress! Check the failed test case below.",
      },
      tle: {
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        icon: <Clock size={18} />,
        label: "Time Limit",
        message: "Your solution is correct but needs optimization. Try a more efficient approach!",
      },
      runtime_error: {
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        icon: <AlertTriangle size={18} />,
        label: "Runtime Error",
        message: "Check for edge cases like division by zero or array bounds.",
      },
      compilation_error: {
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        icon: <XCircle size={18} />,
        label: "Syntax Error",
        message: "There's a syntax issue in your code. Check the error message below.",
      },
      error: {
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        icon: <XCircle size={18} />,
        label: "Error",
        message: "Something went wrong. Please try again.",
      },
    };
    return map[status] || map.error;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-orange-500" size={36} />
          <span className="text-sm" style={{ color: "var(--text-sub)" }}>Loading problem...</span>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] px-4">
        <div className="text-center max-w-md">
          <XCircle className="mx-auto mb-4 text-red-400" size={56} />
          <p className="text-xl font-semibold mb-2">Problem not found</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-sub)" }}>This problem may have been removed or doesn't exist</p>
          <button
            onClick={() => navigate("/problems")}
            className="bg-orange-500 px-8 py-3 rounded-lg hover:bg-orange-600 active:scale-[0.98] transition-all duration-150 text-white font-semibold shadow-sm"
          >
            Browse Problems
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] w-full flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <Group direction="horizontal" className="h-full border-t border-[var(--border-line)]">
      {/* ─────────── LEFT: Problem Description ─────────── */}
      <Panel defaultSize={50} minSize={20} className="flex flex-col">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-[var(--border-line)] bg-[var(--bg-card)] flex items-center gap-3 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold">{problem.title}</h1>
          <span
            className={`text-sm font-bold tracking-widest uppercase ${problem.difficulty === "easy"
                ? "text-emerald-500"
                : problem.difficulty === "medium"
                  ? "text-amber-500"
                  : "text-red-500"
              }`}
          >
            {problem.difficulty}
          </span>
          {contestId && (
            <span className="text-sm font-semibold tracking-wide text-orange-500 uppercase">
              Contest
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 max-h-[50vh] lg:max-h-none">
          {/* Description */}
          <div className="mb-8" style={{ color: "var(--text-sub)" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: (props) => <p className="mb-4 leading-relaxed text-base" {...props} />,
                h1: (props) => <h1 className="text-2xl font-bold mt-8 mb-4 text-[var(--text-main)]" {...props} />,
                h2: (props) => <h2 className="text-xl font-bold mt-8 mb-4 text-[var(--text-main)]" {...props} />,
                h3: (props) => <h3 className="text-lg font-bold mt-6 mb-3 text-[var(--text-main)]" {...props} />,
                ul: (props) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                ol: (props) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                li: (props) => <li className="mb-1" {...props} />,
                strong: (props) => <strong className="font-bold text-[var(--text-main)]" {...props} />,
                code(props) {
                  const { children, className, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  const isBlock = match || (typeof children ==='string' && children.includes('\n'));
                  if (isBlock) {
                    return (
                      <div className="bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg p-4 my-4 overflow-x-auto">
                        <code className="text-sm font-mono whitespace-pre text-[var(--text-main)]" {...rest}>
                          {children}
                        </code>
                      </div>
                    );
                  }
                  return (
                    <code className="bg-[var(--bg-alt)] border border-[var(--border-line)] text-orange-500 px-1.5 py-0.5 rounded text-sm font-mono mx-1 break-words" {...rest}>
                      {children}
                    </code>
                  );
                },
                pre: (props) => <pre className="m-0 p-0 bg-transparent border-none" {...props} />,
              }}
            >
              {problem.description}
            </ReactMarkdown>
          </div>

          {/* Metadata Bar */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="bg-[var(--bg-card)] border border-[var(--border-line)] px-3 py-1.5 rounded-lg flex items-center gap-2" title="Time Limit">
               <Clock size={14} className="text-emerald-500" />
               <span className="text-xs font-bold text-[var(--text-main)]">{problem.time_limit_ms}ms</span>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-line)] px-3 py-1.5 rounded-lg flex items-center gap-2" title="Memory Limit">
               <Database size={14} className="text-blue-500" />
               <span className="text-xs font-bold text-[var(--text-main)]">{(problem.memory_limit_kb / 1024).toFixed(0)}MB</span>
            </div>
            {boilerplates.length > 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-line)] px-3 py-1.5 rounded-lg flex items-center gap-2" title="Supported Languages">
                 <Code2 size={14} className="text-amber-500" />
                 <span className="text-xs font-bold text-[var(--text-main)]">
                    {boilerplates.map(bp => ALL_LANGUAGES.find((l) => l.value === bp.language)?.label || bp.language).join(", ")}
                 </span>
              </div>
            )}
          </div>

          {/* Function signature */}
          {problem.function_signature && (
            <div className="mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-sub)" }}>
                Function Signature
              </h3>
              <code className="px-4 py-3 font-mono text-sm block overflow-x-auto text-orange-500 bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg">
                {problem.function_signature}
              </code>
            </div>
          )}

          {sampleTestCases.length > 0 && (
            <div>
              <button
                onClick={() => setShowTestCases(!showTestCases)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 hover:text-orange-400 transition-colors"
                style={{ color: "var(--text-sub)" }}
              >
                {showTestCases ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Sample Test Cases ({sampleTestCases.length})
              </button>
              {showTestCases && sampleTestCases.map((tc, i) => (
                <div
                  key={tc.id || i}
                  className="mb-6 bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg p-5"
                >
                  <div className="mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-sub)" }}>
                      Input
                    </span>
                    <pre className="font-mono text-sm mt-2 p-3 bg-[var(--bg-alt)] rounded overflow-x-auto whitespace-pre-wrap">
                      {tc.input || "(empty)"}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-sub)" }}>
                      Expected Output
                    </span>
                    <pre className="font-mono text-sm mt-2 p-3 bg-[var(--bg-alt)] rounded overflow-x-auto whitespace-pre-wrap">
                      {tc.expected_output}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {submissions.length > 0 && (
            <div className="mt-12">
              <button
                onClick={() => setShowSubmissions(!showSubmissions)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 hover:text-orange-400 transition-colors"
                style={{ color: "var(--text-sub)" }}
              >
                {showSubmissions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Session History ({submissions.length})
              </button>
              {showSubmissions && (
                <div className="flex flex-col border border-[var(--border-line)] rounded-lg overflow-hidden bg-[var(--bg-card)]">
                  {submissions.map((sub, i) => {
                    const cfg = getStatusConfig(sub.status);
                    return (
                      <div
                        key={sub.id || i}
                        className="flex justify-between items-center text-sm border-b border-[var(--border-line)] last:border-b-0 p-4 hover:bg-[var(--bg-alt)] transition-colors"
                      >
                        <span className={`flex items-center gap-2 font-bold ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-sub)" }}>
                          <span>{sub.language}</span>
                          <span className="text-emerald-500">{sub.passed}/{sub.total} passed</span>
                          {sub.score > 0 && <span className="text-orange-500">+{sub.score}pts</span>}
                       </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}
        </div>
      </Panel>

      <Separator className="w-2 bg-[var(--border-line)] hover:bg-orange-500 transition-colors duration-200 cursor-col-resize active:bg-orange-600 flex flex-col items-center justify-center">
        <div className="w-1 h-8 bg-[var(--text-sub)] rounded-full opacity-40 mb-1" />
        <div className="w-1 h-8 bg-[var(--text-sub)] rounded-full opacity-40 mb-1" />
      </Separator>

      <Panel defaultSize={50} minSize={20} className="flex flex-col min-h-0">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-line)] bg-[var(--bg-card)] flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-md px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-orange-500 cursor-pointer transition-all duration-200"
              style={{ color: "var(--text-main)" }}
              aria-label="Select programming language"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-[var(--bg-card)]">
                  {lang.label}
                </option>
              ))}
            </select>
            
            <div className={`autosave-indicator ${autosaveStatus}`}>
              {autosaveStatus === "saving" && <><Loader2 size={12} className="animate-spin" /> Saving...</>}
              {autosaveStatus === "saved" && <><Save size={12} /> Saved</>}
              {autosaveStatus === "unsaved" && <><Save size={12} /> Unsaved</>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md border border-[var(--border-line)] hover:border-red-500 hover:text-red-500 transition-colors duration-150"
              style={{ color: "var(--text-sub)" }}
              aria-label="Reset code to starter template"
            >
              <RotateCcw size={14} /> <span className="hidden sm:inline">Reset</span>
            </button>
            <span className="hidden md:flex items-center gap-1 text-xs" style={{ color: "var(--text-sub)" }}>
              <span className="kbd">⌘</span><span className="kbd">↵</span> to submit
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden min-h-[200px]">
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            language={language}
            placeholder="Write your function here...\nThe boilerplate will wrap your code automatically."
          />
        </div>

        {(result || submitting) && (
          <div className={`px-6 py-4 border-t border-[var(--border-line)] max-h-64 overflow-y-auto ${result?.status === "accepted" ? "bg-emerald-500/5" : "bg-[var(--bg-card)]"}`}>
            {submitting ? (
              <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-sub)" }}>
                <Loader2 size={18} className="animate-spin text-orange-500" />
                <span>Running your code against test cases...</span>
              </div>
            ) : result ? (
              <div className={result.status === "accepted" ? "celebrate" : ""}>
                <div className="flex items-center gap-4 mb-2 flex-wrap">
                  {(() => {
                    const cfg = getStatusConfig(result.status);
                    return (
                      <>
                        <span className={`flex items-center gap-2 text-lg font-bold ${cfg.color}`}>
                          {result.status === "accepted" && <Sparkles size={18} className="text-yellow-400" />}
                          {cfg.icon} {cfg.label}
                        </span>
                        {result.passed !== undefined && (
                          <span className="text-sm font-bold text-emerald-500">
                            {result.passed}/{result.total} tests passed
                          </span>
                        )}
                      </>
                    );
                  })()}
                  {result.score !== undefined && result.score > 0 && (
                    <span className="text-sm font-bold text-orange-400">+{result.score} points</span>
                  )}
                </div>
                
                {(() => {
                  const cfg = getStatusConfig(result.status);
                  return (
                    <p className="text-sm mb-3" style={{ color: "var(--text-sub)" }}>
                      {cfg.message}
                    </p>
                  );
                })()}
                
                {(result.time_ms > 0 || result.memory_kb > 0) && (
                  <div className="text-[10px] font-bold uppercase tracking-widest flex gap-4 mt-2" style={{ color: "var(--text-sub)" }}>
                    {result.time_ms > 0 && <span>TIME: {result.time_ms.toFixed(1)}ms</span>}
                    {result.memory_kb > 0 && <span>MEM: {(result.memory_kb / 1024).toFixed(2)}MB</span>}
                  </div>
                )}
                {(result.error_message || result.message) && (
                  <pre className="text-sm font-bold text-red-500 mt-4 border-l-4 border-red-500 pl-4 py-2 whitespace-pre-wrap overflow-x-auto">
                    {result.error_message || result.message}
                  </pre>
                )}
                {result.status === "wrong_answer" && result.failed_input && (
                  <div className="mt-6 bg-[var(--bg-main)] border border-[var(--border-line)] rounded-lg p-5">
                    <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-sub)" }}>
                      First Failed Test Case
                    </div>
                    <div className="flex flex-col gap-6">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-sub)" }}>Input</span>
                        <pre className="font-mono text-sm mt-2 p-3 bg-[var(--bg-alt)] border border-[var(--border-line)] rounded text-[var(--text-main)] whitespace-pre-wrap overflow-x-auto">
                          {result.failed_input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-sub)" }}>Expected</span>
                        <pre className="font-mono text-sm mt-2 p-3 bg-[var(--bg-alt)] border border-emerald-500/30 rounded text-emerald-500 whitespace-pre-wrap overflow-x-auto">
                          {result.failed_expected}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-sub)" }}>Your Output</span>
                        <pre className="font-mono text-sm mt-2 p-3 bg-[var(--bg-alt)] border border-amber-500/30 rounded text-amber-500 whitespace-pre-wrap overflow-x-auto">
                          {result.failed_actual || "(empty)"}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="px-6 py-4 bg-[var(--bg-card)] border-t border-[var(--border-line)]">
          <button
            onClick={handleSubmit}
            disabled={submitting || !code.trim()}
            className="w-full bg-emerald-500 py-4 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-emerald-600 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm"
          >
            <Play size={16} />
            {submitting ? "Running..." : "Submit Solution"}
          </button>
        </div>
      </Panel>
      </Group>
      
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-line)] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="reset-title"
          >
            <h2 id="reset-title" className="text-lg font-bold mb-2" style={{ color: "var(--text-main)" }}>
              Reset Code?
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-sub)" }}>
              This will restore the starter template and clear your current work. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-line)] hover:border-[var(--border-hover)] transition"
                style={{ color: "var(--text-sub)" }}
              >
                Cancel
              </button>
              <button
                onClick={resetCode}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition"
              >
                Reset Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
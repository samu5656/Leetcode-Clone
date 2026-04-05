import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { problemAPI, adminAPI } from "../api";
import {
  Shield,
  Plus,
  Trash2,
  FileCode,
  Trophy,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const LANGUAGES = ["python", "javascript", "c++", "java"];
const DIFFICULTIES = ["easy", "medium", "hard"];

export default function Admin() {
  const { isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("problems");
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);

  // Problem form state
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [problemForm, setProblemForm] = useState({
    title: "",
    slug: "",
    description: "",
    difficulty: "easy",
    function_signature: "",
    time_limit_ms: 2000,
    memory_limit_kb: 262144,
    test_cases: [{ input: "", expected_output: "", is_sample: true }],
    boilerplates: [],
  });
  const [submittingProblem, setSubmittingProblem] = useState(false);

  // Contest form state
  const [showContestForm, setShowContestForm] = useState(false);
  const [contestForm, setContestForm] = useState({
    title: "",
    start_time: "",
    end_time: "",
    problems: [],
  });
  const [submittingContest, setSubmittingContest] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch problems for admin management
  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return;

    const fetchProblems = async () => {
      try {
        const res = await problemAPI.list({ page_size: 100 });
        setProblems(res.data.problems || []);
      } catch (err) {
        console.error("Failed to fetch problems:", err);
      } finally {
        setLoadingProblems(false);
      }
    };

    fetchProblems();
  }, [isLoggedIn, isAdmin]);

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Handle title change and auto-generate slug
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setProblemForm({
      ...problemForm,
      title,
      slug: generateSlug(title),
    });
  };

  // Add test case
  const addTestCase = () => {
    setProblemForm({
      ...problemForm,
      test_cases: [
        ...problemForm.test_cases,
        { input: "", expected_output: "", is_sample: false },
      ],
    });
  };

  // Remove test case
  const removeTestCase = (index) => {
    if (problemForm.test_cases.length <= 1) return;
    setProblemForm({
      ...problemForm,
      test_cases: problemForm.test_cases.filter((_, i) => i !== index),
    });
  };

  // Update test case
  const updateTestCase = (index, field, value) => {
    const updated = [...problemForm.test_cases];
    updated[index] = { ...updated[index], [field]: value };
    setProblemForm({ ...problemForm, test_cases: updated });
  };

  // Add boilerplate
  const addBoilerplate = (lang) => {
    if (problemForm.boilerplates.find((b) => b.language === lang)) return;
    setProblemForm({
      ...problemForm,
      boilerplates: [
        ...problemForm.boilerplates,
        {
          language: lang,
          code: getDefaultBoilerplate(lang, problemForm.function_signature),
        },
      ],
    });
  };

  // Remove boilerplate
  const removeBoilerplate = (lang) => {
    setProblemForm({
      ...problemForm,
      boilerplates: problemForm.boilerplates.filter((b) => b.language !== lang),
    });
  };

  // Update boilerplate
  const updateBoilerplate = (lang, code) => {
    setProblemForm({
      ...problemForm,
      boilerplates: problemForm.boilerplates.map((b) =>
        b.language === lang ? { ...b, code } : b
      ),
    });
  };

  // Default boilerplate templates
  const getDefaultBoilerplate = (lang, funcSig) => {
    const templates = {
      python: `# Auto-generated boilerplate
====STARTER_CODE====
def solution():
    # Your code here
    pass
====STARTER_CODE====

# Test harness
import sys
input_data = sys.stdin.read().strip()
{{USER_CODE}}
result = solution()
print(result)
`,
      javascript: `// Auto-generated boilerplate
====STARTER_CODE====
function solution() {
    // Your code here
}
====STARTER_CODE====

// Test harness
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on("line", (line) => lines.push(line.trim()));
rl.on("close", () => {
    {{USER_CODE}}
    const result = solution();
    console.log(result);
});
`,
      "c++": `// Auto-generated boilerplate
#include <iostream>
#include <vector>
#include <string>
using namespace std;

====STARTER_CODE====
// Your solution here
====STARTER_CODE====

int main() {
    {{USER_CODE}}
    return 0;
}
`,
      java: `// Auto-generated boilerplate
import java.util.*;

public class Main {
    ====STARTER_CODE====
    // Your solution here
    ====STARTER_CODE====
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        {{USER_CODE}}
    }
}
`,
    };
    return templates[lang] || "// Add your boilerplate code here\n{{USER_CODE}}";
  };

  // Submit problem
  const handleSubmitProblem = async (e) => {
    e.preventDefault();

    // Validation
    if (!problemForm.title.trim()) {
      toast("Title is required", "error");
      return;
    }
    if (!problemForm.slug.trim()) {
      toast("Slug is required", "error");
      return;
    }
    if (!problemForm.description.trim()) {
      toast("Description is required", "error");
      return;
    }
    if (problemForm.test_cases.length === 0) {
      toast("At least one test case is required", "error");
      return;
    }
    if (!problemForm.function_signature.trim()) {
      toast("Function signature is required", "error");
      return;
    }
    if (problemForm.boilerplates.length === 0) {
      toast("At least one boilerplate is required", "error");
      return;
    }

    // Validate boilerplates have {{USER_CODE}}
    for (const bp of problemForm.boilerplates) {
      if (!bp.code.includes("{{USER_CODE}}")) {
        toast(`${bp.language} boilerplate must contain {{USER_CODE}} placeholder`, "error");
        return;
      }
    }

    setSubmittingProblem(true);
    try {
      const payload = {
        ...problemForm,
      };

      await adminAPI.createProblem(payload);
      toast("Problem created successfully!", "success");

      // Reset form
      setProblemForm({
        title: "",
        slug: "",
        description: "",
        difficulty: "easy",
        function_signature: "",
        time_limit_ms: 2000,
        memory_limit_kb: 262144,
        test_cases: [{ input: "", expected_output: "", is_sample: true }],
        boilerplates: [],
      });
      setShowProblemForm(false);

      // Refresh problem list
      const res = await problemAPI.list({ page_size: 100 });
      setProblems(res.data.problems || []);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create problem";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setSubmittingProblem(false);
    }
  };

  // Delete problem
  const handleDeleteProblem = async (id) => {
    setDeleting(true);
    try {
      await adminAPI.deleteProblem(id);
      toast("Problem deleted successfully!", "success");
      setProblems(problems.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete problem";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Submit contest
  const handleSubmitContest = async (e) => {
    e.preventDefault();

    if (!contestForm.title.trim()) {
      toast("Contest title is required", "error");
      return;
    }
    if (!contestForm.start_time) {
      toast("Start time is required", "error");
      return;
    }
    if (!contestForm.end_time) {
      toast("End time is required", "error");
      return;
    }
    if (new Date(contestForm.end_time) <= new Date(contestForm.start_time)) {
      toast("End time must be after start time", "error");
      return;
    }
    if (contestForm.problems.length === 0) {
      toast("At least one problem is required", "error");
      return;
    }

    setSubmittingContest(true);
    try {
      const payload = {
        title: contestForm.title,
        start_time: new Date(contestForm.start_time).toISOString(),
        end_time: new Date(contestForm.end_time).toISOString(),
        problems: contestForm.problems.map((p) => ({
          problem_id: p.id,
          points: p.points,
        })),
      };

      await adminAPI.createContest(payload);
      toast("Contest created successfully!", "success");

      // Reset form
      setContestForm({
        title: "",
        start_time: "",
        end_time: "",
        problems: [],
      });
      setShowContestForm(false);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create contest";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setSubmittingContest(false);
    }
  };

  // Add problem to contest
  const addProblemToContest = (problem) => {
    if (contestForm.problems.find((p) => p.id === problem.id)) return;
    setContestForm({
      ...contestForm,
      problems: [...contestForm.problems, { ...problem, points: 100 }],
    });
  };

  // Remove problem from contest
  const removeProblemFromContest = (problemId) => {
    setContestForm({
      ...contestForm,
      problems: contestForm.problems.filter((p) => p.id !== problemId),
    });
  };

  // Update problem points in contest
  const updateProblemPoints = (problemId, points) => {
    setContestForm({
      ...contestForm,
      problems: contestForm.problems.map((p) =>
        p.id === problemId ? { ...p, points: parseInt(points) || 0 } : p
      ),
    });
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Please sign in to access admin panel</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 px-6 py-2 rounded hover:bg-orange-600 transition text-white font with-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-400" size={36} />
          </div>
          <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
          <p className="text-base mb-6" style={{ color: "var(--text-sub)" }}>
            You don&apos;t have admin privileges. Only administrators can access this panel.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-orange-500 px-6 py-2 rounded-lg hover:bg-orange-600 transition text-white font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (diff) => {
    if (diff === "easy") return "text-green-400 bg-green-500/10";
    if (diff === "medium") return "text-yellow-400 bg-yellow-500/10";
    return "text-red-400 bg-red-500/10";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
            <Shield className="text-orange-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm" style={{ color: "var(--text-sub)" }}>
              Manage problems and contests
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("problems")}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition ${
              activeTab === "problems"
                ? "bg-orange-500 text-white"
                : "bg-[var(--bg-card)] border border-[var(--border-line)] hover:border-orange-400"
            }`}
            style={activeTab !== "problems" ? { color: "var(--text-main)" } : {}}
          >
            <FileCode size={16} /> Problems
          </button>
          <button
            onClick={() => setActiveTab("contests")}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition ${
              activeTab === "contests"
                ? "bg-orange-500 text-white"
                : "bg-[var(--bg-card)] border border-[var(--border-line)] hover:border-orange-400"
            }`}
            style={activeTab !== "contests" ? { color: "var(--text-main)" } : {}}
          >
            <Trophy size={16} /> Contests
          </button>
        </div>

        {/* Problems Tab */}
        {activeTab === "problems" && (
          <div>
            {/* Create Problem Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowProblemForm(!showProblemForm)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition"
              >
                {showProblemForm ? <ChevronUp size={16} /> : <Plus size={16} />}
                {showProblemForm ? "Hide Form" : "Create Problem"}
              </button>
            </div>

            {/* Problem Form */}
            {showProblemForm && (
              <form
                onSubmit={handleSubmitProblem}
                className="bg-[var(--bg-card)] border border-[var(--border-line)] rounded-xl p-6 mb-6"
              >
                <h2 className="text-lg font-bold mb-4">New Problem</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={problemForm.title}
                      onChange={handleTitleChange}
                      className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      style={{ color: "var(--text-main)" }}
                      placeholder="Two Sum"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={problemForm.slug}
                      onChange={(e) => setProblemForm({ ...problemForm, slug: e.target.value })}
                      className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      style={{ color: "var(--text-main)" }}
                      placeholder="two-sum"
                    />
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                      Difficulty *
                    </label>
                    <select
                      value={problemForm.difficulty}
                      onChange={(e) => setProblemForm({ ...problemForm, difficulty: e.target.value })}
                      className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 cursor-pointer"
                      style={{ color: "var(--text-main)" }}
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                      Time Limit (ms) *
                    </label>
                    <input
                      type="number"
                      value={problemForm.time_limit_ms}
                      onChange={(e) => setProblemForm({ ...problemForm, time_limit_ms: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      style={{ color: "var(--text-main)" }}
                      min="100"
                    />
                  </div>

                  {/* Memory Limit */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                      Memory Limit (KB) *
                    </label>
                    <input
                      type="number"
                      value={problemForm.memory_limit_kb}
                      onChange={(e) => setProblemForm({ ...problemForm, memory_limit_kb: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      style={{ color: "var(--text-main)" }}
                      min="1024"
                    />
                  </div>
                </div>

                {/* Function Signature */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                    Function Signature *
                  </label>
                  <input
                    type="text"
                    value={problemForm.function_signature}
                    onChange={(e) => setProblemForm({ ...problemForm, function_signature: e.target.value })}
                    className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-500"
                    style={{ color: "var(--text-main)" }}
                    placeholder="def twoSum(nums: List[int], target: int) -> List[int]:"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                    Description *
                  </label>
                  <textarea
                    value={problemForm.description}
                    onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                    className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 min-h-32"
                    style={{ color: "var(--text-main)" }}
                    placeholder="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target..."
                  />
                </div>

                {/* Test Cases */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
                      Test Cases *
                    </label>
                    <button
                      type="button"
                      onClick={addTestCase}
                      className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Test Case
                    </button>
                  </div>

                  <div className="space-y-3">
                    {problemForm.test_cases.map((tc, index) => (
                      <div
                        key={index}
                        className="bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium" style={{ color: "var(--text-sub)" }}>
                            Test Case #{index + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tc.is_sample}
                                onChange={(e) => updateTestCase(index, "is_sample", e.target.checked)}
                                className="accent-orange-500"
                              />
                              <span style={{ color: "var(--text-sub)" }}>Sample</span>
                            </label>
                            {problemForm.test_cases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTestCase(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider font-medium mb-1 block" style={{ color: "var(--text-sub)" }}>
                              Input
                            </label>
                            <textarea
                              value={tc.input}
                              onChange={(e) => updateTestCase(index, "input", e.target.value)}
                              className="w-full bg-[var(--bg-main)] border border-[var(--border-line)] rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-orange-500 min-h-16"
                              style={{ color: "var(--text-main)" }}
                              placeholder="[2,7,11,15]&#10;9"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wider font-medium mb-1 block" style={{ color: "var(--text-sub)" }}>
                              Expected Output
                            </label>
                            <textarea
                              value={tc.expected_output}
                              onChange={(e) => updateTestCase(index, "expected_output", e.target.value)}
                              className="w-full bg-[var(--bg-main)] border border-[var(--border-line)] rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-orange-500 min-h-16"
                              style={{ color: "var(--text-main)" }}
                              placeholder="[0,1]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boilerplates */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
                      Boilerplates * (must include {"{{USER_CODE}}"})
                    </label>
                    <div className="flex gap-1">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => addBoilerplate(lang)}
                          disabled={problemForm.boilerplates.find((b) => b.language === lang)}
                          className="text-xs px-2 py-1 rounded bg-[var(--bg-alt)] border border-[var(--border-line)] hover:border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          style={{ color: "var(--text-sub)" }}
                        >
                          + {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {problemForm.boilerplates.map((bp) => (
                      <div
                        key={bp.language}
                        className="bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-main)" }}>
                            {bp.language}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeBoilerplate(bp.language)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <textarea
                          value={bp.code}
                          onChange={(e) => updateBoilerplate(bp.language, e.target.value)}
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-line)] rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-orange-500 min-h-40"
                          style={{ color: "var(--text-main)" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProblemForm(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-line)] hover:border-red-400 transition"
                    style={{ color: "var(--text-sub)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProblem}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {submittingProblem && <Loader2 size={14} className="animate-spin" />}
                    Create Problem
                  </button>
                </div>
              </form>
            )}

            {/* Problems List */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-line)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-line)]">
                <h2 className="font-semibold">Existing Problems</h2>
              </div>

              {loadingProblems ? (
                <div className="flex items-center justify-center py-10 gap-2" style={{ color: "var(--text-sub)" }}>
                  <Loader2 size={16} className="animate-spin text-orange-500" />
                  Loading...
                </div>
              ) : problems.length === 0 ? (
                <div className="text-center py-10" style={{ color: "var(--text-sub)" }}>
                  No problems found. Create one above!
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-line)]">
                  {problems.map((problem) => (
                    <div
                      key={problem.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-alt)] transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium" style={{ color: "var(--text-main)" }}>
                          {problem.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getDifficultyColor(problem.difficulty)}`}
                        >
                          {problem.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => setDeleteConfirm(problem)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition"
                        title="Delete problem"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contests Tab */}
        {activeTab === "contests" && (
          <div>
            {/* Create Contest Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowContestForm(!showContestForm)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition"
              >
                {showContestForm ? <ChevronUp size={16} /> : <Plus size={16} />}
                {showContestForm ? "Hide Form" : "Create Contest"}
              </button>
            </div>

            {/* Contest Form */}
            {showContestForm && (
              <form
                onSubmit={handleSubmitContest}
                className="bg-[var(--bg-card)] border border-[var(--border-line)] rounded-xl p-6 mb-6"
              >
                <h2 className="text-lg font-bold mb-4">New Contest</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={contestForm.title}
                      onChange={(e) => setContestForm({ ...contestForm, title: e.target.value })}
                      className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      style={{ color: "var(--text-main)" }}
                      placeholder="Weekly Contest 1"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={contestForm.start_time}
                      onChange={(e) => setContestForm({ ...contestForm, start_time: e.target.value })}
                      className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      style={{ color: "var(--text-main)" }}
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-sub)" }}>
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={contestForm.end_time}
                      onChange={(e) => setContestForm({ ...contestForm, end_time: e.target.value })}
                      className="w-full bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      style={{ color: "var(--text-main)" }}
                    />
                  </div>
                </div>

                {/* Problem Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-sub)" }}>
                    Select Problems *
                  </label>

                  {/* Available problems */}
                  <div className="bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg p-3 mb-3 max-h-48 overflow-y-auto">
                    <p className="text-xs mb-2" style={{ color: "var(--text-sub)" }}>
                      Click to add problems to contest:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {problems
                        .filter((p) => !contestForm.problems.find((cp) => cp.id === p.id))
                        .map((problem) => (
                          <button
                            key={problem.id}
                            type="button"
                            onClick={() => addProblemToContest(problem)}
                            className="text-xs px-2 py-1 rounded border border-[var(--border-line)] hover:border-orange-400 transition flex items-center gap-1"
                            style={{ color: "var(--text-main)", background: "var(--bg-card)" }}
                          >
                            <Plus size={12} /> {problem.title}
                          </button>
                        ))}
                      {problems.filter((p) => !contestForm.problems.find((cp) => cp.id === p.id)).length === 0 && (
                        <span className="text-xs" style={{ color: "var(--text-sub)" }}>
                          {problems.length === 0 ? "No problems available. Create some first!" : "All problems added."}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selected problems */}
                  {contestForm.problems.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: "var(--text-sub)" }}>
                        Contest problems (set points for each):
                      </p>
                      {contestForm.problems.map((problem, index) => (
                        <div
                          key={problem.id}
                          className="flex items-center gap-3 bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2"
                        >
                          <span className="text-xs font-medium w-6" style={{ color: "var(--text-sub)" }}>
                            {index + 1}.
                          </span>
                          <span className="flex-1 text-sm" style={{ color: "var(--text-main)" }}>
                            {problem.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={problem.points}
                              onChange={(e) => updateProblemPoints(problem.id, e.target.value)}
                              className="w-16 bg-[var(--bg-main)] border border-[var(--border-line)] rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-orange-500"
                              style={{ color: "var(--text-main)" }}
                              min="1"
                            />
                            <span className="text-xs" style={{ color: "var(--text-sub)" }}>pts</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProblemFromContest(problem.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowContestForm(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-line)] hover:border-red-400 transition"
                    style={{ color: "var(--text-sub)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingContest}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {submittingContest && <Loader2 size={14} className="animate-spin" />}
                    Create Contest
                  </button>
                </div>
              </form>
            )}

            {/* Info card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-line)] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <Trophy className="text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Contest Management</h3>
                  <p className="text-sm" style={{ color: "var(--text-sub)" }}>
                    Create contests by selecting a start time, end time, and problems from the library.
                    Each problem in a contest has its own point value. Contests automatically transition
                    between upcoming, active, and ended states based on their scheduled times.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-line)] rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="text-red-400" size={20} />
                </div>
                <h3 className="font-bold text-lg">Delete Problem</h3>
              </div>
              <p className="text-sm mb-6" style={{ color: "var(--text-sub)" }}>
                Are you sure you want to delete &quot;{deleteConfirm.title}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-line)] hover:border-[var(--border-hover)] transition"
                  style={{ color: "var(--text-main)" }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProblem(deleteConfirm.id)}
                  disabled={deleting}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                >
                  {deleting && <Loader2 size={14} className="animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

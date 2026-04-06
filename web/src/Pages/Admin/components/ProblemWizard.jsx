import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight, ChevronLeft, Loader2, Info } from "lucide-react";
import { adminAPI } from "../../../api";
import { useToast } from "../../../components/Toast";

const LANGUAGES = ["python", "javascript", "c++", "java"];
const DIFFICULTIES = ["easy", "medium", "hard"];

export default function ProblemWizard({ initialData, onCancel, onSuccess }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState("python");

  const [form, setForm] = useState(
    initialData || {
      title: "",
      slug: "",
      description: "",
      difficulty: "easy",
      function_signature: "",
      time_limit_ms: 2000,
      memory_limit_kb: 262144,
      test_cases: [{ input: "", expected_output: "", is_sample: true }],
      boilerplates: [],
    }
  );

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setStep(4);
    }
  }, [initialData]);

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  };

  const updateForm = (updates) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const addTestCase = () => {
    updateForm({ test_cases: [...form.test_cases, { input: "", expected_output: "", is_sample: false }] });
  };

  const removeTestCase = (idx) => {
    if (form.test_cases.length <= 1) return;
    updateForm({ test_cases: form.test_cases.filter((_, i) => i !== idx) });
  };

  const updateTestCase = (idx, field, value) => {
    const updated = [...form.test_cases];
    updated[idx] = { ...updated[idx], [field]: value };
    updateForm({ test_cases: updated });
  };

  const getDefaultStarterCode = (lang) => {
    const templates = {
      python: `def solution():\n    # Your code here\n    pass`,
      javascript: `function solution() {\n    // Your code here\n}`,
      "c++": `class Solution {\npublic:\n    void solve() {\n        // Your code here\n    }\n};`,
      java: `class Solution {\n    public void solve() {\n        // Your code here\n    }\n}`,
    };
    return templates[lang] || "// Your code here";
  };

  const getDefaultWrapper = (lang) => {
    const templates = {
      python: `import sys\nimport json\n\ninput_data = sys.stdin.read().strip()\n# Parse input\n\n{{USER_CODE}}\n\nresult = solution()\nprint(json.dumps(result))`,
      javascript: `const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\n\nrl.on("line", (line) => lines.push(line.trim()));\nrl.on("close", () => {\n    // Parse input\n    {{USER_CODE}}\n    const result = solution();\n    console.log(JSON.stringify(result));\n});`,
      "c++": `#include <iostream>\nusing namespace std;\n\n{{USER_CODE}}\n\nint main() {\n    Solution sol;\n    sol.solve();\n    return 0;\n}`,
      java: `import java.util.*;\n\n{{USER_CODE}}\n\npublic class Main {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        sol.solve();\n    }\n}`,
    };
    return templates[lang] || "{{USER_CODE}}";
  };

  const getBoilerplate = (lang) => {
    const existing = form.boilerplates.find((b) => b.language === lang);
    if (existing) return existing;
    return { language: lang, starter_code: getDefaultStarterCode(lang), test_harness: getDefaultWrapper(lang) };
  };

  const updateBoilerplate = (lang, field, value) => {
    const existing = form.boilerplates.find((b) => b.language === lang);
    if (existing) {
      updateForm({ boilerplates: form.boilerplates.map((b) => (b.language === lang ? { ...b, [field]: value } : b)) });
    } else {
      const newBp = getBoilerplate(lang);
      newBp[field] = value;
      updateForm({ boilerplates: [...form.boilerplates, newBp] });
    }
  };

  const buildFinalBoilerplate = (lang) => {
    const bp = getBoilerplate(lang);
    return `====STARTER_CODE====\n${bp.starter_code || getDefaultStarterCode(lang)}\n====STARTER_CODE====\n\n${bp.test_harness || getDefaultWrapper(lang)}`;
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.title.trim() || !form.slug.trim() || !form.description.trim()) {
        toast("Title, slug, and description are required", "error");
        return false;
      }
    }
    if (step === 2) {
      if (!form.function_signature.trim()) {
        toast("Function signature is required", "error");
        return false;
      }
    }
    if (step === 3) {
      for (let i = 0; i < form.test_cases.length; i++) {
        if (!form.test_cases[i].input.trim() || !form.test_cases[i].expected_output.trim()) {
          toast(`Test case ${i + 1} needs input and output`, "error");
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    const finalBoilerplates = LANGUAGES.map((lang) => ({
      language: lang,
      code: buildFinalBoilerplate(lang),
    }));

    for (const bp of finalBoilerplates) {
      if (!bp.code.includes("{{USER_CODE}}")) {
        toast(`${bp.language} template missing {{USER_CODE}}`, "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      await adminAPI.createProblem({ ...form, boilerplates: finalBoilerplates });
      toast("Problem created", "success");
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create problem";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = ["Details", "Constraints", "Test Cases", "Templates"];

  return (
    <div className="max-w-2xl mb-12">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-[var(--text-main)]">{stepTitles[step - 1]}</h2>
          <span className="text-xs text-[var(--text-sub)]">Step {step} of 4</span>
        </div>
        <div className="flex gap-1 h-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 rounded-full transition ${s <= step ? "bg-orange-500" : "bg-[var(--border-line)]"}`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); if (validateStep()) setStep(s => s + 1); }}>
        
        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">Title</label>
              <input
                type="text"
                autoFocus
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value, slug: generateSlug(e.target.value) })}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition"
                placeholder="Two Sum"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">URL Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateForm({ slug: e.target.value })}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => updateForm({ difficulty: e.target.value })}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition"
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                className="w-full h-40 bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 transition resize-y"
                placeholder="Describe the problem (Markdown supported)"
              />
            </div>
          </div>
        )}

        {/* Step 2: Constraints */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">Time Limit (ms)</label>
                <input
                  type="number"
                  value={form.time_limit_ms}
                  onChange={(e) => updateForm({ time_limit_ms: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition"
                />
                <p className="text-xs text-[var(--text-sub)] mt-1">Default: 2000ms</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">Memory Limit (KB)</label>
                <input
                  type="number"
                  value={form.memory_limit_kb}
                  onChange={(e) => updateForm({ memory_limit_kb: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition"
                />
                <p className="text-xs text-[var(--text-sub)] mt-1">Default: 262144 KB (256 MB)</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">Function Signature</label>
              <input
                type="text"
                autoFocus
                value={form.function_signature}
                onChange={(e) => updateForm({ function_signature: e.target.value })}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-500 transition"
                placeholder="def twoSum(nums: List[int], target: int) -> List[int]:"
              />
              <p className="text-xs text-[var(--text-sub)] mt-1">Shown to users as a reference</p>
            </div>
          </div>
        )}

        {/* Step 3: Test Cases */}
        {step === 3 && (
          <div className="space-y-4">
            {form.test_cases.map((tc, idx) => (
              <div key={idx} className="border border-[var(--border-line)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--text-main)]">Test Case {idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tc.is_sample}
                        onChange={(e) => updateTestCase(idx, "is_sample", e.target.checked)}
                        className="accent-orange-500"
                      />
                      <span className="text-xs text-[var(--text-sub)]">Show as example</span>
                    </label>
                    {form.test_cases.length > 1 && (
                      <button type="button" onClick={() => removeTestCase(idx)} className="text-[var(--text-sub)] hover:text-red-500 transition">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-sub)] mb-1">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                      className="w-full h-20 bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg p-2 font-mono text-sm focus:outline-none focus:border-orange-500 transition resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-sub)] mb-1">Expected Output</label>
                    <textarea
                      value={tc.expected_output}
                      onChange={(e) => updateTestCase(idx, "expected_output", e.target.value)}
                      className="w-full h-20 bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg p-2 font-mono text-sm focus:outline-none focus:border-orange-500 transition resize-y"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTestCase}
              className="w-full py-2.5 border border-dashed border-[var(--border-hover)] rounded-lg text-sm text-[var(--text-sub)] hover:text-[var(--text-main)] hover:border-[var(--text-sub)] transition flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Add Test Case
            </button>
          </div>
        )}

        {/* Step 4: Templates */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3">
              <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--text-main)]">
                <p className="font-medium">Template Setup</p>
                <p className="text-[var(--text-sub)] text-xs mt-1">
                  <strong>Starter Code</strong> is shown to users. <strong>Test Wrapper</strong> is hidden and runs their code. Use <code className="bg-[var(--bg-alt)] px-1 rounded">{`{{USER_CODE}}`}</code> where user code gets inserted.
                </p>
              </div>
            </div>

            <div className="flex gap-1 border-b border-[var(--border-line)]">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-3 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                    activeLanguage === lang
                      ? "border-orange-500 text-[var(--text-main)]"
                      : "border-transparent text-[var(--text-sub)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {lang === "c++" ? "C++" : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-sub)] uppercase mb-2">Starter Code</label>
                <textarea
                  value={getBoilerplate(activeLanguage).starter_code || getDefaultStarterCode(activeLanguage)}
                  onChange={(e) => updateBoilerplate(activeLanguage, "starter_code", e.target.value)}
                  className="w-full h-64 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500/50"
                  spellCheck="false"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-sub)] uppercase mb-2">Test Wrapper</label>
                <textarea
                  value={getBoilerplate(activeLanguage).test_harness || getDefaultWrapper(activeLanguage)}
                  onChange={(e) => updateBoilerplate(activeLanguage, "test_harness", e.target.value)}
                  className="w-full h-64 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500/50"
                  spellCheck="false"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-line)]">
          <button
            type="button"
            onClick={() => {
              if (step === 1) onCancel();
              else setStep(s => s - 1);
            }}
            className="text-sm text-[var(--text-sub)] hover:text-[var(--text-main)] transition flex items-center gap-1"
          >
            {step === 1 ? "Cancel" : <><ChevronLeft size={16} /> Back</>}
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={14} />
            ) : step === 4 ? (
              "Create Problem"
            ) : (
              <>Next <ChevronRight size={14} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from "react";
import {
  Sparkles,
  Copy,
  CheckCircle2,
  Info,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import { generateAIPrompt } from "../utils/aiPromptGenerator";
import { parseAIOutput } from "../utils/aiOutputParser";
import { useToast } from "./Toast";

export default function AIAssistant({ onProblemGenerated }) {
  const [step, setStep] = useState(1); // 1: idea, 2: prompt & paste, 3: success
  const [problemIdea, setProblemIdea] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const toast = useToast();

  const handleGeneratePrompt = () => {
    if (!problemIdea.trim()) {
      toast("Please enter a problem idea", "error");
      return;
    }

    const prompt = generateAIPrompt(problemIdea);
    setGeneratedPrompt(prompt);
    setStep(2);
    setError("");
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopiedPrompt(true);
      toast("Prompt copied! Paste it into ChatGPT or Claude", "success");
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      toast("Failed to copy to clipboard", "error");
    }
  };

  const handleParseOutput = async () => {
    if (!aiOutput.trim()) {
      setError("Please paste the AI output first");
      return;
    }

    setParsing(true);
    setError("");

    try {
      const parsed = parseAIOutput(aiOutput);

      // Call the parent callback to fill the form
      onProblemGenerated(parsed);

      toast(
        "🎉 Problem generated successfully! Review and submit below.",
        "success",
      );

      // Reset for next use
      setProblemIdea("");
      setGeneratedPrompt("");
      setAiOutput("");
      setStep(1);
    } catch (err) {
      setError(err.message);
      toast(`Parse error: ${err.message}`, "error");
    } finally {
      setParsing(false);
    }
  };

  const handleReset = () => {
    setProblemIdea("");
    setGeneratedPrompt("");
    setAiOutput("");
    setError("");
    setStep(1);
  };

  return (
    <div className="bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-purple-500/10 border-2 border-purple-500/30 rounded-xl p-6 mb-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
            <Sparkles className="text-purple-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              AI Problem Generator
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Beta
              </span>
            </h2>
            <p className="text-xs" style={{ color: "var(--text-sub)" }}>
              Generate complete problems using ChatGPT, Claude, or any AI
            </p>
          </div>
        </div>

        {step > 1 && (
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-line)] hover:border-purple-400 transition"
            style={{ color: "var(--text-sub)" }}
          >
            Start Over
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`flex items-center gap-2 ${step >= 1 ? "text-purple-400" : "opacity-40"}`}
        >
          <div
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
              step >= 1
                ? "bg-purple-500/20 border-purple-500"
                : "border-gray-500"
            }`}
          >
            {step > 1 ? "✓" : "1"}
          </div>
          <span className="text-xs font-medium">Idea</span>
        </div>

        <div
          className={`h-px flex-1 ${step >= 2 ? "bg-purple-500" : "bg-gray-600"}`}
        ></div>

        <div
          className={`flex items-center gap-2 ${step >= 2 ? "text-purple-400" : "opacity-40"}`}
        >
          <div
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
              step >= 2
                ? "bg-purple-500/20 border-purple-500"
                : "border-gray-500"
            }`}
          >
            2
          </div>
          <span className="text-xs font-medium">AI Output</span>
        </div>
      </div>

      {/* Step 1: Problem Idea */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "var(--text-main)" }}
            >
              Describe your problem idea
            </label>
            <textarea
              value={problemIdea}
              onChange={(e) => setProblemIdea(e.target.value)}
              placeholder="Example: Create a problem where users find two numbers in an array that sum to a target value. Should be easy difficulty."
              className="w-full bg-[var(--bg-main)] border border-purple-500/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 min-h-32 resize-y"
              style={{ color: "var(--text-main)" }}
            />
            <p
              className="text-xs mt-2 flex items-start gap-1.5"
              style={{ color: "var(--text-sub)" }}
            >
              <Info size={12} className="flex-shrink-0 mt-0.5" />
              <span>
                Be specific about inputs, outputs, difficulty, and any special
                requirements. The AI will generate the complete problem
                including description, test cases, and boilerplates.
              </span>
            </p>
          </div>

          <button
            onClick={handleGeneratePrompt}
            disabled={!problemIdea.trim()}
            className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition shadow-lg shadow-purple-500/20"
          >
            <Wand2 size={16} />
            Generate AI Prompt
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Step 2: Copy Prompt & Paste Output */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Copy Prompt Section */}
          <div className="bg-[var(--bg-card)] border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  Copy this prompt
                </span>
              </div>
              <button
                onClick={handleCopyPrompt}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                  copiedPrompt
                    ? "bg-emerald-500 text-white"
                    : "bg-purple-500 hover:bg-purple-600 text-white"
                }`}
              >
                {copiedPrompt ? (
                  <>
                    <CheckCircle2 size={12} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy Prompt
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre
                className="bg-[var(--bg-main)] border border-[var(--border-line)] rounded-lg p-3 text-xs overflow-auto max-h-48 font-mono"
                style={{ color: "var(--text-sub)" }}
              >
                {generatedPrompt}
              </pre>
            </div>
          </div>

          {/* Paste Output Section */}
          <div className="bg-[var(--bg-card)] border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                Paste AI's JSON response here
              </span>
            </div>

            <textarea
              value={aiOutput}
              onChange={(e) => {
                setAiOutput(e.target.value);
                setError("");
              }}
              placeholder='Paste the complete JSON response from the AI here...\n\nExample:\n{\n  "title": "Two Sum",\n  "difficulty": "easy",\n  ...\n}'
              className="w-full bg-[var(--bg-main)] border border-purple-500/30 rounded-lg px-4 py-3 text-xs font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 min-h-64 resize-y"
              style={{ color: "var(--text-main)" }}
            />

            {error && (
              <div className="mt-3 flex items-start gap-2 text-xs bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <AlertTriangle
                  className="text-red-400 flex-shrink-0 mt-0.5"
                  size={14}
                />
                <div>
                  <p className="font-semibold text-red-400 mb-1">
                    Parsing Error
                  </p>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-line)] hover:border-purple-400 transition"
                style={{ color: "var(--text-sub)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleParseOutput}
                disabled={!aiOutput.trim() || parsing}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
              >
                {parsing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Parse & Fill Form
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { X, Loader2, Check, Search } from "lucide-react";
import { adminAPI } from "../../../api";
import { useToast } from "../../../components/Toast";

export default function ContestForm({ problems, onCancel, onSuccess }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  
  const [form, setForm] = useState({
    title: "",
    start_time: "",
    end_time: "",
    problems: [],
  });

  const getDifficultyColor = (diff) => {
    if (diff === "easy") return "text-emerald-500 bg-emerald-500/10";
    if (diff === "medium") return "text-amber-500 bg-amber-500/10";
    return "text-red-500 bg-red-500/10";
  };

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                           p.slug.toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty = difficultyFilter === "all" || p.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [problems, search, difficultyFilter]);

  const isProblemSelected = (id) => form.problems.some((p) => p.id === id);

  const toggleProblem = (problem) => {
    if (isProblemSelected(problem.id)) {
      setForm({
        ...form,
        problems: form.problems.filter((p) => p.id !== problem.id),
      });
    } else {
      setForm({
        ...form,
        problems: [...form.problems, { ...problem, points: 100 }],
      });
    }
  };

  const updatePoints = (problemId, points) => {
    setForm({
      ...form,
      problems: form.problems.map((p) =>
        p.id === problemId ? { ...p, points: parseInt(points) || 0 } : p
      ),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast("Title is required", "error");
      return;
    }
    if (!form.start_time) {
      toast("Start time is required", "error");
      return;
    }
    if (!form.end_time) {
      toast("End time is required", "error");
      return;
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      toast("End time must be after start time", "error");
      return;
    }
    if (form.problems.length === 0) {
      toast("Select at least one problem", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        problems: form.problems.map((p) => ({
          problem_id: p.id,
          points: p.points,
        })),
      };

      await adminAPI.createContest(payload);
      toast("Contest created", "success");
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create contest";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-[var(--text-main)]">New Contest</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[var(--text-sub)] hover:text-[var(--text-main)] transition"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">
            Title
          </label>
          <input
            type="text"
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition"
            placeholder="Weekly Challenge #1"
          />
        </div>

        {/* Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--text-main)]">
              End Time
            </label>
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition"
            />
          </div>
        </div>

        {/* Problem Selection */}
        <div className="pt-4 border-t border-[var(--border-line)]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[var(--text-main)]">
              Problems
            </label>
            {form.problems.length > 0 && (
              <span className="text-xs text-[var(--text-sub)]">
                {form.problems.length} selected
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Problem List with Search */}
            <div className="border border-[var(--border-line)] rounded-lg overflow-hidden">
              {/* Search & Filter */}
              <div className="p-3 border-b border-[var(--border-line)] bg-[var(--bg-alt)] space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search problems..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] rounded pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
                <div className="flex gap-1">
                  {["all", "easy", "medium", "hard"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficultyFilter(d)}
                      className={`px-2 py-1 text-xs rounded transition ${
                        difficultyFilter === d
                          ? "bg-[var(--text-main)] text-[var(--bg-main)]"
                          : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-line)]">
                {filteredProblems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[var(--text-sub)]">
                    {problems.length === 0 ? "No problems available" : "No matching problems"}
                  </div>
                ) : (
                  filteredProblems.map((problem) => {
                    const selected = isProblemSelected(problem.id);
                    return (
                      <button
                        key={problem.id}
                        type="button"
                        onClick={() => toggleProblem(problem)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                          selected ? "bg-orange-500/5" : "hover:bg-[var(--bg-alt)]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition ${
                          selected ? "bg-orange-500 border-orange-500 text-white" : "border-[var(--border-hover)]"
                        }`}>
                          {selected && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span className={`text-sm flex-1 truncate ${selected ? "text-orange-500" : "text-[var(--text-main)]"}`}>
                          {problem.title}
                        </span>
                        <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Selected Problems */}
            <div>
              <div className="text-xs font-medium text-[var(--text-sub)] uppercase mb-2">
                Selected ({form.problems.length})
              </div>
              
              {form.problems.length === 0 ? (
                <div className="border border-dashed border-[var(--border-hover)] rounded-lg h-32 flex items-center justify-center text-sm text-[var(--text-sub)]">
                  Select problems from the list
                </div>
              ) : (
                <div className="space-y-2">
                  {form.problems.map((problem, index) => (
                    <div
                      key={problem.id}
                      className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg px-3 py-2"
                    >
                      <span className="text-xs text-[var(--text-sub)] w-4">{index + 1}.</span>
                      <span className="text-sm text-[var(--text-main)] flex-1 truncate">
                        {problem.title}
                      </span>
                      <input
                        type="number"
                        value={problem.points}
                        onChange={(e) => updatePoints(problem.id, e.target.value)}
                        className="w-16 bg-[var(--bg-alt)] border border-[var(--border-line)] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-orange-500"
                        min="1"
                        title="Points"
                      />
                      <button
                        type="button"
                        onClick={() => toggleProblem(problem)}
                        className="text-[var(--text-sub)] hover:text-red-500 transition p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting || form.problems.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Create Contest
          </button>
        </div>
      </div>
    </form>
  );
}

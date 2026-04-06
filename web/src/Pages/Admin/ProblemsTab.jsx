import { useState, useMemo } from "react";
import { Plus, Trash2, Loader2, Upload, Search, X } from "lucide-react";
import AIAssistant from "../../components/AIAssistant";
import ProblemWizard from "./components/ProblemWizard";
import BulkAddModal from "./components/BulkAddModal";
import { problemAPI, adminAPI } from "../../api";
import { useToast } from "../../components/Toast";

const ITEMS_PER_PAGE = 10;

export default function ProblemsTab({ problems, loadingProblems, setProblems }) {
  const toast = useToast();
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [aiData, setAiData] = useState(null);
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter problems based on search and difficulty
  const filteredProblems = useMemo(() => {
    let result = problems;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
      );
    }
    
    if (difficultyFilter !== "all") {
      result = result.filter(p => p.difficulty === difficultyFilter);
    }
    
    return result;
  }, [problems, searchQuery, difficultyFilter]);

  // Paginate filtered results
  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProblems, currentPage]);

  // Reset to page 1 when filters change
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDifficultyFilter = (value) => {
    setDifficultyFilter(value);
    setCurrentPage(1);
  };

  const getDifficultyColor = (diff) => {
    if (diff === "easy") return "text-emerald-500";
    if (diff === "medium") return "text-amber-500";
    return "text-red-500";
  };

  const handleAIProblemGenerated = (data) => {
    setAiData(data);
    setShowProblemForm(true);
    setTimeout(() => {
      document.querySelector("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDeleteProblem = async (id) => {
    setDeleting(true);
    try {
      await adminAPI.deleteProblem(id);
      toast("Problem deleted", "success");
      setProblems(problems.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete problem";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  const onWizardSuccess = async () => {
    setShowProblemForm(false);
    setAiData(null);
    try {
      const res = await problemAPI.list({ page_size: 100 });
      setProblems(res.data.problems || []);
    } catch (err) {
      console.error(err);
    }
  };

  const onBulkAddSuccess = async () => {
    try {
      const res = await problemAPI.list({ page_size: 100 });
      setProblems(res.data.problems || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-12">
      <AIAssistant onProblemGenerated={handleAIProblemGenerated} />

      {!showProblemForm && (
        <div className="mb-6 flex justify-end gap-3">
          <button
            onClick={() => setShowBulkAdd(true)}
            className="text-[var(--text-sub)] hover:text-[var(--text-main)] px-4 py-2 text-sm font-medium flex items-center gap-2 transition"
          >
            <Upload size={16} />
            Bulk Import
          </button>
          <button
            onClick={() => setShowProblemForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <Plus size={16} />
            Add Problem
          </button>
        </div>
      )}

      {showProblemForm && (
        <ProblemWizard
          initialData={aiData}
          onCancel={() => {
            setShowProblemForm(false);
            setAiData(null);
          }}
          onSuccess={onWizardSuccess}
        />
      )}

      <BulkAddModal
        isOpen={showBulkAdd}
        onClose={() => setShowBulkAdd(false)}
        onSuccess={onBulkAddSuccess}
      />

      {/* Problems List */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-lg font-medium text-[var(--text-main)]">
          All Problems
          {filteredProblems.length !== problems.length && (
            <span className="text-sm font-normal text-[var(--text-sub)] ml-2">
              ({filteredProblems.length} of {problems.length})
            </span>
          )}
        </h2>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by title or slug..."
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-[var(--border-line)] bg-[var(--bg-card)] text-[var(--text-main)] placeholder:text-[var(--text-sub)] focus:outline-none focus:border-orange-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text-main)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        <div className="flex gap-1 p-1 bg-[var(--bg-alt)] rounded-lg">
          {["all", "easy", "medium", "hard"].map((diff) => (
            <button
              key={diff}
              onClick={() => handleDifficultyFilter(diff)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                difficultyFilter === diff
                  ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              {diff === "all" ? "All" : diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="border border-[var(--border-line)] rounded-lg overflow-hidden">
        {loadingProblems ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[var(--text-sub)]">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : paginatedProblems.length === 0 ? (
          <div className="text-center py-16">
            {problems.length === 0 ? (
              <>
                <p className="text-[var(--text-sub)] mb-1">No problems yet</p>
                <p className="text-sm text-[var(--text-sub)]">Click "Add Problem" to create one</p>
              </>
            ) : (
              <>
                <p className="text-[var(--text-sub)] mb-1">No problems match your search</p>
                <button
                  onClick={() => { setSearchQuery(""); setDifficultyFilter("all"); }}
                  className="text-sm text-orange-500 hover:text-orange-600"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--bg-alt)] border-b border-[var(--border-line)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-sub)] uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-sub)] uppercase tracking-wide hidden sm:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-sub)] uppercase tracking-wide w-24">Difficulty</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-line)]">
              {paginatedProblems.map((problem) => (
                <tr key={problem.id} className="hover:bg-[var(--bg-alt)] transition group">
                  <td className="px-4 py-3">
                    <span className="font-medium text-[var(--text-main)] text-sm truncate block max-w-xs">
                      {problem.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs text-[var(--text-sub)] bg-[var(--bg-alt)] px-1.5 py-0.5 rounded">
                      {problem.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium uppercase ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteConfirm(problem)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-sub)] hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-[var(--text-sub)]">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-line)] text-[var(--text-main)] hover:border-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-line)] text-[var(--text-main)] hover:border-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-line)] rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-medium text-lg text-[var(--text-main)] mb-2">Delete Problem</h3>
            <p className="text-sm text-[var(--text-sub)] mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.title}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-[var(--border-line)] hover:bg-[var(--bg-alt)] transition"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProblem(deleteConfirm.id)}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

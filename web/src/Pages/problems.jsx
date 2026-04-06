import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { problemAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import Pagination from "../components/Pagination";

export default function Problems() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [problems, setProblems] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchProblems = async () => {
      setLoading(true);
      try {
        const params = { page: currentPage, page_size: 20 };
        if (difficulty) params.difficulty = difficulty;
        const res = await problemAPI.list(params);
        setProblems(res.data.problems || []);
        setMetadata(res.data.metadata || null);
      } catch (err) {
        console.error("Failed to fetch problems:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [isLoggedIn, difficulty, currentPage]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
            <span className="text-3xl">💡</span>
          </div>
          <p className="text-xl font-bold mb-2" style={{ color: "var(--text-main)" }}>Ready to Practice?</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-sub)" }}>
            Sign in to access hundreds of coding problems and track your progress
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 px-8 py-3 rounded-lg hover:bg-orange-600 active:scale-[0.98] transition-all duration-150 text-white font-semibold shadow-sm"
          >
            Sign In to Start
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyInfo = (diff) => {
    const d = diff?.toLowerCase();
    if (d === "easy") return { color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Easy" };
    if (d === "medium") return { color: "text-amber-500", bg: "bg-amber-500/10", label: "Medium" };
    return { color: "text-red-500", bg: "bg-red-500/10", label: "Hard" };
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-4 sm:px-6 py-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Problems</h1>

          <div className="flex gap-4 flex-wrap mt-4 sm:mt-0">
            {["", "easy", "medium", "hard"].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  setCurrentPage(1);
                }}
                className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                  difficulty === d
                    ? "text-orange-500"
                    : "hover:text-orange-400"
                }`}
                style={difficulty !== d ? { color: "var(--text-sub)" } : {}}
              >
                {d === "" ? "All" : d}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-6">
            <div className="w-full h-12 mb-4 bg-[var(--bg-alt)] animate-pulse rounded-md border border-[var(--border-line)]"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-16 bg-[var(--bg-card)] animate-pulse border-b border-[var(--border-line)] last:border-b-0 flex items-center px-4">
                <div className="w-8 h-4 bg-[var(--bg-alt)] rounded mr-4"></div>
                <div className="w-1/3 h-5 bg-[var(--bg-alt)] rounded mr-auto"></div>
                <div className="w-20 h-4 bg-[var(--bg-alt)] rounded"></div>
              </div>
            ))}
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-32" style={{ color: "var(--text-sub)" }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-alt)] flex items-center justify-center">
              <span className="text-3xl">📚</span>
            </div>
            <p className="text-lg font-bold mb-2" style={{ color: "var(--text-main)" }}>No problems yet</p>
            <p className="text-sm">
              {difficulty 
                ? `No ${difficulty} problems available. Try selecting "All" to see all problems.`
                : "Check back soon — new problems are being added!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left border-b-2 border-[var(--border-line)]" style={{ color: "var(--text-sub)" }}>
                <tr>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs w-20">#</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs">Title</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs w-32">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem, index) => {
                  const diffInfo = getDifficultyInfo(problem.difficulty);
                  return (
                    <tr
                      key={problem.id}
                      onClick={() => navigate(`/problems/${problem.slug}`)}
                      className="border-b border-[var(--border-line)] cursor-pointer transition-colors duration-150 last:border-b-0 group hover:bg-[var(--bg-alt)]"
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && navigate(`/problems/${problem.slug}`)}
                    >
                      <td className="px-4 py-6 font-semibold" style={{ color: "var(--text-sub)" }}>
                        {((metadata?.current_page || 1) - 1) * 20 + index + 1}
                      </td>
                      <td className="px-4 py-6 font-bold group-hover:text-orange-500 transition-colors" style={{ color: "var(--text-main)" }}>
                        {problem.title}
                      </td>
                      <td className="px-4 py-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${diffInfo.color} ${diffInfo.bg}`}>
                          {diffInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination metadata={metadata} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
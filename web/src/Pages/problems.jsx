import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { problemAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Problems() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchProblems = async () => {
      setLoading(true);
      try {
        const params = {};
        if (difficulty) params.difficulty = difficulty;
        const res = await problemAPI.list(params);
        setProblems(res.data.problems || []);
      } catch (err) {
        console.error("Failed to fetch problems:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [isLoggedIn, difficulty]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Please sign in to view problems</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 px-6 py-2 rounded hover:bg-orange-600 transition text-white font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (diff) => {
    const d = diff?.toLowerCase();
    if (d === "easy") return "text-green-400";
    if (d === "medium") return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Problems</h1>

          <div className="flex gap-2">
            {["", "easy", "medium", "hard"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  difficulty === d
                    ? "bg-orange-500 text-white"
                    : "bg-[var(--bg-card)] border border-[var(--border-line)] hover:border-orange-400"
                }`}
                style={difficulty !== d ? { color: "var(--text-sub)" } : {}}
              >
                {d === "" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3" style={{ color: "var(--text-sub)" }}>
            <Loader2 size={20} className="animate-spin text-orange-500" />
            Loading problems...
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--text-sub)" }}>
            No problems found. Ask an admin to create some!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-[var(--border-line)] rounded-lg overflow-hidden shadow-lg">
              <thead className="bg-[var(--bg-header-start)] text-left border-b border-[var(--border-line)]" style={{ color: "var(--text-sub)" }}>
                <tr>
                  <th className="p-4 border-r border-[var(--border-line)] w-16">#</th>
                  <th className="p-4 border-r border-[var(--border-line)]">Title</th>
                  <th className="p-4 w-32">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem, index) => (
                  <tr
                    key={problem.id}
                    onClick={() => navigate(`/problems/${problem.slug}`)}
                    className="border-b border-[var(--border-line)] hover:bg-[var(--bg-alt)] cursor-pointer transition-colors duration-300"
                  >
                    <td className="p-4 font-semibold border-r border-[var(--border-line)]" style={{ color: "var(--text-sub)" }}>
                      {index + 1}
                    </td>
                    <td className="p-4 font-medium border-r border-[var(--border-line)]" style={{ color: "var(--text-main)" }}>
                      {problem.title}
                    </td>
                    <td className={`p-4 font-semibold ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
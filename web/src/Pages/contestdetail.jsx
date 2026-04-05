import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { contestAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Trophy, Clock, ArrowLeft, Play, Loader2 } from "lucide-react";

export default function ContestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const toast = useToast();

  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState("problems");

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchContest = async () => {
      try {
        const res = await contestAPI.getByID(id);
        setContest(res.data.contest);
        setProblems(res.data.problems || []);

        // Also fetch leaderboard.
        const lbRes = await contestAPI.leaderboard(id);
        setLeaderboard(lbRes.data.leaderboard || []);
      } catch (err) {
        console.error("Failed to fetch contest:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [id, isLoggedIn]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await contestAPI.join(id);
      toast("Joined contest successfully!", "success");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to join";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setJoining(false);
    }
  };

  const getDifficultyColor = (diff) => {
    const d = diff?.toLowerCase();
    if (d === "easy") return "text-emerald-400 bg-emerald-400/10";
    if (d === "medium") return "text-yellow-400 bg-yellow-400/10";
    return "text-red-400 bg-red-400/10";
  };

  const getStatusColor = (status) => {
    if (status === "active") return "text-emerald-400 bg-emerald-400/10 border-emerald-500/30";
    if (status === "upcoming") return "text-blue-400 bg-blue-400/10 border-blue-500/30";
    return "text-red-400 bg-red-400/10 border-red-500/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center gap-3">
        <Loader2 className="animate-spin text-orange-500" size={24} />
        <span style={{ color: "var(--text-sub)" }}>Loading contest...</span>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center">
        Contest not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-8 max-w-5xl mx-auto transition-colors duration-300">
      {/* Back button */}
      <button
        onClick={() => navigate("/contests")}
        className="flex items-center gap-2 text-sm mb-6 hover:text-orange-400 transition"
        style={{ color: "var(--text-sub)" }}
      >
        <ArrowLeft size={16} /> Back to Contests
      </button>

      {/* Contest header */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg mb-8">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-orange-500" size={24} />
              <h1 className="text-2xl font-bold">{contest.title}</h1>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${getStatusColor(contest.status)}`}>
              {contest.status}
            </span>
          </div>
          {(contest.status === "active" || contest.status === "upcoming") && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {joining ? "Joining..." : contest.status === "active" ? "Join & Compete" : "Register"}
            </button>
          )}
        </div>

        <div className="flex gap-6 text-sm" style={{ color: "var(--text-sub)" }}>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>
              Start: {new Date(contest.start_time).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>End: {new Date(contest.end_time).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {["problems", "leaderboard"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t
                ? "bg-orange-500 text-white"
                : "bg-[var(--bg-card)] border border-[var(--border-line)] hover:border-orange-400"
            }`}
            style={tab !== t ? { color: "var(--text-sub)" } : {}}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Problems tab */}
      {tab === "problems" && (
        <div>
          {problems.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--text-sub)" }}>
              {contest.status === "upcoming"
                ? "Problems will be revealed when the contest starts."
                : "No problems found."}
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] overflow-hidden shadow-lg">
              <table className="w-full text-left">
                <thead
                  className="text-sm border-b border-[var(--border-line)]"
                  style={{ backgroundColor: "var(--bg-header-start)", color: "var(--text-sub)" }}
                >
                  <tr>
                    <th className="p-4 font-medium">#</th>
                    <th className="p-4 font-medium">Problem</th>
                    <th className="p-4 font-medium">Difficulty</th>
                    <th className="p-4 font-medium text-right">Points</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-line)]">
                  {problems.map((p, i) => (
                    <tr key={p.problem_id} className="hover:bg-[var(--bg-alt)] transition">
                      <td className="p-4 font-semibold" style={{ color: "var(--text-sub)" }}>
                        {i + 1}
                      </td>
                      <td className="p-4 font-medium" style={{ color: "var(--text-main)" }}>
                        {p.title}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${getDifficultyColor(p.difficulty)}`}>
                          {p.difficulty?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-orange-400">{p.points}</td>
                      <td className="p-4 text-right">
                        {contest.status === "active" && (
                          <button
                            onClick={() =>
                              navigate(`/problems/${p.slug}?contest_id=${id}`)
                            }
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ml-auto"
                          >
                            <Play size={12} /> Solve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard tab */}
      {tab === "leaderboard" && (
        <div>
          {leaderboard.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--text-sub)" }}>
              No submissions yet. Be the first!
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] overflow-hidden shadow-lg">
              <table className="w-full text-left">
                <thead
                  className="text-sm border-b border-[var(--border-line)]"
                  style={{ backgroundColor: "var(--bg-header-start)", color: "var(--text-sub)" }}
                >
                  <tr>
                    <th className="p-4 pl-6 font-medium">Rank</th>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium text-right pr-6">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-line)]">
                  {leaderboard.map((entry) => (
                    <tr key={entry.user_id} className="hover:bg-[var(--bg-alt)] transition">
                      <td className="p-4 pl-6 font-semibold" style={{ color: "var(--text-sub)" }}>
                        <span
                          className={
                            entry.rank <= 3
                              ? entry.rank === 1
                                ? "text-yellow-400"
                                : entry.rank === 2
                                ? "text-gray-300"
                                : "text-amber-600"
                              : ""
                          }
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="p-4 font-medium flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${entry.username}`}
                          className="w-8 h-8 rounded-full"
                          alt=""
                        />
                        <div className="flex flex-col">
                          <span style={{ color: "var(--text-main)" }}>{entry.display_name}</span>
                          <span className="text-xs" style={{ color: "var(--text-sub)" }}>
                            @{entry.username}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6 font-bold text-orange-400">
                        {entry.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

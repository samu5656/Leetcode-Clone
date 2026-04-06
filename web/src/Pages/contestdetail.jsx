import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { contestAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Trophy, Clock, ArrowLeft, Play, Loader2, CheckCircle, Timer } from "lucide-react";

export default function ContestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const toast = useToast();

  const [contest, setContest] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
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
        setIsJoined(res.data.is_joined || false);
        setProblems(res.data.problems || []);

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
      toast("You're in! Good luck!", "success");
      
      // Refetch contest data to update is_joined status from backend
      const res = await contestAPI.getByID(id);
      setIsJoined(res.data.is_joined || false);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to join";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setJoining(false);
    }
  };

  const getDifficultyInfo = (diff) => {
    const d = diff?.toLowerCase();
    if (d === "easy") return { color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Easy" };
    if (d === "medium") return { color: "text-amber-500", bg: "bg-amber-500/10", label: "Medium" };
    return { color: "text-red-500", bg: "bg-red-500/10", label: "Hard" };
  };

  const getStatusColor = (status) => {
    if (status === "active") return "text-[var(--bg-main)] bg-emerald-500";
    if (status === "upcoming") return "text-[var(--bg-main)] bg-blue-500";
    return "text-[var(--bg-main)] bg-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center gap-3" role="status" aria-label="Loading contest">
        <Loader2 className="animate-spin text-orange-500" size={24} aria-hidden="true" />
        <span style={{ color: "var(--text-sub)" }}>Loading contest...</span>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center gap-4">
        <Trophy className="w-12 h-12 text-orange-500/50" aria-hidden="true" />
        <p className="text-lg font-bold">Contest not found</p>
        <button
          onClick={() => navigate("/contests")}
          className="text-orange-500 hover:underline"
        >
          Back to all contests
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-8 max-w-5xl mx-auto transition-colors duration-300">
      <button
        onClick={() => navigate("/contests")}
        className="flex items-center gap-2 text-sm mb-6 hover:text-orange-400 transition"
        style={{ color: "var(--text-sub)" }}
        aria-label="Back to contests list"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to Contests
      </button>

      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg mb-8">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-orange-500" size={24} aria-hidden="true" />
              <h1 className="text-2xl font-bold">{contest.title}</h1>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${getStatusColor(contest.status)}`}>
              {contest.status}
            </span>
          </div>
          {(contest.status === "active" || contest.status === "upcoming") && !isJoined && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              aria-busy={joining}
            >
              {joining && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {joining ? "Joining..." : contest.status === "active" ? "Join & Compete" : "Register"}
            </button>
          )}
          {isJoined && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <CheckCircle size={20} className="text-emerald-400" aria-hidden="true" />
              <span className="text-emerald-400 font-semibold">Joined</span>
            </div>
          )}
        </div>

        <div className="flex gap-6 text-sm flex-wrap" style={{ color: "var(--text-sub)" }}>
          <div className="flex items-center gap-1.5">
            <Clock size={14} aria-hidden="true" />
            <span>
              <span className="sr-only">Starts at </span>
              Start: {new Date(contest.start_time).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer size={14} aria-hidden="true" />
            <span>
              <span className="sr-only">Ends at </span>
              End: {new Date(contest.end_time).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8" role="tablist" aria-label="Contest sections">
        {["problems", "leaderboard"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`${t}-panel`}
            className={`px-2 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${tab === t
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-gray-500 hover:text-orange-400"
              }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "problems" && (
        <div id="problems-panel" role="tabpanel" aria-labelledby="problems-tab">
          {problems.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--text-sub)" }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Timer className="w-8 h-8 text-orange-500" aria-hidden="true" />
              </div>
              <p className="text-lg font-bold mb-2" style={{ color: "var(--text-main)" }}>
                {contest.status === "upcoming" ? "Coming Soon" : "No Problems"}
              </p>
              <p className="text-sm max-w-sm mx-auto">
                {contest.status === "upcoming"
                  ? "Problems will be revealed when the contest starts. Register now to get notified!"
                  : "No problems have been added to this contest yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" role="grid">
                <thead className="text-sm border-b-2 border-[var(--border-line)]" style={{ color: "var(--text-sub)" }}>
                  <tr>
                    <th scope="col" className="p-4 font-bold uppercase tracking-wider text-xs">#</th>
                    <th scope="col" className="p-4 font-bold uppercase tracking-wider text-xs">Problem</th>
                    <th scope="col" className="p-4 font-bold uppercase tracking-wider text-xs">Difficulty</th>
                    <th scope="col" className="p-4 font-bold uppercase tracking-wider text-xs text-right">Points</th>
                    <th scope="col" className="p-4 font-bold uppercase tracking-wider text-xs text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((p, i) => {
                    const diffInfo = getDifficultyInfo(p.difficulty);
                    return (
                      <tr
                        key={p.problem_id}
                        className="hover:bg-[var(--bg-alt)] transition border-b border-[var(--border-line)] last:border-b-0 group cursor-pointer"
                        onClick={() => contest.status === "active" && navigate(`/problems/${p.slug}?contest_id=${id}`)}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && contest.status === "active") {
                            e.preventDefault();
                            navigate(`/problems/${p.slug}?contest_id=${id}`);
                          }
                        }}
                        tabIndex={contest.status === "active" ? 0 : -1}
                        role="row"
                      >
                        <td className="p-4 py-6 font-semibold" style={{ color: "var(--text-sub)" }}>
                          {p.is_completed ? (
                            <CheckCircle size={16} className="text-emerald-500" aria-label="Completed" />
                          ) : (
                            i + 1
                          )}
                        </td>
                        <td className="p-4 py-6 font-bold group-hover:text-orange-500 transition-colors" style={{ color: "var(--text-main)" }}>
                          <div className="flex items-center gap-2">
                            {p.title}
                            {p.is_completed && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                Solved
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 py-6">
                          <span className={`text-xs font-bold tracking-widest uppercase px-2 py-1 rounded ${diffInfo.color} ${diffInfo.bg}`}>
                            {diffInfo.label}
                          </span>
                        </td>
                        <td className="p-4 py-6 text-right font-bold text-orange-500 text-lg">{p.points}</td>
                        <td className="p-4 py-6 text-right">
                          {contest.status === "active" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/problems/${p.slug}?contest_id=${id}`);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-[var(--bg-main)] text-sm font-bold uppercase tracking-wider px-4 py-2 rounded transition flex items-center gap-1.5 ml-auto"
                              aria-label={`Solve ${p.title}`}
                            >
                              <Play size={14} aria-hidden="true" /> Solve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "leaderboard" && (
        <div id="leaderboard-panel" role="tabpanel" aria-labelledby="leaderboard-tab">
          {leaderboard.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--text-sub)" }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-yellow-500" aria-hidden="true" />
              </div>
              <p className="text-lg font-bold mb-2" style={{ color: "var(--text-main)" }}>Be the First!</p>
              <p className="text-sm max-w-sm mx-auto">
                No submissions yet. Solve a problem to claim the top spot!
              </p>
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] overflow-hidden shadow-lg">
              <table className="w-full text-left" role="grid">
                <thead
                  className="text-sm border-b border-[var(--border-line)]"
                  style={{ backgroundColor: "var(--bg-header-start)", color: "var(--text-sub)" }}
                >
                  <tr>
                    <th scope="col" className="p-4 pl-6 font-medium">Rank</th>
                    <th scope="col" className="p-4 font-medium">User</th>
                    <th scope="col" className="p-4 font-medium text-right pr-6">Score</th>
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
                          alt={`${entry.display_name}'s avatar`}
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

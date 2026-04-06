import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contestAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Trophy, CalendarDays, Loader2 } from "lucide-react";
import Pagination from "../components/Pagination";

// Helper component for dynamic countdown.
function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft("Ongoing or Ended");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className="font-mono text-orange-400 font-bold">{timeLeft}</span>
  );
}

export default function Contests() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const [contests, setContests] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [joinedIds, setJoinedIds] = useState(new Set());

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchContests = async () => {
      try {
        const res = await contestAPI.list({ page: currentPage, page_size: 20 });
        setContests(res.data.contests || []);
        setMetadata(res.data.metadata || null);
      } catch (err) {
        console.error("Failed to fetch contests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, [isLoggedIn, currentPage]);

  const handleJoin = async (contestId, shouldNavigate = false) => {
    setJoiningId(contestId);
    try {
      await contestAPI.join(contestId);
      setJoinedIds(prev => new Set([...prev, contestId]));
      toast("Joined! Good luck!", "success");
      if (shouldNavigate) {
        navigate(`/contests/${contestId}`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to join contest";
      // If already joined, still navigate
      if (msg === "already joined" || (typeof msg === "string" && msg.includes("already"))) {
        setJoinedIds(prev => new Set([...prev, contestId]));
        if (shouldNavigate) {
          navigate(`/contests/${contestId}`);
        }
      } else {
        toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
      }
    } finally {
      setJoiningId(null);
    }
  };

  const upcoming = contests.filter((c) => c.status === "upcoming");
  const active = contests.filter((c) => c.status === "active");
  const ended = contests.filter((c) => c.status === "ended");

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-orange-500" />
          <p className="text-xl mb-2" style={{ color: "var(--text-main)" }}>Please sign in to view contests</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-sub)" }}>Compete with others and climb the leaderboard</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 px-8 py-3 rounded-lg hover:bg-orange-600 active:scale-[0.98] transition-all duration-150 text-white font-semibold shadow-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center gap-3 px-4">
        <Loader2 className="animate-spin text-orange-500" size={28} />
        <span className="text-base" style={{ color: 'var(--text-sub)' }}>Loading contests...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-4 sm:px-6 py-12 max-w-7xl mx-auto transition-colors duration-300">
      <div className="flex items-center gap-3 mb-10">
        <Trophy className="text-orange-500 w-8 h-8" />
        <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--text-main)" }}>
          Contests
        </h1>
      </div>

      {/* Active Contests */}
      {active.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--text-main)" }}>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Active</span> Now
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {active.map((contest) => (
              <div
                key={contest.id}
                className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-line)] hover:border-emerald-500/50 shadow-sm transition-all duration-300 flex flex-col group"
              >
                <div className="flex flex-col h-full">
                  <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--text-main)" }}>
                    {contest.title}
                  </h3>
                  <p className="text-sm mb-6" style={{ color: "var(--text-sub)" }}>
                    Ends: {new Date(contest.end_time).toLocaleString()}
                  </p>
                  <div className="flex gap-3 mt-auto">
                    {joinedIds.has(contest.id) ? (
                      <button
                        onClick={() => navigate(`/contests/${contest.id}`)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold py-3 rounded-lg transition-all duration-150 shadow-sm"
                      >
                        Enter Contest
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(contest.id, true)}
                        disabled={joiningId === contest.id}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold py-3 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {joiningId === contest.id ? "Joining..." : "Join & Compete"}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/contests/${contest.id}`)}
                      className="px-6 rounded-lg hover:border-orange-400 transition-all duration-150 border border-[var(--border-line)]"
                      style={{ color: "var(--text-sub)", background: "var(--bg-alt)" }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-main)" }}>
            <CalendarDays size={20} style={{ color: "var(--text-sub)" }} /> Upcoming Contests
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {upcoming.map((contest) => (
              <div
                key={contest.id}
                className="bg-[var(--bg-card)] rounded-xl p-8 border border-[var(--border-line)] hover:border-blue-500/50 shadow-sm transition-all duration-300 flex flex-col group"
              >
                <div className="flex flex-col h-full">
                  <h3 className="text-2xl font-bold mb-5" style={{ color: "var(--text-main)" }}>
                    {contest.title}
                  </h3>
                  <p
                    className="text-sm w-fit px-4 py-2 rounded-lg border border-[var(--border-line)] mb-6"
                    style={{ color: "var(--text-main)", background: "var(--bg-alt)" }}
                  >
                    Starts in: <CountdownTimer targetDate={contest.start_time} />
                  </p>
                  {joinedIds.has(contest.id) ? (
                    <div className="w-full py-3 rounded-lg mt-auto border border-emerald-500/30 bg-emerald-500/10 text-center">
                      <span className="text-emerald-400 font-semibold">Registered</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(contest.id)}
                      disabled={joiningId === contest.id}
                      className="w-full font-semibold py-3 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-auto border border-[var(--border-line)] hover:border-orange-400 hover:text-orange-400 active:scale-[0.98]"
                      style={{ color: "var(--text-main)", background: "var(--bg-alt)" }}
                    >
                      {joiningId === contest.id ? "Registering..." : "Register"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Past Contests */}
      {ended.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--text-main)" }}>
            Past Contests
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead
                className="text-sm border-b-2 border-[var(--border-line)]"
                style={{ color: "var(--text-sub)" }}
              >
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Contest</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Date</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {ended.map((contest) => (
                  <tr key={contest.id} onClick={() => navigate(`/contests/${contest.id}`)} className="border-b border-[var(--border-line)] hover:bg-[var(--bg-alt)] transition cursor-pointer group last:border-b-0">
                    <td className="p-4 py-6 font-bold group-hover:text-orange-500 transition" style={{ color: "var(--text-main)" }}>
                      {contest.title}
                    </td>
                    <td className="p-4 py-6 text-sm font-medium" style={{ color: "var(--text-sub)" }}>
                      {new Date(contest.end_time).toLocaleDateString()}
                    </td>
                    <td className="p-4 py-6 text-sm">
                      <span className="text-red-500 font-bold uppercase tracking-wider text-xs">
                        Ended
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {contests.length === 0 && (
        <div className="text-center py-32 px-4" style={{ color: "var(--text-sub)" }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-orange-500" aria-hidden="true" />
          </div>
          <p className="text-lg font-bold mb-2" style={{ color: "var(--text-main)" }}>No contests scheduled</p>
          <p className="text-sm max-w-sm mx-auto">
            New contests are added regularly. Check back soon for upcoming challenges!
          </p>
        </div>
      )}

      <Pagination metadata={metadata} onPageChange={setCurrentPage} />
    </div>
  );
}

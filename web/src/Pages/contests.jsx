import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contestAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Trophy, CalendarDays, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchContests = async () => {
      try {
        const res = await contestAPI.list({ page_size: 50 });
        setContests(res.data.contests || []);
      } catch (err) {
        console.error("Failed to fetch contests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, [isLoggedIn]);

  const handleJoin = async (contestId) => {
    setJoiningId(contestId);
    try {
      await contestAPI.join(contestId);
      toast("Joined contest successfully!", "success");
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to join contest";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setJoiningId(null);
    }
  };

  const upcoming = contests.filter((c) => c.status === "upcoming");
  const active = contests.filter((c) => c.status === "active");
  const ended = contests.filter((c) => c.status === "ended");

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Please sign in to view contests</p>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center gap-3">
        <Loader2 className="animate-spin text-orange-500" size={24} />
        <span style={{ color: 'var(--text-sub)' }}>Loading contests...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-10 max-w-7xl mx-auto transition-colors duration-300">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="text-orange-500 w-8 h-8" />
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-main)" }}>
          Contests
        </h1>
      </div>

      {/* Active Contests */}
      {active.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-main)" }}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Active Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {active.map((contest) => (
              <div
                key={contest.id}
                className="bg-[var(--bg-card)] rounded-xl p-6 border border-emerald-500/30 shadow-lg hover:border-emerald-500/60 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition bg-emerald-500" />
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-main)" }}>
                    {contest.title}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "var(--text-sub)" }}>
                    Ends: {new Date(contest.end_time).toLocaleString()}
                  </p>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => handleJoin(contest.id)}
                      disabled={joiningId === contest.id}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
                    >
                      {joiningId === contest.id ? "Joining..." : "Join & Compete"}
                    </button>
                    <button
                      onClick={() => navigate(`/contests/${contest.id}`)}
                      className="px-4 rounded-lg hover:border-orange-400 transition border border-[var(--border-line)]"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {upcoming.map((contest) => (
              <div
                key={contest.id}
                className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-line)] shadow-lg hover:border-[var(--border-hover)] transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition bg-blue-500" />
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--text-main)" }}>
                    {contest.title}
                  </h3>
                  <p
                    className="text-sm w-fit px-3 py-1 rounded-full border border-[var(--border-line)] mb-4"
                    style={{ color: "var(--text-main)", background: "var(--bg-alt)" }}
                  >
                    Starts in: <CountdownTimer targetDate={contest.start_time} />
                  </p>
                  <button
                    onClick={() => handleJoin(contest.id)}
                    disabled={joiningId === contest.id}
                    className="w-full font-semibold py-2.5 rounded-lg transition disabled:opacity-50 mt-auto border border-[var(--border-line)] hover:border-orange-400 hover:text-orange-400"
                    style={{ color: "var(--text-main)", background: "var(--bg-alt)" }}
                  >
                    {joiningId === contest.id ? "Registering..." : "Register"}
                  </button>
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
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] overflow-hidden transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead
                  className="text-sm border-b border-[var(--border-line)]"
                  style={{ backgroundColor: "var(--bg-header-start)", color: "var(--text-sub)" }}
                >
                  <tr>
                    <th className="p-5 font-medium">Contest</th>
                    <th className="p-5 font-medium">Date</th>
                    <th className="p-5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-line)]">
                  {ended.map((contest) => (
                    <tr key={contest.id} onClick={() => navigate(`/contests/${contest.id}`)} className="hover:bg-[var(--bg-alt)] transition cursor-pointer">
                      <td className="p-5 font-medium hover:text-orange-400 transition" style={{ color: "var(--text-main)" }}>
                        {contest.title}
                      </td>
                      <td className="p-5 text-sm" style={{ color: "var(--text-sub)" }}>
                        {new Date(contest.end_time).toLocaleDateString()}
                      </td>
                      <td className="p-5 text-sm">
                        <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs font-semibold">
                          Ended
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {contests.length === 0 && (
        <div className="text-center py-20" style={{ color: "var(--text-sub)" }}>
          No contests found. Check back soon!
        </div>
      )}
    </div>
  );
}

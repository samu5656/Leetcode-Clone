import { useState, useEffect } from "react";
import { leaderboardAPI } from "../api";
import { Trophy, Medal, Search, Loader2 } from "lucide-react";

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await leaderboardAPI.global({ page_size: 50 });
        setEntries(res.data.leaderboard || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const filtered = search
    ? entries.filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.display_name.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const getMedalColor = (rank) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "";
  };

  const getAvatar = (username) =>
    `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

  // Only show podium when NOT searching and we have 3+ entries
  const showPodium = !search && filtered.length >= 3;
  const top3 = showPodium ? filtered.slice(0, 3) : [];
  const tableEntries = showPodium ? filtered.slice(3) : filtered;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center gap-3">
        <Loader2 className="animate-spin text-orange-500" size={24} />
        <span style={{ color: "var(--text-sub)" }}>Loading leaderboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-10 max-w-7xl mx-auto transition-colors duration-300">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-500 w-8 h-8" />
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-main)" }}>
            Global Ranking
          </h1>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] text-sm rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:border-orange-400 transition"
            style={{ color: "var(--text-main)" }}
          />
          <Search
            className="absolute left-3 top-2.5 w-5 h-5"
            style={{ color: "var(--text-sub)" }}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-sub)" }}>
          No rankings yet. Be the first to solve a problem!
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-sub)" }}>
          No users found matching "{search}"
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {showPodium && (
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-16">
              {/* Rank 2 */}
              <div className="flex flex-col items-center bg-[var(--bg-alt)] border border-[var(--border-line)] p-6 rounded-t-lg w-full md:w-64 h-56 relative shadow-lg">
                <div className="absolute -top-8 bg-[var(--bg-card)] rounded-full p-1 border-4 border-[var(--bg-main)]">
                  <img src={getAvatar(top3[1].username)} alt={top3[1].username} className="w-16 h-16 rounded-full" />
                </div>
                <Medal className={`w-8 h-8 ${getMedalColor(2)} mt-8`} />
                <span className="font-bold text-lg mt-2" style={{ color: "var(--text-main)" }}>{top3[1].display_name}</span>
                <span className="text-sm" style={{ color: "var(--text-sub)" }}>
                  {top3[1].score} points
                </span>
                <span className="text-2xl font-black absolute bottom-4 opacity-10" style={{ color: "var(--text-main)" }}>2</span>
              </div>

              {/* Rank 1 */}
              <div className="flex flex-col items-center bg-[var(--bg-card)] border border-yellow-500/50 p-6 rounded-t-lg w-full md:w-72 h-64 relative shadow-2xl z-10 scale-105">
                <div className="absolute -top-10 bg-yellow-500 rounded-full p-1 border-4 border-[var(--bg-main)] shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                  <img src={getAvatar(top3[0].username)} alt={top3[0].username} className="w-20 h-20 rounded-full" />
                </div>
                <Trophy className={`w-10 h-10 ${getMedalColor(1)} mt-10 drop-shadow-md`} />
                <span className="font-bold text-xl mt-2" style={{ color: "var(--text-main)" }}>{top3[0].display_name}</span>
                <span className="text-orange-400 font-semibold">{top3[0].score} points</span>
                <span className="text-3xl font-black absolute bottom-4 opacity-10" style={{ color: "var(--text-main)" }}>1</span>
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center bg-[var(--bg-alt)] border border-[var(--border-line)] p-6 rounded-t-lg w-full md:w-64 h-52 relative shadow-lg">
                <div className="absolute -top-8 bg-[var(--bg-card)] rounded-full p-1 border-4 border-[var(--bg-main)]">
                  <img src={getAvatar(top3[2].username)} alt={top3[2].username} className="w-16 h-16 rounded-full" />
                </div>
                <Medal className={`w-8 h-8 ${getMedalColor(3)} mt-8`} />
                <span className="font-bold text-lg mt-2" style={{ color: "var(--text-main)" }}>{top3[2].display_name}</span>
                <span className="text-sm" style={{ color: "var(--text-sub)" }}>
                  {top3[2].score} points
                </span>
                <span className="text-2xl font-black absolute bottom-4 opacity-10" style={{ color: "var(--text-main)" }}>3</span>
              </div>
            </div>
          )}

          {/* Rankings Table */}
          {tableEntries.length > 0 && (
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] overflow-hidden shadow-xl transition-colors duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-sm border-b border-[var(--border-line)]" style={{ backgroundColor: "var(--bg-header-start)", color: "var(--text-sub)" }}>
                    <tr>
                      <th className="p-4 pl-6 font-medium">Rank</th>
                      <th className="p-4 font-medium">User</th>
                      <th className="p-4 font-medium text-right pr-6">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-line)]">
                    {tableEntries.map((user) => (
                      <tr key={user.user_id} className="hover:bg-[var(--bg-alt)] transition">
                        <td className="p-4 pl-6 font-semibold">
                          <span className={getMedalColor(user.rank)} style={!getMedalColor(user.rank) ? { color: "var(--text-sub)" } : {}}>
                            #{user.rank}
                          </span>
                        </td>
                        <td className="p-4 font-medium flex items-center gap-3">
                          <img
                            src={getAvatar(user.username)}
                            className="w-8 h-8 rounded-full"
                            style={{ background: "var(--bg-alt)" }}
                            alt="avatar"
                          />
                          <div className="flex flex-col">
                            <span className="hover:text-orange-400 cursor-pointer transition" style={{ color: "var(--text-main)" }}>
                              {user.display_name}
                            </span>
                            <span className="text-xs" style={{ color: "var(--text-sub)" }}>
                              @{user.username}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right pr-6 font-bold text-orange-400">
                          {user.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

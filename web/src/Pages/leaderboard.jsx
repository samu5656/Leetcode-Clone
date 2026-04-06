import { useState, useEffect } from "react";
import { leaderboardAPI } from "../api";
import { Trophy, Medal, Search, Loader2 } from "lucide-react";
import Pagination from "../components/Pagination";

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await leaderboardAPI.global({ page: currentPage, page_size: 20 });
        setEntries(res.data.leaderboard || []);
        setMetadata(res.data.metadata || null);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentPage]);

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

  const showPodium = !search && filtered.length >= 3 && currentPage === 1;
  const top3 = showPodium ? filtered.slice(0, 3) : [];
  const tableEntries = showPodium ? filtered.slice(3) : filtered;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center gap-3" role="status" aria-label="Loading leaderboard">
        <Loader2 className="animate-spin text-orange-500" size={24} aria-hidden="true" />
        <span style={{ color: "var(--text-sub)" }}>Loading leaderboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-10 max-w-7xl mx-auto transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-500 w-8 h-8" aria-hidden="true" />
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-main)" }}>
            Global Ranking
          </h1>
        </div>

        <div className="relative w-full md:w-72">
          <label htmlFor="leaderboard-search" className="sr-only">Search users</label>
          <input
            id="leaderboard-search"
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
            aria-hidden="true"
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-sub)" }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-yellow-500" aria-hidden="true" />
          </div>
          <p className="text-lg font-bold mb-2" style={{ color: "var(--text-main)" }}>Be the First!</p>
          <p className="text-sm max-w-sm mx-auto">
            No one has solved a problem yet. Start practicing and claim the top spot!
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--text-sub)" }}>
          <p className="text-lg font-bold mb-2" style={{ color: "var(--text-main)" }}>No results</p>
          <p className="text-sm">No users found matching "{search}". Try a different search.</p>
        </div>
      ) : (
        <>
          {showPodium && (
            <div className="flex flex-col md:flex-row justify-center items-end gap-12 mb-20 mt-10" role="list" aria-label="Top 3 users">
              <div className="flex flex-col items-center w-full md:w-48 relative" role="listitem">
                <div className="rounded-full p-1 border-4 border-gray-300 z-10">
                  <img src={getAvatar(top3[1].username)} alt={`${top3[1].display_name}'s avatar`} className="w-20 h-20 rounded-full bg-[var(--bg-alt)]" />
                </div>
                <span className="font-bold text-xl mt-4 text-center" style={{ color: "var(--text-main)" }}>{top3[1].display_name}</span>
                <span className="text-sm font-semibold mt-1" style={{ color: "var(--text-sub)" }}>
                  {top3[1].score} points
                </span>
                <span className="sr-only">Rank 2</span>
              </div>

              <div className="flex flex-col items-center w-full md:w-56 relative z-10 md:-mb-8" role="listitem">
                <div className="rounded-full p-1 border-4 border-yellow-400 z-10 relative">
                  <img src={getAvatar(top3[0].username)} alt={`${top3[0].display_name}'s avatar`} className="w-28 h-28 rounded-full bg-[var(--bg-card)]" />
                  <div className="bg-yellow-400 rounded-full p-2 absolute -bottom-3 left-1/2 -translate-x-1/2 border-4 border-[var(--bg-main)]">
                    <Trophy className="w-5 h-5 text-[var(--bg-main)]" aria-hidden="true" />
                  </div>
                </div>
                <span className="font-bold text-3xl mt-8 text-center" style={{ color: "var(--text-main)" }}>{top3[0].display_name}</span>
                <span className="text-orange-500 font-bold text-xl mt-1">{top3[0].score} points</span>
                <span className="sr-only">Rank 1</span>
              </div>

              <div className="flex flex-col items-center w-full md:w-48 relative" role="listitem">
                <div className="rounded-full p-1 border-4 border-amber-600 z-10">
                  <img src={getAvatar(top3[2].username)} alt={`${top3[2].display_name}'s avatar`} className="w-20 h-20 rounded-full bg-[var(--bg-alt)]" />
                </div>
                <span className="font-bold text-xl mt-4 text-center" style={{ color: "var(--text-main)" }}>{top3[2].display_name}</span>
                <span className="text-sm font-semibold mt-1" style={{ color: "var(--text-sub)" }}>
                  {top3[2].score} points
                </span>
                <span className="sr-only">Rank 3</span>
              </div>
            </div>
          )}

          {tableEntries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left" role="grid">
                <thead className="text-sm border-b-2 border-[var(--border-line)]" style={{ color: "var(--text-sub)" }}>
                  <tr>
                    <th scope="col" className="p-4 pl-6 font-bold uppercase tracking-wider text-xs">Rank</th>
                    <th scope="col" className="p-4 font-bold uppercase tracking-wider text-xs">User</th>
                    <th scope="col" className="p-4 font-bold uppercase tracking-wider text-xs text-right pr-6">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {tableEntries.map((user) => (
                    <tr key={user.user_id} className="hover:bg-[var(--bg-alt)] border-b border-[var(--border-line)] last:border-b-0 transition group">
                      <td className="p-4 py-8 pl-6 font-bold text-lg">
                        <span className={getMedalColor(user.rank)} style={!getMedalColor(user.rank) ? { color: "var(--text-sub)" } : {}}>
                          #{user.rank}
                        </span>
                      </td>
                      <td className="p-4 py-8 font-medium flex items-center gap-4">
                        <img
                          src={getAvatar(user.username)}
                          className="w-10 h-10 rounded-full"
                          style={{ background: "var(--bg-alt)" }}
                          alt={`${user.display_name}'s avatar`}
                        />
                        <div className="flex flex-col">
                          <span className="group-hover:text-orange-500 font-bold transition text-base" style={{ color: "var(--text-main)" }}>
                            {user.display_name}
                          </span>
                          <span className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
                            @{user.username}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 py-8 text-right pr-6 font-bold text-orange-400 text-lg">
                        {user.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!search && <Pagination metadata={metadata} onPageChange={setCurrentPage} />}
        </>
      )}
    </div>
  );
}

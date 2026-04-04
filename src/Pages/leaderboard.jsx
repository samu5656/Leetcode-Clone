import { topUsers } from "../components/mock/leaderboard";
import { Trophy, Medal, Star, Search } from "lucide-react";

export default function Leaderboard() {
  const top3 = topUsers.slice(0, 3);
  const rest = topUsers.slice(3);

  // Helper to color medals
  const getMedalColor = (rank) => {
    if (rank === 1) return "text-yellow-400"; // Gold
    if (rank === 2) return "text-gray-300";   // Silver
    if (rank === 3) return "text-amber-600";  // Bronze
    return "text-gray-500";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-10 max-w-7xl mx-auto transition-colors duration-300">
      
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-500 w-8 h-8" />
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>Global Ranking</h1>
        </div>
        
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search username" 
            className="w-full bg-[var(--bg-card)] border border-[var(--border-line)] text-sm rounded-full py-2.5 pl-10 pr-4 focus:outline-none transition"
            style={{ color: 'var(--text-main)' }}
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5" style={{ color: 'var(--text-sub)' }} />
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-16">
        {/* Rank 2 */}
        <div className="flex flex-col items-center bg-[var(--bg-alt)] border border-[var(--border-line)] p-6 rounded-t-lg w-full md:w-64 h-56 relative shadow-lg">
          <div className="absolute -top-8 bg-[var(--bg-card)] rounded-full p-1 border-4 border-[var(--bg-main)]">
            <img src={top3[1].avatar} alt={top3[1].username} className="w-16 h-16 rounded-full" />
          </div>
          <Medal className={`w-8 h-8 ${getMedalColor(2)} mt-8`} />
          <span className="font-bold text-lg mt-2">{top3[1].username}</span>
          <span className="text-sm" style={{ color: 'var(--text-sub)' }}>{top3[1].rating} rating</span>
          <span className="text-2xl font-black absolute bottom-4 opacity-10">2</span>
        </div>

        {/* Rank 1 */}
        <div className="flex flex-col items-center bg-[var(--bg-card)] border border-yellow-500/50 p-6 rounded-t-lg w-full md:w-72 h-64 relative shadow-2xl z-10 scale-105">
          <div className="absolute -top-10 bg-yellow-500 rounded-full p-1 border-4 border-[var(--bg-main)] shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            <img src={top3[0].avatar} alt={top3[0].username} className="w-20 h-20 rounded-full" />
          </div>
          <Trophy className={`w-10 h-10 ${getMedalColor(1)} mt-10 drop-shadow-md`} />
          <span className="font-bold text-xl mt-2">{top3[0].username}</span>
          <span className="text-orange-400 font-semibold">{top3[0].rating} rating</span>
          <span className="text-3xl font-black absolute bottom-4 opacity-10">1</span>
        </div>

        {/* Rank 3 */}
        <div className="flex flex-col items-center bg-[var(--bg-alt)] border border-[var(--border-line)] p-6 rounded-t-lg w-full md:w-64 h-52 relative shadow-lg">
          <div className="absolute -top-8 bg-[var(--bg-card)] rounded-full p-1 border-4 border-[var(--bg-main)]">
            <img src={top3[2].avatar} alt={top3[2].username} className="w-16 h-16 rounded-full" />
          </div>
          <Medal className={`w-8 h-8 ${getMedalColor(3)} mt-8`} />
          <span className="font-bold text-lg mt-2">{top3[2].username}</span>
          <span className="text-sm" style={{ color: 'var(--text-sub)' }}>{top3[2].rating} rating</span>
          <span className="text-2xl font-black absolute bottom-4 opacity-10">3</span>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] overflow-hidden shadow-xl transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm border-b border-[var(--border-line)]" style={{ backgroundColor: 'var(--bg-header-start)', color: 'var(--text-sub)' }}>
              <tr>
                <th className="p-4 pl-6 font-medium">Rank</th>
                <th className="p-4 font-medium flex items-center gap-2">User</th>
                <th className="p-4 font-medium text-right">Rating</th>
                <th className="p-4 font-medium text-right">Problems Solved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-line)]">
              {rest.map((user) => (
                <tr key={user.rank} className="hover:bg-[var(--bg-alt)] transition">
                  <td className="p-4 pl-6 font-semibold" style={{ color: 'var(--text-sub)' }}>{user.rank}</td>
                  <td className="p-4 font-medium flex items-center gap-3">
                    <img src={user.avatar} className="w-8 h-8 rounded-full bg-gray-200" alt="avatar" />
                    <span className="hover:text-orange-400 cursor-pointer transition">{user.username}</span>
                  </td>
                  <td className="p-4 text-right font-semibold" style={{ color: 'var(--text-sub)' }}>{user.rating}</td>
                  <td className="p-4 text-right pr-6" style={{ color: 'var(--text-sub)' }}>{user.problemsSolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

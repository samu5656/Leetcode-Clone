import { profileData, generateHeatmapData } from "../components/mock/profile";
import { Medal, Activity, Code, Star, Flame, Terminal } from "lucide-react";
import { useMemo } from "react";

export default function Profile() {
  const heatmap = useMemo(() => generateHeatmapData(), []);

  // Helper to color the heatmap blocks based on activity level
  const getHeatmapColor = (level) => {
    switch(level) {
      case 1: return "bg-orange-900/40 border border-orange-900/50";
      case 2: return "bg-orange-700/60 border border-orange-700/60";
      case 3: return "bg-orange-500/80 border border-orange-500/80";
      case 4: return "bg-orange-400 border border-orange-400";
      default: return "bg-[var(--bg-alt)] border border-[var(--border-line)]";
    }
  };

  const getDifficultyColor = (diff) => {
    if (diff === "Easy" || diff === "EASY") return "text-emerald-400 bg-emerald-400/10";
    if (diff === "Medium" || diff === "MEDIUM") return "text-yellow-400 bg-yellow-400/10";
    return "text-red-400 bg-red-400/10";
  };

  const getDifficultyBgColor = (diff) => {
    if (diff === "Easy") return "bg-emerald-400";
    if (diff === "Medium") return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <div className="min-h-screen pt-4 pb-12 px-6 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6">
      
      {/* Left Column */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        
        {/* User Monolithic Card */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 flex flex-col items-center text-center shadow-lg transition-colors duration-300">
           <div className="relative mb-4">
             <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-orange-400 to-orange-600 p-1">
                <img src={profileData.avatar} alt={profileData.username} className="w-full h-full object-cover rounded-xl bg-[var(--bg-card)]" />
             </div>
             <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
               LVL {profileData.level}
             </span>
           </div>
           
           <h1 className="text-2xl font-bold mt-4" style={{ color: 'var(--text-main)' }}>{profileData.username}</h1>
           <p className="text-sm mt-1" style={{ color: 'var(--text-sub)' }}>{profileData.title} • {profileData.location}</p>

           <div className="flex gap-4 mt-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-line)] flex items-center justify-center text-yellow-500">
                 <Medal size={20} />
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-line)] flex items-center justify-center text-emerald-400">
                 <Activity size={20} />
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-line)] flex items-center justify-center text-orange-400">
                 <Terminal size={20} />
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-line)] flex items-center justify-center text-blue-400">
                 <Code size={20} />
              </div>
           </div>
        </div>

        {/* Global Ranking Card */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg transition-colors duration-300 relative overflow-hidden">
           <div className="absolute right-4 top-4 opacity-10 text-[var(--text-main)]">
              <Star size={80} />
           </div>
           
           <h2 className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--text-sub)' }}>Global Ranking</h2>
           
           <div className="flex items-end gap-3 mb-2">
             <span className="text-4xl font-extrabold text-orange-400">#{profileData.rank.toLocaleString()}</span>
             <span className="text-sm font-semibold text-emerald-400 mb-1">↑ 2.4%</span>
           </div>
           <p className="text-xs mb-8" style={{ color: 'var(--text-sub)' }}>Top {profileData.topPercent} of {profileData.activeDevelopers} active developers</p>

           <div className="flex justify-between text-sm mb-2 font-medium" style={{ color: 'var(--text-sub)' }}>
             <span>Rating</span>
             <span style={{ color: 'var(--text-main)' }}>{profileData.rating.toLocaleString()}</span>
           </div>
           <div className="w-full h-2 bg-[var(--bg-alt)] rounded-full overflow-hidden flex">
             <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400" style={{ width: '85%' }}></div>
           </div>
        </div>

      </div>

      {/* Right Column */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Solved Problems */}
          <div className="flex-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg transition-colors duration-300">
             <div className="flex justify-between items-start mb-6">
               <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-sub)' }}>Solved Problems</h2>
               <div className="text-right">
                 <span className="text-3xl font-extrabold block" style={{ color: 'var(--text-main)' }}>{profileData.solved.total}</span>
                 <span className="text-xs" style={{ color: 'var(--text-sub)' }}>TOTAL SUBMISSIONS</span>
               </div>
             </div>

             <div className="space-y-4">
                {['easy', 'medium', 'hard'].map((diff) => {
                  const data = profileData.solved[diff];
                  const percentage = (data.current / data.total) * 100;
                  const TitleCase = diff.charAt(0).toUpperCase() + diff.slice(1);
                  return (
                    <div key={diff}>
                       <div className="flex justify-between text-sm mb-1.5">
                         <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDifficultyColor(TitleCase)}`}>{TitleCase}</span>
                         <span className="font-medium" style={{ color: 'var(--text-main)' }}>{data.current} <span style={{ color: 'var(--text-sub)' }}>/ {data.total}</span></span>
                       </div>
                       <div className="w-full h-1.5 bg-[var(--bg-alt)] rounded-full overflow-hidden">
                         <div className={`h-full ${getDifficultyBgColor(TitleCase)}`} style={{ width: `${percentage}%` }}></div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Daily Streak */}
          <div className="w-full md:w-64 flex flex-col gap-4">
             <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-5 shadow-lg flex items-center justify-between transition-colors duration-300">
                <div>
                   <h2 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--text-sub)' }}>Daily Streak</h2>
                   <div className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>{profileData.streak.current} Days</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex flex-col items-center justify-center text-orange-500">
                   <Flame size={24} />
                </div>
             </div>

             <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-4 shadow-lg flex justify-between items-center transition-colors duration-300">
                <span className="text-sm" style={{ color: 'var(--text-sub)' }}>Max Streak</span>
                <span className="font-bold" style={{ color: 'var(--text-main)' }}>{profileData.streak.max}</span>
             </div>
             
             <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-4 shadow-lg flex justify-between items-center transition-colors duration-300">
                <span className="text-sm" style={{ color: 'var(--text-sub)' }}>Active Days</span>
                <span className="font-bold" style={{ color: 'var(--text-main)' }}>{profileData.streak.activeDays}</span>
             </div>
          </div>
        </div>

        {/* Coding Activity Heatmap */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg transition-colors duration-300">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-sub)' }}>Coding Activity</h2>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-sub)' }}>
                 <span>Less</span>
                 <div className="flex gap-1">
                   {[0,1,2,3,4].map(l => <div key={l} className={`w-3 h-3 rounded-[2px] ${getHeatmapColor(l)}`}></div>)}
                 </div>
                 <span>More</span>
              </div>
           </div>
           
           <div className="overflow-x-auto pb-4">
              <div className="flex gap-1" style={{ width: 'max-content' }}>
                 {heatmap.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                       {week.map((level, dIdx) => (
                          <div 
                            key={dIdx} 
                            className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColor(level)} hover:ring-1 hover:ring-gray-400 cursor-pointer transition-all`}
                            title={`${level} contributions`}
                          ></div>
                       ))}
                    </div>
                 ))}
              </div>
           </div>

           <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-sub)' }}>
              <span>{profileData.contributionsCount.toLocaleString()} contributions in the last year</span>
              <span>Aug 2023 - Aug 2024</span>
           </div>
        </div>

        {/* Recently Solved */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] shadow-lg overflow-hidden transition-colors duration-300">
           <div className="p-5 border-b border-[var(--border-line)] flex justify-between items-center">
              <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-sub)' }}>Recently Solved</h2>
              <button className="text-orange-500 text-sm font-semibold hover:underline">View All</button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-header-start)] border-b border-[var(--border-line)]">
                   <tr style={{ color: 'var(--text-sub)' }}>
                     <th className="p-4 font-medium">Problem Title</th>
                     <th className="p-4 font-medium">Difficulty</th>
                     <th className="p-4 font-medium">Time</th>
                     <th className="p-4 font-medium">Memory</th>
                     <th className="p-4 font-medium">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-line)]">
                   {profileData.recentSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-[var(--bg-alt)] transition cursor-pointer">
                         <td className="p-4 font-semibold" style={{ color: 'var(--text-main)' }}>{sub.title}</td>
                         <td className="p-4">
                           <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${getDifficultyColor(sub.difficulty)}`}>
                              {sub.difficulty}
                           </span>
                         </td>
                         <td className="p-4 font-mono text-xs" style={{ color: 'var(--text-sub)' }}>{sub.time}</td>
                         <td className="p-4 font-mono text-xs" style={{ color: 'var(--text-sub)' }}>{sub.memory}</td>
                         <td className="p-4 flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${sub.status === 'Solved' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                           <span style={{ color: sub.status === 'Solved' ? 'rgb(16 185 129)' : 'rgb(239 68 68)' }}>{sub.status}</span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { upcomingContests, pastContests } from "../components/mock/contests";
import { Trophy, CalendarDays, Users } from "lucide-react";

// Helper component for dynamic countdown
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
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="font-mono text-orange-400 font-bold">{timeLeft}</span>;
}

export default function Contests() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-6 py-10 max-w-7xl mx-auto transition-colors duration-300">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="text-orange-500 w-8 h-8" />
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>Contests</h1>
      </div>

      {/* Hero Section: Upcoming Contests */}
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
        <CalendarDays size={20} style={{ color: 'var(--text-sub)' }} /> Upcoming Contests
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {upcomingContests.map((contest, idx) => (
          <div 
            key={contest.id} 
            className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-line)] shadow-lg hover:border-[var(--border-hover)] transition-all duration-300 relative overflow-hidden group"
          >
            {/* Background design elements */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition ${
              contest.type === 'Weekly' ? 'bg-blue-500' : 'bg-purple-500'
            }`}></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold transition" style={{ color: 'var(--text-main)' }}>{contest.title}</h3>
              </div>

              <div className="space-y-3 mb-6 flex-grow">
                <p className="text-sm bg-black/30 w-fit px-3 py-1 rounded-full border border-[var(--border-line)]" style={{ color: 'var(--text-main)' }}>
                  Starts in: <CountdownTimer targetDate={contest.startTime} />
                </p>
                <div className="flex items-center gap-4 text-sm mt-4" style={{ color: 'var(--text-sub)' }}>
                  <div className="flex flex-col">
                    <span className="mb-1">Registration</span>
                    <span className="font-semibold" style={{ color: 'var(--text-main)' }}>{contest.registered} Registered</span>
                  </div>
                </div>
              </div>
              
              <button className="w-full bg-gray-300 hover:bg-gray-200 text-black font-semibold py-2.5 rounded-lg transition">
                Register
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Past Contests Section */}
      <h2 className="text-xl font-semibold mb-6">Past Contests</h2>
      
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm border-b border-[var(--border-line)]" style={{ backgroundColor: 'var(--bg-header-start)', color: 'var(--text-sub)' }}>
              <tr>
                <th className="p-5 font-medium">Contest</th>
                <th className="p-5 font-medium">Date</th>
                <th className="p-5 font-medium">Participants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-line)]">
              {pastContests.map((contest) => (
                <tr key={contest.id} className="hover:bg-[var(--bg-alt)] transition cursor-pointer">
                  <td className="p-5 font-medium hover:text-orange-400 transition" style={{ color: 'var(--text-main)' }}>
                    {contest.title}
                  </td>
                  <td className="p-5 text-sm" style={{ color: 'var(--text-sub)' }}>{contest.date}</td>
                  <td className="p-5 text-sm flex items-center gap-1.5" style={{ color: 'var(--text-sub)' }}>
                    <Users size={16} /> {contest.participants}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}

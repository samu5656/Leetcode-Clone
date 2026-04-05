import { useNavigate } from "react-router-dom";
import { ArrowRight, Code, Trophy, Users } from "lucide-react";
import bgimage from "../assets/code-landing.jpg";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="text-[var(--text-main)] transition-colors duration-300">

      <div className="relative h-screen w-full overflow-hidden">

        <img
          src={bgimage}
          alt="Code background"
          className="absolute w-full h-full object-cover"
          style={{ opacity: 0.08 }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-main)]/60 to-[var(--bg-main)]"></div>

        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-4">

          <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-[var(--border-line)] bg-[var(--bg-card)]/60 backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
              Open Source Coding Platform
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
            Ready to evolve
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              your stack?
            </span>
          </h1>

          <p className="mb-8 max-w-xl text-lg" style={{ color: "var(--text-sub)" }}>
            Practice DSA, compete in contests, and become a better developer.
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
            >
              Start Coding Now <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate("/problems")}
              className="px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition border border-[var(--border-line)] hover:border-orange-400"
              style={{ color: "var(--text-main)", background: "var(--bg-card)" }}
            >
              Browse Problems
            </button>
          </div>

          {/* Feature highlights */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
            {[
              { icon: <Code size={24} />, title: "8+ Languages", desc: "Python, C++, Go, Rust & more" },
              { icon: <Trophy size={24} />, title: "Live Contests", desc: "Compete in real-time challenges" },
              { icon: <Users size={24} />, title: "Leaderboard", desc: "Climb the global rankings" },
            ].map((feat) => (
              <div
                key={feat.title}
                className="p-5 rounded-xl border border-[var(--border-line)] bg-[var(--bg-card)]/60 backdrop-blur-sm hover:border-orange-400/50 transition text-center"
              >
                <div className="text-orange-400 mb-3 flex justify-center">{feat.icon}</div>
                <h3 className="font-bold text-sm mb-1">{feat.title}</h3>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
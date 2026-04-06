import { useNavigate } from "react-router-dom";
import { ArrowRight, Code, Trophy, Users, Sparkles } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center min-h-screen px-6 md:px-12 lg:px-24 pb-20 text-[var(--text-main)] transition-colors duration-300">
      
      <div className="max-w-5xl w-full mx-auto md:mx-0 mt-32">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-2 h-2 bg-orange-500 rounded-full" aria-hidden="true"></span>
          <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--accent)" }}>
            Interview Prep Made Simple
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-none tracking-tight">
          Build confidence,
          <br />
          <span style={{ color: "var(--accent)" }}>
            ace interviews.
          </span>
        </h1>

        <p className="mb-12 max-w-xl text-xl leading-relaxed" style={{ color: "var(--text-sub)" }}>
          Practice data structures and algorithms at your own pace. 
          Track your progress and feel prepared for technical interviews.
        </p>

        <div className="flex gap-6 flex-wrap mb-32">
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-150 shadow-sm"
          >
            Start Practicing <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button
            onClick={() => navigate("/problems")}
            className="px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-150 border border-transparent hover:border-[var(--border-line)] active:scale-[0.98]"
            style={{ color: "var(--text-main)", background: "var(--bg-alt)" }}
          >
            Browse Problems
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-4xl">
          {[
            { icon: <Code size={28} aria-hidden="true" />, title: "8+ Languages", desc: "Python, C++, Java, JavaScript & more" },
            { icon: <Trophy size={28} aria-hidden="true" />, title: "Live Contests", desc: "Test yourself under real interview pressure" },
            { icon: <Users size={28} aria-hidden="true" />, title: "Track Progress", desc: "See your improvement over time" },
          ].map((feat) => (
            <div key={feat.title} className="flex flex-col items-start group">
              <div className="mb-5 text-orange-500 transform group-hover:-translate-y-1 transition-transform duration-200">{feat.icon}</div>
              <h3 className="font-bold text-xl mb-2">{feat.title}</h3>
              <p className="text-base leading-relaxed" style={{ color: "var(--text-sub)" }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
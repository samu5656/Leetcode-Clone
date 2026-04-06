import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
          <Compass className="w-10 h-10 text-orange-500" aria-hidden="true" />
        </div>
        <div className="text-7xl font-black bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold mb-2">Looks like you're lost</h1>
        <p className="mb-8 text-sm leading-relaxed" style={{ color: "var(--text-sub)" }}>
          No worries! Even the best problem solvers take wrong turns sometimes.
          Let's get you back on track.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--border-line)] hover:border-orange-400 transition text-sm font-medium shadow-sm"
            style={{ color: "var(--text-sub)" }}
          >
            <ArrowLeft size={16} aria-hidden="true" /> Go Back
          </button>
          <button
            onClick={() => navigate("/problems")}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg transition text-sm font-medium shadow-sm"
          >
            <Home size={16} aria-hidden="true" /> Start Practicing
          </button>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-sub)" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--border-line)] hover:border-orange-400 transition text-sm font-medium"
            style={{ color: "var(--text-sub)" }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg transition text-sm font-medium"
          >
            <Home size={16} /> Home
          </button>
        </div>
      </div>
    </div>
  );
}

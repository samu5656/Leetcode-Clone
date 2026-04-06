import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldX } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { problemAPI } from "../../api";
import ProblemsTab from "./ProblemsTab";
import ContestsTab from "./ContestsTab";

export default function Admin() {
  const { isLoggedIn, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("problems");
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return;

    const fetchProblems = async () => {
      try {
        const res = await problemAPI.list({ page_size: 100 });
        setProblems(res.data.problems || []);
      } catch (err) {
        console.error("Failed to fetch problems:", err);
      } finally {
        setLoadingProblems(false);
      }
    };

    fetchProblems();
  }, [isLoggedIn, isAdmin]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={24} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please sign in to continue</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <ShieldX className="text-red-500 mx-auto mb-4" size={48} strokeWidth={1.5} />
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-[var(--text-sub)] mb-6">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-orange-500 hover:text-orange-600 font-medium transition"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-[var(--text-sub)] mt-1 text-sm">
            Manage problems and contests
          </p>
        </div>

        <div className="flex gap-6 border-b border-[var(--border-line)] mb-8">
          <button
            onClick={() => setActiveTab("problems")}
            className={`pb-3 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === "problems"
                ? "border-orange-500 text-[var(--text-main)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text-main)]"
            }`}
          >
            Problems
          </button>
          <button
            onClick={() => setActiveTab("contests")}
            className={`pb-3 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === "contests"
                ? "border-orange-500 text-[var(--text-main)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text-main)]"
            }`}
          >
            Contests
          </button>
        </div>

        {activeTab === "problems" ? (
          <ProblemsTab
            problems={problems}
            loadingProblems={loadingProblems}
            setProblems={setProblems}
          />
        ) : (
          <ContestsTab problems={problems} />
        )}
      </div>
    </div>
  );
}

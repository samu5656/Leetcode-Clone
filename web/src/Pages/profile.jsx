import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { userAPI } from "../api";
import { Medal, Activity, Code, Flame, Terminal, Pencil, X, Check } from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { user, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "" });
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setEditForm({ display_name: user.display_name || "" });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm({ display_name: "" });
  };

  const handleSave = async () => {
    if (!editForm.display_name.trim()) {
      toast("Display name cannot be empty", "error");
      return;
    }
    setSaving(true);
    try {
      await userAPI.updateMe({ display_name: editForm.display_name.trim() });
      toast("Profile updated successfully!", "success");
      setEditing(false);
      // Refresh user data
      window.dispatchEvent(new Event("authChange"));
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update profile";
      toast(typeof msg === "object" ? Object.values(msg)[0] : msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div style={{ color: "var(--text-sub)" }}>Loading profile...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Please sign in to view your profile</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 px-6 py-2 rounded hover:bg-orange-600 transition text-white font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

  return (
    <div className="min-h-screen pt-4 pb-12 px-6 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6">
      {/* Left Column */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        {/* User Card */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 flex flex-col items-center text-center shadow-lg transition-colors duration-300">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-orange-400 to-orange-600 p-1">
              <img
                src={avatar}
                alt={user.username}
                className="w-full h-full object-cover rounded-xl bg-[var(--bg-card)]"
              />
            </div>
          </div>

          {editing ? (
            <div className="w-full mt-2">
              <input
                type="text"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full text-center text-xl font-bold bg-[var(--bg-alt)] border border-[var(--border-line)] rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 transition"
                style={{ color: "var(--text-main)" }}
                placeholder="Display name"
                autoFocus
              />
              <div className="flex gap-2 mt-3 justify-center">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  <Check size={14} /> {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg transition border border-[var(--border-line)] hover:border-red-400 hover:text-red-400"
                  style={{ color: "var(--text-sub)" }}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mt-2">
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>
                  {user.display_name}
                </h1>
                <button
                  onClick={startEditing}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-alt)] transition"
                  style={{ color: "var(--text-sub)" }}
                  title="Edit profile"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>
                @{user.username}
              </p>
            </>
          )}

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

        {/* Stats Card */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg transition-colors duration-300">
          <h2 className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: "var(--text-sub)" }}>
            Your Stats
          </h2>

          <div className="flex items-end gap-3 mb-4">
            <span className="text-4xl font-extrabold text-orange-400">
              {user.total_score}
            </span>
            <span className="text-sm font-semibold mb-1" style={{ color: "var(--text-sub)" }}>
              Total Score
            </span>
          </div>

          <div className="flex justify-between text-sm mb-2 font-medium" style={{ color: "var(--text-sub)" }}>
            <span>Problems Solved</span>
            <span style={{ color: "var(--text-main)" }}>
              {user.problems_solved}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        {/* Streak + Stats Row */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Problems Solved Card */}
          <div className="flex-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg transition-colors duration-300">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: "var(--text-sub)" }}>
                Solved Problems
              </h2>
              <div className="text-right">
                <span className="text-3xl font-extrabold block" style={{ color: "var(--text-main)" }}>
                  {user.problems_solved}
                </span>
                <span className="text-xs" style={{ color: "var(--text-sub)" }}>
                  TOTAL SOLVED
                </span>
              </div>
            </div>

            <div className="text-center py-6" style={{ color: "var(--text-sub)" }}>
              <span className="text-5xl font-black text-orange-400">
                {user.total_score}
              </span>
              <p className="text-sm mt-2">Total Score Earned</p>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="w-full md:w-64 flex flex-col gap-4">
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-5 shadow-lg flex items-center justify-between transition-colors duration-300">
              <div>
                <h2 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--text-sub)" }}>
                  Daily Streak
                </h2>
                <div className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>
                  {user.current_streak} Days
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex flex-col items-center justify-center text-orange-500">
                <Flame size={24} />
              </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-4 shadow-lg flex justify-between items-center transition-colors duration-300">
              <span className="text-sm" style={{ color: "var(--text-sub)" }}>
                Max Streak
              </span>
              <span className="font-bold" style={{ color: "var(--text-main)" }}>
                {user.max_streak}
              </span>
            </div>

            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-4 shadow-lg flex justify-between items-center transition-colors duration-300">
              <span className="text-sm" style={{ color: "var(--text-sub)" }}>
                Member Since
              </span>
              <span className="font-bold text-sm" style={{ color: "var(--text-main)" }}>
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

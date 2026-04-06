import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { userAPI } from "../api";
import { Flame, Pencil, X, Check, TrendingUp, Target, Calendar } from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { user, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

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
      toast("Profile updated!", "success");
      setEditing(false);
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
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Target className="w-16 h-16 mx-auto mb-4 text-orange-500" />
          <p className="text-xl font-bold mb-2">Track Your Progress</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-sub)" }}>
            Sign in to view your stats, streaks, and achievements
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-orange-500 px-8 py-3 rounded-lg hover:bg-orange-600 active:scale-[0.98] transition-all text-white font-semibold shadow-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

  return (
    <div className="min-h-screen pt-8 pb-12 px-6 max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 flex flex-col items-center text-center shadow-lg transition-colors duration-300">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full border-4 border-orange-500 p-1">
              <img
                src={avatar}
                alt={`${user.username}'s avatar`}
                className="w-full h-full object-cover rounded-full bg-[var(--bg-alt)]"
              />
            </div>
          </div>

          {editing ? (
            <div className="w-full mt-2">
              <label htmlFor="display-name" className="sr-only">Display name</label>
              <input
                id="display-name"
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
                  <Check size={14} aria-hidden="true" /> {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg transition border border-[var(--border-line)] hover:border-red-400 hover:text-red-400"
                  style={{ color: "var(--text-sub)" }}
                >
                  <X size={14} aria-hidden="true" /> Cancel
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
                  aria-label="Edit display name"
                >
                  <Pencil size={14} aria-hidden="true" />
                </button>
              </div>
              <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>
                @{user.username}
              </p>
            </>
          )}
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-5 shadow-lg flex items-center justify-between transition-colors duration-300">
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--text-sub)" }}>
              Current Streak
            </h2>
            <div className="text-3xl font-bold" style={{ color: "var(--text-main)" }}>
              {user.current_streak} <span className="text-lg font-medium" style={{ color: "var(--text-sub)" }}>days</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Flame size={28} aria-hidden="true" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-4 shadow-lg flex justify-between items-center transition-colors duration-300">
          <span className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>
            Best Streak
          </span>
          <span className="font-bold text-lg" style={{ color: "var(--text-main)" }}>
            {user.max_streak} days
          </span>
        </div>
      </div>

      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Target size={20} className="text-emerald-500" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: "var(--text-sub)" }}>
                Problems Solved
              </h2>
            </div>
            <div className="text-5xl font-black text-emerald-500">
              {user.problems_solved}
            </div>
            <p className="text-sm mt-2" style={{ color: "var(--text-sub)" }}>
              Keep going! Every problem makes you stronger.
            </p>
          </div>

          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-orange-500" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: "var(--text-sub)" }}>
                Total Score
              </h2>
            </div>
            <div className="text-5xl font-black text-orange-500">
              {user.total_score}
            </div>
            <p className="text-sm mt-2" style={{ color: "var(--text-sub)" }}>
              Points earned from solving problems
            </p>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-line)] p-6 shadow-lg transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar size={20} className="text-blue-500" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: "var(--text-sub)" }}>
              Member Since
            </h2>
          </div>
          <div className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>
            {new Date(user.created_at).toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </div>
          <p className="text-sm mt-2" style={{ color: "var(--text-sub)" }}>
            {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} days on your coding journey
          </p>
        </div>
      </div>
    </div>
  );
}

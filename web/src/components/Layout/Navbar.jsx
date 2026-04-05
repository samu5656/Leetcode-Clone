import { Link, useNavigate, useLocation } from "react-router-dom";
import { Moon, Sun, User, LogOut, Menu, X, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/problems", label: "Problems" },
    { to: "/contests", label: "Contests" },
    { to: "/leaderboard", label: "Leaderboard" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className="w-full fixed top-0 left-0 z-50 backdrop-blur-md border-b"
        style={{
          background:
            "linear-gradient(to right, var(--bg-header-start), var(--bg-header-end))",
          borderColor: "var(--border-line)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-orange-500 font-black text-xl">⟨/⟩</span>
              <h1
                className="font-bold text-lg tracking-tight"
                style={{ color: "var(--text-main)" }}
              >
                LeetClone
              </h1>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div
            className="hidden md:flex items-center gap-1 text-sm"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  isActive(link.to)
                    ? "text-orange-400 bg-orange-500/10"
                    : "hover:text-orange-400"
                }`}
                style={!isActive(link.to) ? { color: "var(--text-sub)" } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Theme toggle — Sun when dark (click to go light), Moon when light (click to go dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--bg-alt)] transition"
              style={{ color: "var(--text-sub)" }}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition border ${
                      isActive("/admin")
                        ? "text-orange-400 border-orange-400 bg-orange-500/10"
                        : "border-[var(--border-line)] hover:border-orange-400"
                    }`}
                    style={!isActive("/admin") ? { color: "var(--text-sub)", background: "var(--bg-card)" } : {}}
                  >
                    <Shield size={14} />
                    Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="text-sm px-4 py-1.5 rounded-lg flex items-center gap-2 transition border border-[var(--border-line)] hover:border-orange-400"
                  style={{ color: "var(--text-main)", background: "var(--bg-card)" }}
                >
                  <User size={16} />
                  {user?.display_name || user?.username || "Profile"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition"
                  style={{ color: "var(--text-sub)" }}
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-block bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-1.5 rounded-lg font-medium transition"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-alt)] transition"
              style={{ color: "var(--text-main)" }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-16 left-0 right-0 border-b shadow-xl"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-line)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive(link.to)
                      ? "text-orange-400 bg-orange-500/10"
                      : "hover:bg-[var(--bg-alt)]"
                  }`}
                  style={!isActive(link.to) ? { color: "var(--text-main)" } : {}}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t my-2" style={{ borderColor: "var(--border-line)" }} />

              {isLoggedIn ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                        isActive("/admin")
                          ? "text-orange-400 bg-orange-500/10"
                          : "hover:bg-[var(--bg-alt)]"
                      }`}
                      style={!isActive("/admin") ? { color: "var(--text-main)" } : {}}
                    >
                      <Shield size={16} />
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--bg-alt)] transition"
                    style={{ color: "var(--text-main)" }}
                  >
                    <User size={16} />
                    {user?.display_name || user?.username || "Profile"}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition text-left"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-3 rounded-lg font-medium text-center transition"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
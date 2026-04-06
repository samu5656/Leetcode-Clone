import { Link, useNavigate, useLocation } from "react-router-dom";
import { Moon, Sun, User, LogOut, Menu, X, Shield, HelpCircle, Keyboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        const isInput = activeElement.tagName === "INPUT" || 
                       activeElement.tagName === "TEXTAREA" || 
                       activeElement.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setShowShortcuts(prev => !prev);
        }
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const shortcuts = [
    { keys: ["?"], desc: "Show keyboard shortcuts" },
    { keys: ["Esc"], desc: "Close modals / panels" },
    { keys: ["⌘", "Enter"], desc: "Submit code (in editor)" },
    { keys: ["⌘", "K"], desc: "Reset code (in editor)" },
    { keys: ["⌘", "/"], desc: "Toggle language (in editor)" },
  ];

  return (
    <>
      <nav
        className="w-full fixed top-0 left-0 z-50 backdrop-blur-md border-b"
        style={{
          background:
            "linear-gradient(to right, var(--bg-header-start), var(--bg-header-end))",
          borderColor: "var(--border-line)",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Home">
              <span className="text-orange-500 font-black text-2xl" aria-hidden="true">⟨/⟩</span>
              <h1
                className="font-bold text-lg tracking-tight hidden sm:block"
                style={{ color: "var(--text-main)" }}
              >
                LeetClone
              </h1>
            </Link>
          </div>

          <div
            className="hidden md:flex items-center gap-2 text-sm font-medium"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg transition-all duration-150 ${
                  isActive(link.to)
                    ? "text-orange-400 bg-orange-500/10 shadow-sm"
                    : "hover:text-orange-400 hover:bg-[var(--bg-alt)]"
                }`}
                style={!isActive(link.to) ? { color: "var(--text-sub)" } : {}}
                aria-current={isActive(link.to) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcuts(true)}
              className="hidden md:flex items-center gap-1.5 p-2 rounded-lg hover:bg-[var(--bg-alt)] transition-all duration-150"
              style={{ color: "var(--text-sub)" }}
              aria-label="Show keyboard shortcuts"
            >
              <Keyboard size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-alt)] transition-all duration-150"
              style={{ color: "var(--text-sub)" }}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span className="hidden lg:inline text-sm font-medium">
                {isDarkMode ? "Light" : "Dark"}
              </span>
            </button>

            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-150 border ${
                      isActive("/admin")
                        ? "text-orange-400 border-orange-400 bg-orange-500/10 shadow-sm"
                        : "border-[var(--border-line)] hover:border-orange-400"
                    }`}
                    style={!isActive("/admin") ? { color: "var(--text-sub)", background: "var(--bg-card)" } : {}}
                  >
                    <Shield size={16} aria-hidden="true" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-150 border border-[var(--border-line)] hover:border-orange-400 hover:shadow-sm font-medium"
                  style={{ color: "var(--text-main)", background: "var(--bg-card)" }}
                >
                  <User size={16} aria-hidden="true" />
                  <span>{user?.display_name || user?.username || "Profile"}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
                  style={{ color: "var(--text-sub)" }}
                  aria-label="Sign Out"
                >
                  <LogOut size={18} aria-hidden="true" />
                  <span className="hidden lg:inline text-sm font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-block bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-sm px-6 py-2 rounded-lg font-semibold transition-all duration-150 shadow-sm"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-alt)] transition"
              style={{ color: "var(--text-main)" }}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        >
          <div
            className="absolute top-16 left-0 right-0 border-b shadow-xl"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-line)",
            }}
            onClick={(e) => e.stopPropagation()}
            role="menu"
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
                  role="menuitem"
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
                      role="menuitem"
                    >
                      <Shield size={16} aria-hidden="true" />
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--bg-alt)] transition"
                    style={{ color: "var(--text-main)" }}
                    role="menuitem"
                  >
                    <User size={16} aria-hidden="true" />
                    {user?.display_name || user?.username || "Profile"}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition text-left"
                    role="menuitem"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-3 rounded-lg font-medium text-center transition"
                  role="menuitem"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {showShortcuts && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-line)] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="shortcuts-title"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="shortcuts-title" className="text-lg font-bold" style={{ color: "var(--text-main)" }}>
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 rounded hover:bg-[var(--bg-alt)] transition"
                style={{ color: "var(--text-sub)" }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {shortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--text-sub)" }}>
                    {shortcut.desc}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, j) => (
                      <span key={j} className="kbd">{key}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-6 text-center" style={{ color: "var(--text-sub)" }}>
              Press <span className="kbd">?</span> anywhere to toggle this panel
            </p>
          </div>
        </div>
      )}
    </>
  );
}
import { Link } from "react-router-dom";
import { Moon, Sun, User } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
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

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };
    
    checkAuth();
    window.addEventListener("authChange", checkAuth);
    
    return () => window.removeEventListener("authChange", checkAuth);
  }, []);

  return (
    <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md border-b" 
         style={{ background: 'linear-gradient(to right, var(--bg-header-start), var(--bg-header-end))', borderColor: 'var(--border-line)' }}>
      
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-lg" style={{ color: 'var(--text-main)' }}>
            LeetClone
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--text-sub)' }}>
          <Link to="/problems" className="hover:text-orange-400 transition">
            Problems
          </Link>
          <Link to="/contests" className="hover:text-orange-400 transition">
            Contests
          </Link>
          <Link to="/leaderboard" className="hover:text-orange-400 transition">
            Leaderboard
          </Link>
          <Link to="/discuss" className="hover:text-orange-400 transition">
            Discuss
          </Link>
        </div>

        <div className="flex items-center gap-4">
          
          <button onClick={toggleTheme} className="hover:text-orange-400 transition" style={{ color: 'var(--text-sub)' }}>
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>


          {isLoggedIn ? (
            <Link
              to="/profile"
              className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-1.5 rounded flex items-center gap-2 transition"
            >
              <User size={16} /> Profile
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-1.5 rounded"
            >
              Sign In
            </Link>
          )}

        </div>

      </div>
    </nav>
  );
}
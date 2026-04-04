import { Link } from "react-router-dom";
import { Moon } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full fixed top-0 left-0 z-50 bg-gradient-to-r from-[#0b1220] to-[#0f172a] backdrop-blur-md">
      
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        <div className="flex items-center gap-2">
          <h1 className="text-white font-semibold text-lg">
            Leetclone
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-6 text-gray-300 text-sm">
          <Link to="/problems" className="hover:text-white transition">
            Problems
          </Link>
          <Link to="/contests" className="hover:text-white transition">
            Contests
          </Link>
          <Link to="/leaderboard" className="hover:text-white transition">
            Leaderboard
          </Link>
          <Link to="/discuss" className="hover:text-white transition">
            Discuss
          </Link>
        </div>

        <div className="flex items-center gap-4">
          
          <button className="text-gray-300 hover:text-white">
            <Moon size={18} />
          </button>

          <Link
            to="/login"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-1.5 rounded"
          >
            Sign In
          </Link>

        </div>

      </div>
    </nav>
  );
}
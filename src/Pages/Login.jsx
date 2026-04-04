import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] px-4 transition-colors duration-300">
      
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-line)] p-8 rounded-2xl shadow-lg transition-colors duration-300">
        
        <h2 className="text-3xl font-bold text-center mb-6">
          Welcome Back to coding !
        </h2>

        <form className="flex flex-col gap-4">
          
          <input
            type="email"
            placeholder="Email"
            className="p-3 rounded bg-[var(--bg-alt)] border border-[var(--border-line)] focus:outline-none focus:border-orange-500 transition-colors duration-300"
            style={{ color: 'var(--text-main)' }}
          />

          <input
            type="password"
            placeholder="Password"
            className="p-3 rounded bg-[var(--bg-alt)] border border-[var(--border-line)] focus:outline-none focus:border-orange-500 transition-colors duration-300"
            style={{ color: 'var(--text-main)' }}
          />

          <button
            type="button"
            onClick={() => {
              localStorage.setItem("isLoggedIn", "true");
              window.dispatchEvent(new Event("authChange"));
              navigate("/problems");
            }}
            className="bg-orange-500 py-3 rounded font-semibold hover:bg-orange-600 transition"
          >
            Login
          </button>

        </form>

        {/* Footer */}
        <p className="text-sm mt-6 text-center" style={{ color: 'var(--text-sub)' }}>
          Don’t have an account?{" "}
          <span className="text-orange-400 cursor-pointer hover:underline">
            Sign up
          </span>
        </p>

      </div>

    </div>
  );
}
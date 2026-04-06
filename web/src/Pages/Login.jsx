import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    display_name: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        await register(
          form.email,
          form.username,
          form.password,
          form.display_name
        );
      } else {
        await login(form.email, form.password);
      }
      navigate("/problems");
    } catch (err) {
      const data = err.response?.data;
      if (data?.error && typeof data.error === "object") {
        // Validation errors — show the first one.
        const firstError = Object.values(data.error)[0];
        setError(firstError);
      } else if (data?.error) {
        setError(data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md px-8 py-10 transition-colors duration-300">
        <h2 className="text-3xl font-bold text-center mb-2">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-center text-sm mb-8" style={{ color: "var(--text-sub)" }}>
          {isRegister ? "Start your coding journey" : "Continue your progress"}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full px-4 py-4 rounded bg-[var(--bg-alt)] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all border-none"
                  style={{ color: "var(--text-main)" }}
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="display_name" className="sr-only">Display Name</label>
                <input
                  id="display_name"
                  type="text"
                  name="display_name"
                  placeholder="Display Name"
                  value={form.display_name}
                  onChange={handleChange}
                  className="w-full px-4 py-4 rounded bg-[var(--bg-alt)] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all border-none"
                  style={{ color: "var(--text-main)" }}
                  required
                  autoComplete="name"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-4 rounded bg-[var(--bg-alt)] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all border-none"
              style={{ color: "var(--text-main)" }}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-4 rounded bg-[var(--bg-alt)] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all border-none"
              style={{ color: "var(--text-main)" }}
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 py-3 rounded-lg font-semibold hover:bg-orange-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 shadow-sm"
          >
            {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {loading
              ? "Please wait..."
              : isRegister
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <p
          className="text-sm mt-8 text-center"
          style={{ color: "var(--text-sub)" }}
        >
          {isRegister ? "Already have an account? " : "New to the platform? "}
          <span
            className="text-orange-400 cursor-pointer hover:text-orange-300 transition-colors font-medium"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Sign in" : "Create account"}
          </span>
        </p>
      </div>
    </div>
  );
}
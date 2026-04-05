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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-line)] p-8 rounded-2xl shadow-lg transition-colors duration-300">
        <h2 className="text-3xl font-bold text-center mb-6">
          {isRegister ? "Create Account" : "Welcome Back!"}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-line)] focus:outline-none focus:border-orange-500 transition-colors duration-300"
                style={{ color: "var(--text-main)" }}
                required
              />
              <input
                type="text"
                name="display_name"
                placeholder="Display Name"
                value={form.display_name}
                onChange={handleChange}
                className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-line)] focus:outline-none focus:border-orange-500 transition-colors duration-300"
                style={{ color: "var(--text-main)" }}
                required
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-line)] focus:outline-none focus:border-orange-500 transition-colors duration-300"
            style={{ color: "var(--text-main)" }}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-line)] focus:outline-none focus:border-orange-500 transition-colors duration-300"
            style={{ color: "var(--text-main)" }}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 text-white flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading
              ? "Please wait..."
              : isRegister
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        <p
          className="text-sm mt-6 text-center"
          style={{ color: "var(--text-sub)" }}
        >
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <span
            className="text-orange-400 cursor-pointer hover:underline"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Sign in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}
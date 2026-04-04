import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-white px-4">
      
      <div className="w-full max-w-md bg-[#111827] p-8 rounded-2xl shadow-lg">
        
        <h2 className="text-3xl font-bold text-center mb-6">
          Welcome Back to coding !
        </h2>

        <form className="flex flex-col gap-4">
          
          <input
            type="email"
            placeholder="Email"
            className="p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-orange-500"
          />

          <input
            type="password"
            placeholder="Password"
            className="p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-orange-500"
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
        <p className="text-sm text-gray-400 mt-6 text-center">
          Don’t have an account?{" "}
          <span className="text-orange-400 cursor-pointer hover:underline">
            Sign up
          </span>
        </p>

      </div>

    </div>
  );
}
import React, { useState } from "react";
import { Eye, EyeOff, LockKeyhole, User } from "lucide-react";

type LoginProps = {
  onLogin: (credentials: {
    username: string;
    password: string;
  }) => Promise<void>;
};

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin({
        username,
        password,
      });

      // Navigate to dashboard
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-[#121212] to-black p-4 text-white">
      {/* Glassmorphism Form Card */}
      <div className="w-full max-w-md bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" />

          <p className="text-sm text-white/80 mt-2">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Username
            </label>

            <div className="relative">
              <User
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/75"
              />

              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/[0.07] text-white placeholder-white/50 border border-white/15 rounded-xl outline-none focus:ring-2 focus:ring-white/25 focus:border-white/40 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/75"
              />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/[0.07] text-white placeholder-white/50 border border-white/15 rounded-xl outline-none focus:ring-2 focus:ring-white/25 focus:border-white/40 transition"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/15 backdrop-blur-sm border border-red-400/40 text-white text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600/90 hover:bg-blue-600 disabled:bg-blue-500/40 text-white font-semibold py-3 rounded-xl shadow-lg transition flex justify-center items-center"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-white/60 mt-8">
          POS Management System
        </p>
      </div>
    </div>
  );
};

export default Login;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";

export function AuthPage() {
  const { loginUser, registerUser, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/library");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
      navigate("/library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white border border-zinc-200 rounded-2xl p-8">
      <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-2">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>
      <p className="text-sm text-zinc-600 mb-6">
        Save bookmarks, manage reading lists, and access admin tools.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-md text-sm font-semibold ${
            mode === "login" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-700"
          }`}
          onClick={() => setMode("login")}
        >
          Sign in
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-semibold ${
            mode === "register" ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-700"
          }`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            required
          />
        </div>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

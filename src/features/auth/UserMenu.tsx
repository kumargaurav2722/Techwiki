import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { Crown } from "lucide-react";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <Link
        to="/login"
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        Sign in
      </Link>
    );
  }

  const isPremium = user.plan === "premium";

  return (
    <div className="flex items-center gap-3">
      <Link
        to="/library"
        className="text-sm font-semibold text-zinc-700 hover:text-indigo-600"
      >
        Library
      </Link>
      {user.role === "admin" ? (
        <Link
          to="/admin"
          className="text-sm font-semibold text-zinc-700 hover:text-indigo-600"
        >
          Admin
        </Link>
      ) : null}
      {isPremium ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          <Crown className="w-3 h-3" />
          Premium
        </span>
      ) : (
        <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
          Free
        </span>
      )}
      <span className="text-xs text-zinc-500 hidden md:inline">{user.email}</span>
      <button
        onClick={handleLogout}
        className="text-xs text-zinc-500 hover:text-zinc-700"
      >
        Logout
      </button>
    </div>
  );
}

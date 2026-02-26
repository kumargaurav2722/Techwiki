import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";

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

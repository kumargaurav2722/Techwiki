import { Link, NavLink } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { slugify } from "@/shared/lib/slug";
import { useAuth } from "@/shared/context/AuthContext";
import { CATEGORIES } from "@/shared/data/categories";

export function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-64 bg-zinc-100 border-r border-zinc-200 h-screen overflow-y-auto sticky top-0 hidden md:block">
      <div className="p-4">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-bold text-zinc-900 mb-6">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          TechWiki
        </Link>
        <div className="mb-6">
          <NavLink
            to="/search"
            className={({ isActive }) =>
              cn(
                "block px-3 py-2 rounded-md text-sm font-semibold transition-colors",
                isActive ? "bg-indigo-100 text-indigo-700" : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
              )
            }
          >
            Search All Topics
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              cn(
                "mt-2 block px-3 py-2 rounded-md text-sm font-semibold transition-colors",
                isActive ? "bg-indigo-100 text-indigo-700" : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
              )
            }
          >
            Your Library
          </NavLink>
          <NavLink
            to="/learn"
            className={({ isActive }) =>
              cn(
                "mt-2 block px-3 py-2 rounded-md text-sm font-semibold transition-colors",
                isActive ? "bg-indigo-100 text-indigo-700" : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
              )
            }
          >
            Learning Paths
          </NavLink>
        </div>
        <nav className="space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <NavLink
                to={`/category/${cat.path}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 text-sm font-semibold uppercase tracking-wider mb-2 transition-colors",
                    isActive ? "text-indigo-600" : "text-zinc-500 hover:text-zinc-900"
                  )
                }
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </NavLink>
              <ul className="space-y-1">
                {cat.topics.map((topic) => {
                  const slug = slugify(topic.name);
                  const catSlug = cat.path;
                  return (
                    <li key={topic.name}>
                      <NavLink
                        to={`/wiki/${catSlug}/${slug}`}
                        className={({ isActive }) =>
                          cn(
                            "block px-2 py-1.5 text-sm rounded-md transition-colors",
                            isActive
                              ? "bg-indigo-100 text-indigo-700 font-medium"
                              : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                          )
                        }
                      >
                        {topic.name}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        {user?.role === "admin" ? (
          <div className="mt-8 pt-4 border-t border-zinc-200">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "block px-3 py-2 rounded-md text-sm font-semibold transition-colors",
                  isActive ? "bg-indigo-100 text-indigo-700" : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                )
              }
            >
              Admin Editor
            </NavLink>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

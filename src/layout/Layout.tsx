import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { SearchBar } from "@/features/search/SearchBar";
import { UserMenu } from "@/features/auth/UserMenu";
import { Moon, Sun } from "lucide-react";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("techwiki_dark_mode");
      if (saved !== null) return saved === "true";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("techwiki_dark_mode", String(dark));
    } catch {
      // ignore
    }
  }, [dark]);

  return [dark, setDark] as const;
}

export function Layout() {
  const [dark, setDark] = useDarkMode();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-200 bg-white flex items-center px-6 sticky top-0 z-10">
          <div className="flex-1 max-w-3xl mx-auto w-full">
            <SearchBar />
          </div>
          <button
            type="button"
            onClick={() => setDark((prev) => !prev)}
            className="ml-3 p-2 rounded-md hover:bg-zinc-100 transition-colors text-zinc-600 hover:text-zinc-900"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="ml-2">
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

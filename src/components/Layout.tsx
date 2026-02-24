import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { SearchBar } from "./SearchBar";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-200 bg-white flex items-center px-6 sticky top-0 z-10">
          <div className="flex-1 max-w-3xl mx-auto w-full">
            <SearchBar />
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

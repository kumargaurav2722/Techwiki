import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import {
  createReadingList,
  deleteReadingList,
  deleteReadingListItem,
  listBookmarks,
  listReadingLists,
  removeBookmark,
  type Bookmark,
  type ReadingList,
} from "@/shared/services/libraryApi";
import { titleFromSlug } from "@/shared/lib/slug";

export function LibraryPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [listName, setListName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLibrary = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [bm, rl] = await Promise.all([listBookmarks(), listReadingLists()]);
      setBookmarks(bm || []);
      setLists(rl || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [user]);

  const handleCreateList = async () => {
    if (!listName.trim()) return;
    try {
      const list = await createReadingList(listName.trim());
      const normalized = { ...list, items: list.items || [] };
      setLists((prev) => [normalized, ...prev]);
      setListName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create list");
    }
  };

  const handleRemoveBookmark = async (id: number) => {
    try {
      await removeBookmark(id);
      setBookmarks((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove bookmark");
    }
  };

  const handleRemoveList = async (id: number) => {
    try {
      await deleteReadingList(id);
      setLists((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete list");
    }
  };

  const handleRemoveListItem = async (listId: number, itemId: number) => {
    try {
      await deleteReadingListItem(listId, itemId);
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
            : list
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    }
  };

  if (!user) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
        <h1 className="text-2xl font-serif font-bold text-zinc-900 mb-2">Your Library</h1>
        <p className="text-zinc-600">Sign in to save bookmarks and reading lists.</p>
        <Link
          to="/login"
          className="inline-flex mt-4 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-zinc-900">Your Library</h1>
        <p className="text-zinc-600">Bookmarks and curated reading lists.</p>
      </header>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? <div className="text-zinc-500">Loading...</div> : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900">Bookmarks</h2>
        {bookmarks.length === 0 ? (
          <div className="text-sm text-zinc-500">No bookmarks yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.map((item) => (
              <div key={item.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                <Link
                  to={`/wiki/${item.category}/${item.slug}`}
                  className="text-base font-semibold text-zinc-900 hover:text-indigo-600"
                >
                  {item.topic}
                </Link>
                <div className="text-xs uppercase tracking-wide text-zinc-400 mt-1">
                  {titleFromSlug(item.category)}
                </div>
                <button
                  onClick={() => handleRemoveBookmark(item.id)}
                  className="text-xs text-red-600 hover:underline mt-3"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900">Reading Lists</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="New reading list name"
          />
          <button
            onClick={handleCreateList}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Create
          </button>
        </div>

        {lists.length === 0 ? (
          <div className="text-sm text-zinc-500">No reading lists yet.</div>
        ) : (
          <div className="space-y-4">
            {lists.map((list) => (
              <div key={list.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">{list.name}</h3>
                  <button
                    onClick={() => handleRemoveList(list.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
                {list.items.length === 0 ? (
                  <div className="text-sm text-zinc-500 mt-2">No items yet.</div>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {list.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between">
                        <Link
                          to={`/wiki/${item.category}/${item.slug}`}
                          className="text-sm text-zinc-700 hover:text-indigo-600"
                        >
                          {item.topic}
                        </Link>
                        <button
                          onClick={() => handleRemoveListItem(list.id, item.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

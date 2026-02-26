import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES } from "@/shared/data/categories";
import { slugify, titleFromSlug } from "@/shared/lib/slug";
import { fetchRandomArticle, fetchStats, type ArticleSummary } from "@/shared/services/exploreApi";
import { Compass, Shuffle, TrendingUp, Clock } from "lucide-react";

export function ExplorePage() {
  const [stats, setStats] = useState<{
    counts: { articles: number; categories: number };
    recent: ArticleSummary[];
    trending: ArticleSummary[];
  } | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchStats()
      .then((data) => setStats(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.map((category) => ({
      ...category,
      topics: category.topics.filter((topic) => topic.name.toLowerCase().includes(q)),
    })).filter((category) => category.topics.length > 0);
  }, [query]);

  const handleRandom = async () => {
    try {
      const data = await fetchRandomArticle();
      navigate(`/wiki/${data.article.category}/${data.article.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load random article");
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Compass className="w-4 h-4" />
          <span>Explore</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900">
          Explore the TechWiki Universe
        </h1>
        <p className="text-zinc-600 max-w-2xl">
          Discover trending topics, recent updates, and browse every category in one place.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-400">Articles</div>
          <div className="text-2xl font-semibold text-zinc-900">{stats?.counts.articles ?? 0}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-400">Categories</div>
          <div className="text-2xl font-semibold text-zinc-900">{stats?.counts.categories ?? 0}</div>
        </div>
        <button
          onClick={handleRandom}
          className="bg-indigo-600 text-white rounded-xl p-4 flex items-center justify-between hover:bg-indigo-700"
        >
          <span className="text-sm font-semibold">Random Article</span>
          <Shuffle className="w-4 h-4" />
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? <div className="text-zinc-500">Loading...</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-lg font-semibold text-zinc-900">Trending</h2>
          </div>
          <div className="space-y-2">
            {stats?.trending?.length ? (
              stats.trending.map((item) => (
                <Link
                  key={item.id}
                  to={`/wiki/${item.category}/${item.slug}`}
                  className="flex items-center justify-between text-sm text-zinc-700 hover:text-indigo-600"
                >
                  <span>{item.topic}</span>
                  <span className="text-xs text-zinc-400">{item.views ?? 0} views</span>
                </Link>
              ))
            ) : (
              <div className="text-sm text-zinc-500">No trending data yet.</div>
            )}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-lg font-semibold text-zinc-900">Recently Updated</h2>
          </div>
          <div className="space-y-2">
            {stats?.recent?.length ? (
              stats.recent.map((item) => (
                <Link
                  key={item.id}
                  to={`/wiki/${item.category}/${item.slug}`}
                  className="flex items-center justify-between text-sm text-zinc-700 hover:text-indigo-600"
                >
                  <span>{item.topic}</span>
                  <span className="text-xs text-zinc-400">{titleFromSlug(item.category)}</span>
                </Link>
              ))
            ) : (
              <div className="text-sm text-zinc-500">No updates yet.</div>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-zinc-900">Browse All Topics</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Filter topics (e.g., caching, python)"
        />
        <div className="space-y-6">
          {filteredTopics.map((category) => (
            <div key={category.path} className="bg-zinc-50 border border-zinc-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <category.icon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-lg font-semibold text-zinc-900">{category.name}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {category.topics.map((topic) => (
                  <Link
                    key={`${category.path}-${topic.name}`}
                    to={`/wiki/${category.path}/${slugify(topic.name)}`}
                    className="text-sm text-zinc-700 hover:text-indigo-600"
                  >
                    {topic.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

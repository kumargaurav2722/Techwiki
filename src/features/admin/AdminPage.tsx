import { useEffect, useState } from "react";
import {
  getAdminArticle,
  getAdminKey,
  listAdminArticles,
  setAdminKey,
  startIngestion,
  getIngestionStatus,
  updateAdminArticle,
  type AdminArticle,
  type AdminArticleSummary,
  type IngestStatus,
} from "@/shared/services/adminApi";
import { Search, Save, Loader2, Database, KeyRound } from "lucide-react";
import { titleFromSlug } from "@/shared/lib/slug";

function formatReferences(refs?: Array<{ title: string; url: string }> | null) {
  if (!refs || refs.length === 0) return "";
  return refs.map((ref) => `${ref.title} | ${ref.url}`).join("\n");
}

function parseReferences(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const refs: Array<{ title: string; url: string }> = [];
  for (const line of lines) {
    const [title, url] = line.split("|").map((part) => part.trim());
    if (title && url) {
      refs.push({ title, url });
    }
  }
  return refs;
}

export function AdminPage() {
  const [adminKey, setAdminKeyState] = useState(getAdminKey());
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState<AdminArticleSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [referencesText, setReferencesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus | null>(null);
  const [ingestLimit, setIngestLimit] = useState<string>("");
  const [ingestCategory, setIngestCategory] = useState<string>("");

  useEffect(() => {
    setAdminKey(adminKey);
  }, [adminKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const handler = window.setTimeout(() => {
      listAdminArticles(search)
        .then((data) => {
          if (active) setArticles(data);
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : "Failed to load articles");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(handler);
    };
  }, [search]);

  useEffect(() => {
    if (!selectedId) {
      setArticle(null);
      setMarkdown("");
      setReferencesText("");
      return;
    }

    setLoading(true);
    getAdminArticle(selectedId)
      .then((data) => {
        setArticle(data);
        setMarkdown(data.markdown);
        setReferencesText(formatReferences(data.references));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load article");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedId]);

  useEffect(() => {
    let timer: number | undefined;
    const poll = async () => {
      try {
        const status = await getIngestionStatus();
        if (status) setIngestStatus(status);
      } catch {
        // ignore
      }
      timer = window.setTimeout(poll, 5000);
    };

    poll();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const handleSave = async () => {
    if (!article) return;
    setSaving(true);
    setError(null);

    try {
      const refs = parseReferences(referencesText);
      const updated = await updateAdminArticle(article.id, {
        markdown,
        references: refs.length ? refs : null,
      });
      setArticle(updated);
      setMarkdown(updated.markdown);
      setReferencesText(formatReferences(updated.references));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleIngest = async () => {
    setError(null);
    try {
      const limit = ingestLimit ? Number(ingestLimit) : undefined;
      const status = await startIngestion({
        limit: Number.isFinite(limit) ? limit : undefined,
        category: ingestCategory || undefined,
      });
      setIngestStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start ingestion");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-zinc-900">Admin Editor</h1>
        <p className="text-zinc-600">
          Curate articles, manage citations, and run background ingestion for the topic library.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <KeyRound className="w-4 h-4" />
              Admin API Key
            </div>
            <input
              value={adminKey}
              onChange={(e) => setAdminKeyState(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Set ADMIN_API_KEY if required"
            />
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-300 text-sm"
                placeholder="Search articles"
              />
            </div>

            {loading ? (
              <div className="text-sm text-zinc-500">Loading...</div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {articles.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedId === item.id
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-zinc-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="text-sm font-semibold text-zinc-900">{item.topic}</div>
                    <div className="text-xs uppercase tracking-wide text-zinc-400">
                      {titleFromSlug(item.category)}
                    </div>
                  </button>
                ))}
                {articles.length === 0 ? (
                  <div className="text-sm text-zinc-500">No articles found.</div>
                ) : null}
              </div>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <Database className="w-4 h-4" />
              Background Ingestion
            </div>
            <input
              value={ingestCategory}
              onChange={(e) => setIngestCategory(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Category (optional) e.g. dsa"
            />
            <input
              value={ingestLimit}
              onChange={(e) => setIngestLimit(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Limit (optional)"
            />
            <button
              type="button"
              onClick={handleIngest}
              className="w-full bg-indigo-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-indigo-700"
            >
              Start Ingestion
            </button>
            {ingestStatus ? (
              <div className="text-xs text-zinc-600 space-y-1">
                <div>Status: {ingestStatus.state}</div>
                <div>Progress: {ingestStatus.processed}/{ingestStatus.total}</div>
                {ingestStatus.errorCount ? <div>Errors: {ingestStatus.errorCount}</div> : null}
              </div>
            ) : null}
          </div>
        </aside>

        <section className="space-y-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!article ? (
            <div className="border border-dashed border-zinc-300 rounded-xl p-8 text-zinc-500">
              Select an article to edit.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">{article.topic}</h2>
                    <p className="text-xs uppercase tracking-wide text-zinc-400">
                      {titleFromSlug(article.category)} · v{article.version}
                    </p>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-700">Markdown Content</h3>
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className="w-full min-h-[360px] rounded-md border border-zinc-300 p-3 text-sm font-mono"
                />
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-700">References (Title | URL per line)</h3>
                <textarea
                  value={referencesText}
                  onChange={(e) => setReferencesText(e.target.value)}
                  className="w-full min-h-[140px] rounded-md border border-zinc-300 p-3 text-sm"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

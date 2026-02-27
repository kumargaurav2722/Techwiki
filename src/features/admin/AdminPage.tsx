import { useEffect, useMemo, useState } from "react";
import {
  getAdminArticle,
  getAdminKey,
  listAdminArticles,
  setAdminKey,
  startIngestion,
  getIngestionStatus,
  updateAdminArticle,
  createDraft,
  approveDraft,
  publishDraft,
  restoreArticleVersion,
  listArticleVersions,
  listCommentReports,
  actOnCommentReport,
  listAdminUsers,
  banAdminUser,
  unbanAdminUser,
  type AdminArticle,
  type AdminArticleSummary,
  type IngestStatus,
  type ArticleVersion,
  type CommentReport,
  type AdminUser,
} from "@/shared/services/adminApi";
import { Search, Save, Loader2, Database, KeyRound } from "lucide-react";
import { titleFromSlug } from "@/shared/lib/slug";

type DiffLine = { type: "context" | "add" | "remove"; text: string };

function diffMarkdown(base: string, compare: string): DiffLine[] {
  const a = base.split("\n");
  const b = compare.split("\n");
  const n = a.length;
  const m = b.length;

  if (n === 0 && m === 0) return [];

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ type: "context", text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "remove", text: a[i] });
      i += 1;
    } else {
      result.push({ type: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    result.push({ type: "remove", text: a[i] });
    i += 1;
  }
  while (j < m) {
    result.push({ type: "add", text: b[j] });
    j += 1;
  }
  return result;
}

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
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [compareBaseId, setCompareBaseId] = useState<number | null>(null);
  const [compareTargetId, setCompareTargetId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus | null>(null);
  const [ingestLimit, setIngestLimit] = useState<string>("");
  const [ingestCategory, setIngestCategory] = useState<string>("");
  const [commentReports, setCommentReports] = useState<CommentReport[]>([]);
  const [reportStatus, setReportStatus] = useState<"open" | "resolved" | "dismissed" | "all">("open");
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userStatus, setUserStatus] = useState<"all" | "active" | "banned">("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [banReason, setBanReason] = useState<Record<number, string>>({});
  const [banUntil, setBanUntil] = useState<Record<number, string>>({});

  const diffLines = useMemo(() => {
    if (!compareBaseId || !compareTargetId) return [];
    const base = versions.find((version) => version.id === compareBaseId)?.markdown || "";
    const target = versions.find((version) => version.id === compareTargetId)?.markdown || "";
    return diffMarkdown(base, target);
  }, [compareBaseId, compareTargetId, versions]);

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
      setVersions([]);
      setCompareBaseId(null);
      setCompareTargetId(null);
      return;
    }

    setLoading(true);
    Promise.all([getAdminArticle(selectedId), listArticleVersions(selectedId)])
      .then(([data, versionData]) => {
        setArticle(data);
        setMarkdown(data.markdown);
        setReferencesText(formatReferences(data.references));
        setVersions(versionData || []);
        const versionIds = (versionData || []).map((v) => v.id);
        setCompareBaseId((prev) =>
          prev && versionIds.includes(prev) ? prev : versionIds[1] || versionIds[0] || null
        );
        setCompareTargetId((prev) =>
          prev && versionIds.includes(prev) ? prev : versionIds[0] || null
        );
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

  useEffect(() => {
    if (versions.length === 0) {
      setCompareBaseId(null);
      setCompareTargetId(null);
      return;
    }
    const versionIds = versions.map((v) => v.id);
    setCompareBaseId((prev) =>
      prev && versionIds.includes(prev) ? prev : versionIds[1] || versionIds[0] || null
    );
    setCompareTargetId((prev) => (prev && versionIds.includes(prev) ? prev : versionIds[0] || null));
  }, [versions]);

  useEffect(() => {
    let active = true;
    setModerationLoading(true);
    setModerationError(null);
    const statusParam = reportStatus === "all" ? undefined : reportStatus;
    listCommentReports(statusParam)
      .then((data) => {
        if (active) setCommentReports(data || []);
      })
      .catch((err) => {
        if (active) setModerationError(err instanceof Error ? err.message : "Failed to load moderation queue");
      })
      .finally(() => {
        if (active) setModerationLoading(false);
      });
    return () => {
      active = false;
    };
  }, [adminKey, reportStatus]);

  useEffect(() => {
    let active = true;
    setUserLoading(true);
    setUserError(null);
    const statusParam = userStatus === "all" ? undefined : userStatus;
    listAdminUsers(userQuery, statusParam)
      .then((data) => {
        if (active) setUsers(data || []);
      })
      .catch((err) => {
        if (active) setUserError(err instanceof Error ? err.message : "Failed to load users");
      })
      .finally(() => {
        if (active) setUserLoading(false);
      });
    return () => {
      active = false;
    };
  }, [adminKey, userQuery, userStatus]);

  const handleSave = async () => {
    if (!article) return;
    setSaving(true);
    setError(null);

    try {
      const refs = parseReferences(referencesText);
      const updated = await updateAdminArticle(article.id, {
        markdown,
        references: refs.length ? refs : null,
        status: "published",
      });
      setArticle(updated);
      setMarkdown(updated.markdown);
      setReferencesText(formatReferences(updated.references));
      const versionData = await listArticleVersions(article.id);
      setVersions(versionData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!article) return;
    setSaving(true);
    setError(null);
    try {
      const refs = parseReferences(referencesText);
      const updated = await createDraft(article.id, {
        markdown,
        references: refs.length ? refs : null,
      });
      setArticle(updated);
      const versionData = await listArticleVersions(article.id);
      setVersions(versionData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!article) return;
    setSaving(true);
    setError(null);
    try {
      await approveDraft(article.id);
      const versionData = await listArticleVersions(article.id);
      setVersions(versionData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!article) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await publishDraft(article.id);
      setArticle(updated);
      setMarkdown(updated.markdown);
      setReferencesText(formatReferences(updated.references));
      const versionData = await listArticleVersions(article.id);
      setVersions(versionData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (versionId: number, publish: boolean) => {
    if (!article) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await restoreArticleVersion(article.id, { versionId, publish });
      setArticle(updated);
      setMarkdown(updated.markdown);
      setReferencesText(formatReferences(updated.references));
      const versionData = await listArticleVersions(article.id);
      setVersions(versionData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore version");
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

  const handleModerationAction = async (reportId: number, action: "dismiss" | "resolve" | "hide") => {
    setModerationError(null);
    try {
      await actOnCommentReport(reportId, action);
      const statusParam = reportStatus === "all" ? undefined : reportStatus;
      const refreshed = await listCommentReports(statusParam);
      setCommentReports(refreshed || []);
    } catch (err) {
      setModerationError(err instanceof Error ? err.message : "Failed to update report");
    }
  };

  const handleBanUser = async (userId: number) => {
    try {
      const reason = banReason[userId]?.trim();
      const until = banUntil[userId]?.trim();
      const updated = await banAdminUser(userId, {
        reason: reason || undefined,
        until: until || undefined,
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      const updated = await unbanAdminUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Failed to unban user");
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
                      {titleFromSlug(article.category)} · v{article.version} · {article.status || "published"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-700 text-sm font-semibold px-3 py-2 rounded-md hover:bg-zinc-200 disabled:opacity-60"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-amber-500 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-amber-600 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Publish
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Now
                    </button>
                  </div>
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

              <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-700">Version History</h3>
                {versions.length === 0 ? (
                  <div className="text-sm text-zinc-500">No versions yet.</div>
                ) : (
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div key={version.id} className="border border-zinc-200 rounded-md p-3">
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{new Date(version.created_at).toLocaleString()}</span>
                          <span className="uppercase">{version.status}</span>
                        </div>
                        <div className="text-sm text-zinc-700 mt-2 line-clamp-2">
                          {version.markdown.slice(0, 140)}...
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            onClick={() => handleRestoreVersion(version.id, false)}
                            className="px-3 py-1 text-xs font-semibold bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200"
                          >
                            Restore Draft
                          </button>
                          <button
                            onClick={() => handleRestoreVersion(version.id, true)}
                            className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                          >
                            Restore Publish
                          </button>
                          <button
                            onClick={() => setCompareBaseId(version.id)}
                            className="px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100"
                          >
                            Set Base
                          </button>
                          <button
                            onClick={() => setCompareTargetId(version.id)}
                            className="px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Set Compare
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-700">Compare Versions</h3>
                  <div className="text-xs text-zinc-400">
                    {compareBaseId && compareTargetId ? `Base #${compareBaseId} vs #${compareTargetId}` : "Select versions"}
                  </div>
                </div>
                {versions.length < 2 ? (
                  <div className="text-sm text-zinc-500">Create at least two versions to compare.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs font-semibold text-zinc-600 mb-1">Base version</div>
                        <select
                          value={compareBaseId || ""}
                          onChange={(e) => setCompareBaseId(Number(e.target.value) || null)}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs"
                        >
                          {versions.map((version) => (
                            <option key={version.id} value={version.id}>
                              #{version.id} · {new Date(version.created_at).toLocaleString()} · {version.status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-600 mb-1">Compare version</div>
                        <select
                          value={compareTargetId || ""}
                          onChange={(e) => setCompareTargetId(Number(e.target.value) || null)}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs"
                        >
                          {versions.map((version) => (
                            <option key={version.id} value={version.id}>
                              #{version.id} · {new Date(version.created_at).toLocaleString()} · {version.status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="border border-zinc-200 rounded-md bg-zinc-50 max-h-[320px] overflow-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap px-3 py-2">
                        {diffLines.map((line, index) => {
                          const prefix = line.type === "add" ? "+ " : line.type === "remove" ? "- " : "  ";
                          const className =
                            line.type === "add"
                              ? "text-emerald-700"
                              : line.type === "remove"
                              ? "text-red-600"
                              : "text-zinc-700";
                          return (
                            <div key={`${line.type}-${index}`} className={className}>
                              {prefix}
                              {line.text || " "}
                            </div>
                          );
                        })}
                      </pre>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700">Moderation Queue</h3>
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value as typeof reportStatus)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
              >
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="all">All</option>
              </select>
            </div>
            {moderationError ? (
              <div className="text-xs text-red-600">{moderationError}</div>
            ) : null}
            {moderationLoading ? (
              <div className="text-sm text-zinc-500">Loading reports...</div>
            ) : commentReports.length === 0 ? (
              <div className="text-sm text-zinc-500">No reports found.</div>
            ) : (
              <div className="space-y-3">
                {commentReports.map((report) => (
                  <div key={report.id} className="border border-zinc-200 rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{new Date(report.created_at).toLocaleString()}</span>
                      <span className="uppercase">{report.status}</span>
                    </div>
                    <div className="text-sm text-zinc-800">
                      <span className="font-semibold">Article:</span>{" "}
                      {report.article_topic || "Unknown"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Comment status: {report.comment_status || "visible"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Reporter: {report.reporter_email || `User #${report.reporter_id}`}
                    </div>
                    {report.reason ? (
                      <div className="text-xs text-zinc-600">Reason: {report.reason}</div>
                    ) : null}
                    <div className="text-sm text-zinc-700 border border-zinc-100 rounded-md p-2 bg-zinc-50">
                      {report.comment_content}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleModerationAction(report.id, "dismiss")}
                        className="px-3 py-1 text-xs font-semibold bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleModerationAction(report.id, "resolve")}
                        className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleModerationAction(report.id, "hide")}
                        className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Hide Comment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700">User Moderation</h3>
              <select
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value as typeof userStatus)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Search users by email"
            />
            {userError ? <div className="text-xs text-red-600">{userError}</div> : null}
            {userLoading ? (
              <div className="text-sm text-zinc-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-zinc-500">No users found.</div>
            ) : (
              <div className="space-y-3">
                {users.map((userItem) => (
                  <div key={userItem.id} className="border border-zinc-200 rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{userItem.email}</div>
                        <div className="text-xs text-zinc-400">
                          Role: {userItem.role} · Status: {userItem.status || "active"}
                        </div>
                      </div>
                      {userItem.status === "banned" ? (
                        <button
                          onClick={() => handleUnbanUser(userItem.id)}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanUser(userItem.id)}
                          className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Ban
                        </button>
                      )}
                    </div>
                    {userItem.status !== "banned" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          value={banReason[userItem.id] || ""}
                          onChange={(e) =>
                            setBanReason((prev) => ({ ...prev, [userItem.id]: e.target.value }))
                          }
                          className="rounded-md border border-zinc-300 px-3 py-2 text-xs"
                          placeholder="Reason (optional)"
                        />
                        <input
                          value={banUntil[userItem.id] || ""}
                          onChange={(e) =>
                            setBanUntil((prev) => ({ ...prev, [userItem.id]: e.target.value }))
                          }
                          className="rounded-md border border-zinc-300 px-3 py-2 text-xs"
                          placeholder="Ban until (YYYY-MM-DD or ISO)"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">
                        Reason: {userItem.ban_reason || "n/a"}{" "}
                        {userItem.banned_until ? `· Until ${userItem.banned_until}` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

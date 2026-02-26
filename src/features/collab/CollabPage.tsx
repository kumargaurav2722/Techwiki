import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import {
  addTeamMember,
  createTeam,
  listSharedLists,
  listTeams,
  shareReadingList,
  type SharedList,
  type Team,
} from "@/shared/services/collabApi";
import { titleFromSlug } from "@/shared/lib/slug";
import { listReadingLists, type ReadingList } from "@/shared/services/libraryApi";

export function CollabPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);
  const [readingLists, setReadingLists] = useState<ReadingList[]>([]);
  const [shareTargets, setShareTargets] = useState<Record<number, number | null>>({});
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [teamsResult, sharedResult, listsResult] = await Promise.allSettled([
        listTeams(),
        listSharedLists(),
        listReadingLists(),
      ]);
      if (teamsResult.status === "fulfilled") {
        setTeams(teamsResult.value || []);
      } else {
        setTeams([]);
      }
      if (sharedResult.status === "fulfilled") {
        setSharedLists(sharedResult.value || []);
      } else {
        setSharedLists([]);
      }
      if (listsResult.status === "fulfilled") {
        const lists = listsResult.value || [];
        setReadingLists(lists);
        setShareTargets((prev) => {
          const next: Record<number, number | null> = { ...prev };
          lists.forEach((list) => {
            if (!(list.id in next)) next[list.id] = null;
          });
          return next;
        });
      } else {
        setReadingLists([]);
      }
      if (
        teamsResult.status === "rejected" ||
        sharedResult.status === "rejected" ||
        listsResult.status === "rejected"
      ) {
        setError("Some collaboration data could not be loaded.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collaboration data");
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    try {
      const team = await createTeam(teamName.trim());
      setTeams((prev) => [team, ...prev]);
      setTeamName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim() || !selectedTeam) return;
    try {
      await addTeamMember(selectedTeam, memberEmail.trim());
      setMemberEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  const handleShareList = async (listId: number) => {
    const teamId = shareTargets[listId];
    if (!teamId) return;
    try {
      await shareReadingList(listId, teamId);
      setShareMessage("Shared reading list with team.");
      const sharedData = await listSharedLists();
      setSharedLists(sharedData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share list");
    }
  };

  if (!user) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
        <h1 className="text-2xl font-serif font-bold text-zinc-900 mb-2">Collaboration</h1>
        <p className="text-zinc-600">Sign in to manage teams, notes, and shared lists.</p>
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
        <h1 className="text-3xl font-serif font-bold text-zinc-900">Collaboration</h1>
        <p className="text-zinc-600">Teams, shared reading lists, and collaboration tools.</p>
      </header>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {shareMessage ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
          {shareMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <section className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">Create Team</h2>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Team name"
            />
            <button
              onClick={handleCreateTeam}
              className="w-full bg-indigo-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-indigo-700"
            >
              Create Team
            </button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">Your Teams</h2>
            <div className="space-y-2">
              {teams.length === 0 ? (
                <div className="text-sm text-zinc-500">No teams yet.</div>
              ) : (
                teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    className={`w-full text-left px-3 py-2 rounded-md border ${
                      selectedTeam === team.id
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-zinc-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="text-sm font-semibold text-zinc-900">{team.name}</div>
                    <div className="text-xs text-zinc-400">Owner: {team.owner_id}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">Add Team Member</h2>
            <input
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Member email"
            />
            <button
              onClick={handleAddMember}
              disabled={!selectedTeam}
              className="w-full bg-zinc-800 text-white text-sm font-semibold py-2 rounded-md hover:bg-zinc-900 disabled:bg-zinc-300"
            >
              Add Member
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">Share Reading Lists</h2>
          {teams.length === 0 ? (
            <div className="text-sm text-zinc-500">Create a team to share reading lists.</div>
          ) : readingLists.length === 0 ? (
            <div className="text-sm text-zinc-500">No reading lists yet.</div>
          ) : (
            <div className="space-y-3">
              {readingLists.map((list) => (
                <div key={list.id} className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">{list.name}</div>
                      <div className="text-xs text-zinc-400">{list.items.length} items</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={shareTargets[list.id] || ""}
                      onChange={(e) =>
                        setShareTargets((prev) => ({
                          ...prev,
                          [list.id]: Number(e.target.value) || null,
                        }))
                      }
                      className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-xs"
                    >
                      <option value="">Select team...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleShareList(list.id)}
                      disabled={!shareTargets[list.id]}
                      className="px-3 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:bg-zinc-300"
                    >
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-semibold text-zinc-900">Shared Reading Lists</h2>
          {sharedLists.length === 0 ? (
            <div className="text-sm text-zinc-500">No shared lists yet.</div>
          ) : (
            <div className="space-y-4">
              {sharedLists.map((list) => (
                <div key={`${list.list_id}-${list.team_id}`} className="bg-white border border-zinc-200 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-zinc-900">{list.name}</h3>
                  <div className="text-xs text-zinc-400 mb-2">Team #{list.team_id}</div>
                  {list.items.length === 0 ? (
                    <div className="text-sm text-zinc-500">No items yet.</div>
                  ) : (
                    <ul className="space-y-2">
                      {list.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between">
                          <Link
                            to={`/wiki/${item.category}/${item.slug}`}
                            className="text-sm text-zinc-700 hover:text-indigo-600"
                          >
                            {item.topic}
                          </Link>
                          <span className="text-xs text-zinc-400">{titleFromSlug(item.category)}</span>
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
    </div>
  );
}

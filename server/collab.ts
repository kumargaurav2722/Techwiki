import type Database from "better-sqlite3";

export type TeamRecord = {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
};

export type TeamMemberRecord = {
  id: number;
  team_id: number;
  user_id: number;
  role: string;
  created_at: string;
};

export type NoteRecord = {
  id: number;
  user_id: number;
  article_id: number;
  content: string;
  created_at: string;
  updated_at: string;
};

export type CommentRecord = {
  id: number;
  user_id: number;
  article_id: number;
  content: string;
  created_at: string;
};

export function createTeam(db: Database, ownerId: number, name: string) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO teams (name, owner_id, created_at)
     VALUES (?, ?, ?)`
  );
  const info = stmt.run(name, ownerId, now);
  const teamId = Number(info.lastInsertRowid);
  db.prepare(
    `INSERT INTO team_members (team_id, user_id, role, created_at)
     VALUES (?, ?, 'owner', ?)`
  ).run(teamId, ownerId, now);
  return db.prepare("SELECT * FROM teams WHERE id = ?").get(teamId) as TeamRecord | undefined;
}

export function listTeamsForUser(db: Database, userId: number) {
  const stmt = db.prepare(
    `SELECT t.id, t.name, t.owner_id, t.created_at
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE tm.user_id = ?
     ORDER BY datetime(t.created_at) DESC`
  );
  return stmt.all(userId) as TeamRecord[];
}

export function addTeamMember(db: Database, teamId: number, userId: number, role = "member") {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO team_members (team_id, user_id, role, created_at)
     VALUES (?, ?, ?, ?)`
  );
  stmt.run(teamId, userId, role, now);
}

export function listNotes(db: Database, userId: number, articleId: number) {
  const stmt = db.prepare(
    `SELECT id, user_id, article_id, content, created_at, updated_at
     FROM notes
     WHERE user_id = ? AND article_id = ?
     ORDER BY datetime(updated_at) DESC`
  );
  return stmt.all(userId, articleId) as NoteRecord[];
}

export function createNote(db: Database, userId: number, articleId: number, content: string) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO notes (user_id, article_id, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  const info = stmt.run(userId, articleId, content, now, now);
  return db.prepare("SELECT * FROM notes WHERE id = ?").get(info.lastInsertRowid) as NoteRecord | undefined;
}

export function listComments(db: Database, articleId: number) {
  const stmt = db.prepare(
    `SELECT id, user_id, article_id, content, created_at
     FROM comments
     WHERE article_id = ?
     ORDER BY datetime(created_at) DESC`
  );
  return stmt.all(articleId) as CommentRecord[];
}

export function createComment(db: Database, userId: number, articleId: number, content: string) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO comments (user_id, article_id, content, created_at)
     VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(userId, articleId, content, now);
  return db.prepare("SELECT * FROM comments WHERE id = ?").get(info.lastInsertRowid) as CommentRecord | undefined;
}

export function shareReadingList(db: Database, listId: number, teamId: number) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO shared_reading_lists (list_id, team_id, created_at)
     VALUES (?, ?, ?)`
  );
  stmt.run(listId, teamId, now);
}

export function listSharedReadingLists(db: Database, userId: number) {
  const stmt = db.prepare(
    `SELECT rl.id as list_id, rl.name, rl.user_id, tm.team_id
     FROM shared_reading_lists srl
     JOIN team_members tm ON tm.team_id = srl.team_id
     JOIN reading_lists rl ON rl.id = srl.list_id
     WHERE tm.user_id = ?
     ORDER BY datetime(srl.created_at) DESC`
  );
  return stmt.all(userId) as Array<{ list_id: number; name: string; user_id: number; team_id: number }>;
}

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
  updated_at?: string | null;
  status?: string | null;
};

export type CommentReportRecord = {
  id: number;
  comment_id: number;
  reporter_id: number;
  reason: string | null;
  status: string;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: number | null;
  comment_content?: string;
  comment_status?: string;
  comment_user_id?: number;
  reporter_email?: string | null;
  comment_author_email?: string | null;
  article_id?: number;
  article_category?: string;
  article_slug?: string;
  article_topic?: string;
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
     WHERE article_id = ? AND COALESCE(status, 'visible') = 'visible'
     ORDER BY datetime(created_at) DESC`
  );
  return stmt.all(articleId) as CommentRecord[];
}

export function createComment(
  db: Database,
  userId: number,
  articleId: number,
  content: string,
  status: "visible" | "hidden" = "visible"
) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO comments (user_id, article_id, content, created_at, updated_at, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(userId, articleId, content, now, now, status);
  return db.prepare("SELECT * FROM comments WHERE id = ?").get(info.lastInsertRowid) as CommentRecord | undefined;
}

export function getCommentById(db: Database, commentId: number) {
  const stmt = db.prepare("SELECT * FROM comments WHERE id = ?");
  return stmt.get(commentId) as CommentRecord | undefined;
}

export function reportComment(db: Database, commentId: number, reporterId: number, reason?: string) {
  const existing = db
    .prepare("SELECT * FROM comment_reports WHERE comment_id = ? AND reporter_id = ?")
    .get(commentId, reporterId) as CommentReportRecord | undefined;
  if (existing) return existing;

  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO comment_reports (comment_id, reporter_id, reason, status, created_at)
     VALUES (?, ?, ?, 'open', ?)`
  );
  const info = stmt.run(commentId, reporterId, reason || null, now);
  return db.prepare("SELECT * FROM comment_reports WHERE id = ?").get(info.lastInsertRowid) as
    | CommentReportRecord
    | undefined;
}

export function getCommentReportById(db: Database, reportId: number) {
  return db.prepare("SELECT * FROM comment_reports WHERE id = ?").get(reportId) as
    | CommentReportRecord
    | undefined;
}

export function listCommentReports(db: Database, status?: string) {
  const base = `
    SELECT
      cr.id,
      cr.comment_id,
      cr.reporter_id,
      cr.reason,
      cr.status,
      cr.created_at,
      cr.resolved_at,
      cr.resolved_by,
      c.content as comment_content,
      COALESCE(c.status, 'visible') as comment_status,
      c.user_id as comment_user_id,
      ru.email as reporter_email,
      cu.email as comment_author_email,
      a.id as article_id,
      a.category as article_category,
      a.slug as article_slug,
      a.topic as article_topic
    FROM comment_reports cr
    JOIN comments c ON c.id = cr.comment_id
    LEFT JOIN users ru ON ru.id = cr.reporter_id
    LEFT JOIN users cu ON cu.id = c.user_id
    LEFT JOIN articles a ON a.id = c.article_id
  `;
  const order = " ORDER BY datetime(cr.created_at) DESC";
  if (status) {
    return db.prepare(`${base} WHERE cr.status = ?${order}`).all(status) as CommentReportRecord[];
  }
  return db.prepare(`${base}${order}`).all() as CommentReportRecord[];
}

export function updateCommentReportStatus(
  db: Database,
  reportId: number,
  status: "open" | "resolved" | "dismissed",
  resolvedBy: number | null
) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `UPDATE comment_reports
     SET status = ?, resolved_at = ?, resolved_by = ?
     WHERE id = ?`
  );
  stmt.run(status, now, resolvedBy, reportId);
  return db.prepare("SELECT * FROM comment_reports WHERE id = ?").get(reportId) as CommentReportRecord | undefined;
}

export function updateCommentStatus(db: Database, commentId: number, status: "visible" | "hidden" | "deleted") {
  const now = new Date().toISOString();
  db.prepare(`UPDATE comments SET status = ?, updated_at = ? WHERE id = ?`).run(status, now, commentId);
  return getCommentById(db, commentId);
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

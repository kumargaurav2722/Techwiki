import type Database from "better-sqlite3";

export type UserRecord = {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  status?: string;
  ban_reason?: string | null;
  banned_until?: string | null;
  created_at: string;
};

export function getUserByEmail(db: Database, email: string) {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
  return stmt.get(email) as UserRecord | undefined;
}

export function getUserById(db: Database, id: number) {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
  return stmt.get(id) as UserRecord | undefined;
}

export function createUser(
  db: Database,
  input: { email: string; passwordHash: string; role?: string }
) {
  const now = new Date().toISOString();
  const role = input.role || "user";

  const stmt = db.prepare(
    `INSERT INTO users (email, password_hash, role, created_at)
     VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(input.email, input.passwordHash, role, now);
  return getUserById(db, Number(info.lastInsertRowid));
}

export function listUsers(db: Database, options?: { query?: string; status?: string }) {
  const query = options?.query?.trim().toLowerCase();
  const status = options?.status;

  let sql = "SELECT id, email, role, status, ban_reason, banned_until, created_at FROM users";
  const clauses: string[] = [];
  const params: Array<string> = [];

  if (query) {
    clauses.push("LOWER(email) LIKE ?");
    params.push(`%${query}%`);
  }

  if (status) {
    clauses.push("status = ?");
    params.push(status);
  }

  if (clauses.length > 0) {
    sql += ` WHERE ${clauses.join(" AND ")}`;
  }

  sql += " ORDER BY datetime(created_at) DESC";
  return db.prepare(sql).all(...params) as UserRecord[];
}

export function updateUserBan(
  db: Database,
  userId: number,
  input: { status: "active" | "banned"; banReason?: string | null; bannedUntil?: string | null }
) {
  db.prepare(
    `UPDATE users
     SET status = ?, ban_reason = ?, banned_until = ?
     WHERE id = ?`
  ).run(input.status, input.banReason ?? null, input.bannedUntil ?? null, userId);
  return getUserById(db, userId);
}

export function clearExpiredBan(db: Database, userId: number) {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE users
     SET status = 'active', ban_reason = NULL, banned_until = NULL
     WHERE id = ? AND banned_until IS NOT NULL AND datetime(banned_until) <= datetime(?)`
  ).run(userId, now);
}

import type Database from "better-sqlite3";

export type UserRecord = {
  id: number;
  email: string;
  password_hash: string;
  role: string;
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

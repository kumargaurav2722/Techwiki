import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type Database from "better-sqlite3";
import { createUser, getUserByEmail } from "./users";

export type AuthUser = {
  id: number;
  email: string;
  role: string;
};

const JWT_SECRET = process.env.JWT_SECRET || "techwiki_dev_secret";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: number;
      email: string;
      role: string;
    };
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function ensureAdminUser(db: Database) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = getUserByEmail(db, email);
  if (existing) return;

  const passwordHash = await hashPassword(password);
  createUser(db, { email, passwordHash, role: "admin" });
}

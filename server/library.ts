import type Database from "better-sqlite3";

export type BookmarkRecord = {
  id: number;
  user_id: number;
  category: string;
  slug: string;
  topic: string;
  created_at: string;
};

export type ReadingListRecord = {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
};

export type ReadingListItemRecord = {
  id: number;
  list_id: number;
  category: string;
  slug: string;
  topic: string;
  created_at: string;
};

export function listBookmarks(db: Database, userId: number) {
  const stmt = db.prepare(
    `SELECT id, user_id, category, slug, topic, created_at
     FROM bookmarks
     WHERE user_id = ?
     ORDER BY datetime(created_at) DESC`
  );
  return stmt.all(userId) as BookmarkRecord[];
}

export function upsertBookmark(
  db: Database,
  userId: number,
  input: { category: string; slug: string; topic: string }
) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO bookmarks (user_id, category, slug, topic, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  stmt.run(userId, input.category, input.slug, input.topic, now);
  const existing = db
    .prepare(
      `SELECT id, user_id, category, slug, topic, created_at
       FROM bookmarks
       WHERE user_id = ? AND category = ? AND slug = ? LIMIT 1`
    )
    .get(userId, input.category, input.slug) as BookmarkRecord | undefined;
  return existing;
}

export function deleteBookmark(db: Database, userId: number, bookmarkId: number) {
  const stmt = db.prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?");
  stmt.run(bookmarkId, userId);
}

export function getReadingLists(db: Database, userId: number) {
  const lists = db
    .prepare(
      `SELECT id, user_id, name, created_at
       FROM reading_lists
       WHERE user_id = ?
       ORDER BY datetime(created_at) DESC`
    )
    .all(userId) as ReadingListRecord[];

  const itemsStmt = db.prepare(
    `SELECT id, list_id, category, slug, topic, created_at
     FROM reading_list_items
     WHERE list_id = ?
     ORDER BY datetime(created_at) DESC`
  );

  return lists.map((list) => ({
    ...list,
    items: itemsStmt.all(list.id) as ReadingListItemRecord[],
  }));
}

export function getReadingListById(db: Database, listId: number) {
  const stmt = db.prepare(
    `SELECT id, user_id, name, created_at
     FROM reading_lists
     WHERE id = ?`
  );
  return stmt.get(listId) as ReadingListRecord | undefined;
}

export function getReadingListItems(db: Database, listId: number) {
  const stmt = db.prepare(
    `SELECT id, list_id, category, slug, topic, created_at
     FROM reading_list_items
     WHERE list_id = ?
     ORDER BY datetime(created_at) DESC`
  );
  return stmt.all(listId) as ReadingListItemRecord[];
}

export function createReadingList(db: Database, userId: number, name: string) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO reading_lists (user_id, name, created_at)
     VALUES (?, ?, ?)`
  );
  const info = stmt.run(userId, name, now);
  return db
    .prepare("SELECT id, user_id, name, created_at FROM reading_lists WHERE id = ?")
    .get(info.lastInsertRowid) as ReadingListRecord | undefined;
}

export function deleteReadingList(db: Database, userId: number, listId: number) {
  const stmt = db.prepare("DELETE FROM reading_lists WHERE id = ? AND user_id = ?");
  stmt.run(listId, userId);
}

export function addReadingListItem(
  db: Database,
  listId: number,
  input: { category: string; slug: string; topic: string }
) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO reading_list_items (list_id, category, slug, topic, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  stmt.run(listId, input.category, input.slug, input.topic, now);
  const existing = db
    .prepare(
      `SELECT id, list_id, category, slug, topic, created_at
       FROM reading_list_items
       WHERE list_id = ? AND category = ? AND slug = ? LIMIT 1`
    )
    .get(listId, input.category, input.slug) as ReadingListItemRecord | undefined;
  return existing;
}

export function deleteReadingListItem(db: Database, listId: number, itemId: number) {
  const stmt = db.prepare(
    "DELETE FROM reading_list_items WHERE id = ? AND list_id = ?"
  );
  stmt.run(itemId, listId);
}

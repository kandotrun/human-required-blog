import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type Comment = {
  id: string;
  slug: string;
  body: string;
  humanLabel: string;
  createdAt: string;
};

type StoredComment = Comment & {
  nullifierDigest: string;
};

type AddCommentInput = {
  slug: string;
  body: string;
  nullifierHash: string;
  now?: number;
};

const MAX_COMMENT_LENGTH = 1000;

type CommentRow = {
  id: string;
  slug: string;
  body: string;
  human_label: string;
  nullifier_digest: string;
  created_at: string;
};

function getCommentsDbPath() {
  return process.env.COMMENTS_DB_PATH || path.join(process.cwd(), "data", "comments.sqlite");
}

function digestNullifier(nullifierHash: string) {
  return createHash("sha256").update(`human-required-comment:${nullifierHash}`).digest("hex");
}

function humanLabelFor(nullifierHash: string) {
  return `Human ${digestNullifier(nullifierHash).slice(0, 8)}`;
}

function sanitizeSlug(slug: string) {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "");
  if (!safeSlug) throw new Error("Post slug is required");
  return safeSlug;
}

function openCommentsDb() {
  const dbPath = getCommentsDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      body TEXT NOT NULL,
      human_label TEXT NOT NULL,
      nullifier_digest TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_comments_slug_created_at
      ON comments (slug, created_at);
  `);
  return db;
}

function rowToStoredComment(row: CommentRow): StoredComment {
  return {
    id: row.id,
    slug: row.slug,
    body: row.body,
    humanLabel: row.human_label,
    nullifierDigest: row.nullifier_digest,
    createdAt: row.created_at,
  };
}

function toPublicComment(comment: StoredComment): Comment {
  const { nullifierDigest: _nullifierDigest, ...publicComment } = comment;
  return publicComment;
}

export function addComment({
  slug,
  body,
  nullifierHash,
  now = Math.floor(Date.now() / 1000),
}: AddCommentInput): Comment {
  const safeSlug = sanitizeSlug(slug);
  if (!nullifierHash) throw new Error("Human session is required");

  const trimmedBody = body.trim();
  if (!trimmedBody) throw new Error("Comment is required");
  if (trimmedBody.length > MAX_COMMENT_LENGTH)
    throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);

  const storedComment: StoredComment = {
    id: randomUUID(),
    slug: safeSlug,
    body: trimmedBody,
    humanLabel: humanLabelFor(nullifierHash),
    nullifierDigest: digestNullifier(nullifierHash),
    createdAt: new Date(now * 1000).toISOString(),
  };

  const db = openCommentsDb();
  try {
    db.prepare(`
      INSERT INTO comments (id, slug, body, human_label, nullifier_digest, created_at)
      VALUES (@id, @slug, @body, @humanLabel, @nullifierDigest, @createdAt)
    `).run(storedComment);
  } finally {
    db.close();
  }

  return toPublicComment(storedComment);
}

export function listCommentsForPost(slug: string): Comment[] {
  const safeSlug = sanitizeSlug(slug);
  const db = openCommentsDb();
  try {
    const rows = db
      .prepare(
        `
          SELECT id, slug, body, human_label, nullifier_digest, created_at
          FROM comments
          WHERE slug = ?
          ORDER BY created_at ASC
        `,
      )
      .all(safeSlug) as CommentRow[];
    return rows.map(rowToStoredComment).map(toPublicComment);
  } finally {
    db.close();
  }
}

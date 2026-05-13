import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addComment, listCommentsForPost } from "../lib/comments";

let commentsDbPath = "";
let legacyCommentsFile = "";

beforeEach(() => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "human-required-comments-"));
  commentsDbPath = path.join(dir, "comments.sqlite");
  legacyCommentsFile = path.join(dir, "comments.json");
  process.env.COMMENTS_DB_PATH = commentsDbPath;
  process.env.COMMENTS_FILE = legacyCommentsFile;
});

afterEach(() => {
  delete process.env.COMMENTS_DB_PATH;
  delete process.env.COMMENTS_FILE;
  if (commentsDbPath) fs.rmSync(path.dirname(commentsDbPath), { recursive: true, force: true });
});

describe("comments", () => {
  it("stores a trimmed human comment for a post in SQLite without exposing raw nullifier hashes", () => {
    const comment = addComment({
      slug: "machines-write-humans-read",
      body: "  I am a verified human.  ",
      nullifierHash: "nullifier-secret-123",
      now: 1_700_000_000,
    });

    expect(comment).toMatchObject({
      slug: "machines-write-humans-read",
      body: "I am a verified human.",
      humanLabel: expect.stringMatching(/^Human [a-f0-9]{8}$/),
      createdAt: "2023-11-14T22:13:20.000Z",
    });
    expect(JSON.stringify(comment)).not.toContain("nullifier-secret-123");
    expect(fs.existsSync(commentsDbPath)).toBe(true);
    expect(fs.existsSync(legacyCommentsFile)).toBe(false);

    const sqliteBytes = fs.readFileSync(commentsDbPath);
    expect(sqliteBytes.includes(Buffer.from("nullifier-secret-123"))).toBe(false);
    expect(listCommentsForPost("machines-write-humans-read")).toEqual([comment]);
  });

  it("rejects empty comments and comments over 1000 characters", () => {
    expect(() => addComment({ slug: "post", body: "   ", nullifierHash: "n" })).toThrow(/Comment is required/);
    expect(() => addComment({ slug: "post", body: "x".repeat(1001), nullifierHash: "n" })).toThrow(/1000 characters/);
  });

  it("lists only comments for the requested post in chronological order", () => {
    const second = addComment({ slug: "target", body: "second", nullifierHash: "b", now: 20 });
    addComment({ slug: "other", body: "other", nullifierHash: "c", now: 30 });
    const first = addComment({ slug: "target", body: "first", nullifierHash: "a", now: 10 });

    expect(listCommentsForPost("target")).toEqual([first, second]);
  });
});

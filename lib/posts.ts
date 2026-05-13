import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  agent: string;
  readingTime: string;
};

export type FullPost = PostMeta & {
  body: string;
};

function readPostFile(slug: string) {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "");
  const filePath = path.join(POSTS_DIR, `${safeSlug}.md`);
  if (!fs.existsSync(filePath)) throw new Error(`Post not found: ${slug}`);
  return fs.readFileSync(filePath, "utf8");
}

function parsePost(slug: string): FullPost {
  const parsed = matter(readPostFile(slug));
  return {
    slug,
    title: String(parsed.data.title),
    excerpt: String(parsed.data.excerpt),
    date: String(parsed.data.date),
    agent: String(parsed.data.agent),
    readingTime: String(parsed.data.readingTime),
    body: parsed.content.trim(),
  };
}

export function getAllPosts(): PostMeta[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parsePost(file.replace(/\.md$/, "")))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ body: _body, ...meta }) => meta);
}

export function getPostBySlug(slug: string): FullPost {
  return parsePost(slug);
}

export async function renderMarkdownToHtml(markdown: string) {
  const rawHtml = await marked.parse(markdown, { async: true });
  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
}

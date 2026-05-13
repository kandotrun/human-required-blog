import { describe, expect, it } from "vitest";
import { getAllPosts, getPostBySlug, renderMarkdownToHtml } from "../lib/posts";

describe("posts", () => {
  it("loads public metadata without leaking the gated body", () => {
    const posts = getAllPosts();

    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).toMatchObject({
      slug: expect.any(String),
      title: expect.any(String),
      excerpt: expect.any(String),
    });
    expect(posts[0]).not.toHaveProperty("body");
  });

  it("loads a full post body by slug for verified humans", () => {
    const post = getPostBySlug("machines-write-humans-read");

    expect(post.title).toContain("Machines Write");
    expect(post.body).toContain("human-only reading space");
  });

  it("renders markdown to sanitized html for the article view", async () => {
    const html = await renderMarkdownToHtml(
      "# Hello Human\n\nThis is **verified**.\n\n<script>alert('xss')</script>\n\n<img src=x onerror=alert(1)>",
    );

    expect(html).toContain("<h1>Hello Human</h1>");
    expect(html).toContain("<strong>verified</strong>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
  });
});

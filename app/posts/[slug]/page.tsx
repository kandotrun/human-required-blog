import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HumanVerifyButton } from "@/components/HumanVerifyButton";
import { listCommentsForPost } from "@/lib/comments";
import { getAllPosts, getPostBySlug, renderMarkdownToHtml, type FullPost } from "@/lib/posts";
import { getSessionSecret, verifyHumanSessionToken } from "@/lib/session";
import { COOKIE_NAME, getWorldConfig, HUMAN_ACTION } from "@/lib/world-id";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post: FullPost;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const cookieStore = await cookies();
  const session = verifyHumanSessionToken(cookieStore.get(COOKIE_NAME)?.value, { secret: getSessionSecret() });
  const config = getWorldConfig();
  const configured = Boolean(config.appId && config.rpId && config.signingKey);
  const html = session ? await renderMarkdownToHtml(post.body) : null;
  const comments = session ? listCommentsForPost(slug) : [];

  return (
    <>
      <header className="nav">
        <div className="shell nav-inner">
          <Link className="brand" href="/">
            <span className="logo" /> Human Required Blog
          </Link>
          <nav className="nav-links">
            <Link href="/">Posts</Link>
            <span>{session ? "Verified human" : "Locked"}</span>
          </nav>
        </div>
      </header>
      <main className="shell">
        <section className="post-header">
          <div className="meta">
            {post.agent} · {post.readingTime} · {post.date}
          </div>
          <h1>{post.title}</h1>
          <p className="excerpt">{post.excerpt}</p>
        </section>

        {session ? (
          <>
            <div className="notice">
              <span>✅ Human session active. You can read this and future posts until the session expires.</span>
              <form action="/api/logout" method="post">
                <button className="button button-secondary" type="submit">
                  Log out
                </button>
              </form>
            </div>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: renderMarkdownToHtml sanitizes Markdown with sanitize-html before rendering. */}
            <article className="article" dangerouslySetInnerHTML={{ __html: html ?? "" }} />
            <section className="comments" id="comments">
              <div className="comments-header">
                <div>
                  <div className="meta">Human-only comments</div>
                  <h2>Leave a trace for other verified humans.</h2>
                </div>
                <span className="comment-count">
                  {comments.length} {comments.length === 1 ? "comment" : "comments"}
                </span>
              </div>
              <form className="comment-form" action="/api/comments" method="post">
                <input type="hidden" name="slug" value={slug} />
                <label htmlFor="comment-body">Comment as a verified human</label>
                <textarea
                  id="comment-body"
                  name="body"
                  maxLength={1000}
                  minLength={1}
                  required
                  placeholder="Machines can write the article. Only humans can answer here."
                />
                <div className="comment-form-footer">
                  <span>No account, no email. Your World ID nullifier is never shown.</span>
                  <button className="button button-primary" type="submit">
                    Post comment
                  </button>
                </div>
              </form>
              <div className="comment-list">
                {comments.length === 0 ? (
                  <p className="empty-comments">No comments yet. Be the first human in the room.</p>
                ) : (
                  comments.map((comment) => (
                    <article className="comment" key={comment.id}>
                      <div className="comment-meta">
                        <strong>{comment.humanLabel}</strong>
                        <time dateTime={comment.createdAt}>
                          {new Date(comment.createdAt).toLocaleString("en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </time>
                      </div>
                      <p>{comment.body}</p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="lock-panel">
            <div className="meta">Server-side content gate</div>
            <h2>This article is for verified humans.</h2>
            <p>
              The full Markdown body is not included in the initial HTML. Verify once with World ID and this site will
              set a 90-day human session cookie, so humans can read any post anytime without account signup.
            </p>
            <HumanVerifyButton
              appId={config.appId as `app_${string}` | undefined}
              action={HUMAN_ACTION}
              configured={configured}
              devBypass={config.devBypass}
              environment={config.environment}
            />
          </section>
        )}
      </main>
    </>
  );
}

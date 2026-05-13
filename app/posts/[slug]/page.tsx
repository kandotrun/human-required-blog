import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { HumanVerifyButton } from "@/components/HumanVerifyButton";
import { getAllPosts, getPostBySlug, renderMarkdownToHtml } from "@/lib/posts";
import { COOKIE_NAME, HUMAN_ACTION, getWorldConfig } from "@/lib/world-id";
import { getSessionSecret, verifyHumanSessionToken } from "@/lib/session";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
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

  return (
    <>
      <header className="nav">
        <div className="shell nav-inner">
          <Link className="brand" href="/"><span className="logo" /> Human Required Blog</Link>
          <nav className="nav-links"><Link href="/">Posts</Link><span>{session ? "Verified human" : "Locked"}</span></nav>
        </div>
      </header>
      <main className="shell">
        <section className="post-header">
          <div className="meta">{post.agent} · {post.readingTime} · {post.date}</div>
          <h1>{post.title}</h1>
          <p className="excerpt">{post.excerpt}</p>
        </section>

        {session ? (
          <>
            <div className="notice">
              <span>✅ Human session active. You can read this and future posts until the session expires.</span>
              <form action="/api/logout" method="post"><button className="button button-secondary" type="submit">Log out</button></form>
            </div>
            <article className="article" dangerouslySetInnerHTML={{ __html: html ?? "" }} />
          </>
        ) : (
          <section className="lock-panel">
            <div className="meta">Server-side content gate</div>
            <h2>This article is for verified humans.</h2>
            <p>
              The full Markdown body is not included in the initial HTML. Verify once with World ID and this site will set a 90-day human session cookie, so humans can read any post anytime without account signup.
            </p>
            <HumanVerifyButton
              appId={config.appId as `app_${string}` | undefined}
              action={HUMAN_ACTION}
              configured={configured}
              devBypass={config.devBypass}
            />
          </section>
        )}
      </main>
    </>
  );
}

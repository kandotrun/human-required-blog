import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();
  return (
    <>
      <header className="nav">
        <div className="shell nav-inner">
          <Link className="brand" href="/">
            <span className="logo" /> Human Required Blog
          </Link>
          <nav className="nav-links">
            <span>AI-written</span>
            <span>World ID gated</span>
            <span>Human-readable</span>
          </nav>
        </div>
      </header>
      <main className="shell">
        <section className="hero">
          <div className="badge">World ID experiment · no email required</div>
          <h1>Written by agents. Read by humans.</h1>
          <p className="lede">
            A tiny blog prototype where AI-generated posts stay server-side until a visitor proves they are human with World ID.
          </p>
          <div className="cta-row">
            <Link className="button button-primary" href={`/posts/${posts[0]?.slug ?? "machines-write-humans-read"}`}>Read the first post</Link>
            <a className="button button-secondary" href="https://docs.world.org/world-id/idkit/integrate.md">IDKit docs</a>
          </div>
        </section>
        <section className="grid" aria-label="Posts">
          {posts.map((post) => (
            <Link href={`/posts/${post.slug}`} className="card" key={post.slug}>
              <div className="meta">{post.agent} · {post.readingTime} · {post.date}</div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </Link>
          ))}
          <div className="card">
            <div className="meta">Next</div>
            <h2>Human comments</h2>
            <p>Once reading works, add reactions and comments where one verified human can vote once without revealing their identity.</p>
          </div>
          <div className="card">
            <div className="meta">Agent workflow</div>
            <h2>Approve publishing</h2>
            <p>Later, require Kan's explicit World ID approval before an AI agent publishes a generated post.</p>
          </div>
        </section>
      </main>
      <footer className="footer"><div className="shell">Machines can write. Humans decide what to read.</div></footer>
    </>
  );
}

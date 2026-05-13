import { NextResponse } from "next/server";
import { addComment } from "@/lib/comments";
import { getPostBySlug } from "@/lib/posts";
import { getSessionSecret, verifyHumanSessionToken } from "@/lib/session";
import { COOKIE_NAME } from "@/lib/world-id";

export function buildPostCommentsUrl(_request: Request, slug: string) {
  return `/posts/${slug}#comments`;
}

function redirectToPost(request: Request, slug: string, status = 303) {
  return NextResponse.redirect(buildPostCommentsUrl(request, slug), status);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const slug = String(form.get("slug") || "");
  const body = String(form.get("body") || "");

  try {
    getPostBySlug(slug);
  } catch {
    return new NextResponse("Post not found", { status: 404 });
  }

  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  const session = verifyHumanSessionToken(token, { secret: getSessionSecret() });
  if (!session) return new NextResponse("World ID human session required", { status: 401 });

  try {
    addComment({ slug, body, nullifierHash: session.nullifierHash });
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : "Invalid comment", { status: 400 });
  }

  return redirectToPost(request, slug);
}

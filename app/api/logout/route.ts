import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/world-id";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}

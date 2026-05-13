import { describe, expect, it } from "vitest";
import { buildPostCommentsUrl } from "../app/api/comments/route";

describe("comments route redirects", () => {
  it("builds a relative comments URL instead of trusting forwarded host headers", () => {
    const request = new Request("http://localhost:3000/api/comments", {
      method: "POST",
      headers: {
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      },
    });

    expect(buildPostCommentsUrl(request, "machines-write-humans-read")).toBe(
      "/posts/machines-write-humans-read#comments",
    );
  });
});

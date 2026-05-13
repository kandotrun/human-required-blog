import { describe, expect, it } from "vitest";
import { GET } from "../app/api/rp-context/route";

describe("rp-context route", () => {
  it("rejects arbitrary World ID action signing requests", async () => {
    const response = await GET(new Request("http://localhost:3000/api/rp-context?action=delete-everything"));

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Unsupported action");
  });
});

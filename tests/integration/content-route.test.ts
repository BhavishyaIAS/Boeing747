import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@server/errors";
import type { NextRequest } from "next/server";

vi.mock("@server/auth-context", () => ({
  resolveActor: vi.fn(),
  requireExamId: vi.fn(),
}));
vi.mock("@modules/content", async (importActual) => {
  const actual = await importActual<typeof import("@modules/content")>();
  return {
    ...actual,
    contentService: { create: vi.fn(), list: vi.fn(), getById: vi.fn() },
  };
});

import { POST } from "@/app/api/v1/content/route";
import { GET as GET_BY_ID } from "@/app/api/v1/content/[id]/route";
import { resolveActor, requireExamId } from "@server/auth-context";
import { contentService } from "@modules/content";

const actor = { userId: "u1", email: "e@x.com", roles: [{ role: "CONTENT_EDITOR" as const, examId: null }] };

function postReq(body: unknown): NextRequest {
  return new Request("http://x/api/v1/content?exam=exam-1", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/v1/content", () => {
  beforeEach(() => {
    vi.mocked(resolveActor).mockResolvedValue(actor);
    vi.mocked(requireExamId).mockReturnValue("exam-1");
    vi.mocked(contentService.create).mockReset();
  });

  it("returns 422 when the body is invalid", async () => {
    const res = await POST(postReq({ type: "NOTE", title: "no" })); // title too short
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("VALIDATION");
    expect(vi.mocked(contentService.create)).not.toHaveBeenCalled();
  });

  it("creates a draft and returns 201", async () => {
    vi.mocked(contentService.create).mockResolvedValue({ id: "c1", title: "Right to Life" } as never);
    const res = await POST(postReq({ type: "NOTE", title: "Right to Life", body: {} }));
    expect(res.status).toBe(201);
    expect((await res.json()).data).toMatchObject({ id: "c1" });
  });
});

describe("GET /api/v1/content/[id]", () => {
  beforeEach(() => {
    vi.mocked(resolveActor).mockResolvedValue(actor);
    vi.mocked(requireExamId).mockReturnValue("exam-1");
    vi.mocked(contentService.getById).mockReset();
  });

  it("maps a NotFoundError to a 404 envelope", async () => {
    vi.mocked(contentService.getById).mockRejectedValue(new NotFoundError("Content not found"));
    const req = new Request("http://x/api/v1/content/c9?exam=exam-1") as unknown as NextRequest;
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: "c9" }) });
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });
});

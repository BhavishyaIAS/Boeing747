import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError, ValidationError } from "@server/errors";
import type { NextRequest } from "next/server";

// Mock the auth/exam resolvers and the taxonomy service; keep the real Zod
// schema and api-envelope helpers so the route's HTTP contract is exercised.
vi.mock("@server/auth-context", () => ({
  resolveActor: vi.fn(),
  requireExamId: vi.fn(),
}));
vi.mock("@modules/taxonomy", async (importActual) => {
  const actual = await importActual<typeof import("@modules/taxonomy")>();
  return { ...actual, taxonomyService: { listNodes: vi.fn(), getNodeBySlug: vi.fn() } };
});

import { GET } from "@/app/api/v1/syllabus/route";
import { resolveActor, requireExamId } from "@server/auth-context";
import { taxonomyService } from "@modules/taxonomy";

const actor = { userId: "u1", email: "s@x.com", roles: [{ role: "STUDENT" as const, examId: null }] };
const req = (url: string) => new Request(url) as unknown as NextRequest;

describe("GET /api/v1/syllabus", () => {
  beforeEach(() => {
    vi.mocked(resolveActor).mockReset();
    vi.mocked(requireExamId).mockReset();
    vi.mocked(taxonomyService.listNodes).mockReset();
  });

  it("returns 401 when there is no session", async () => {
    vi.mocked(resolveActor).mockRejectedValue(new UnauthorizedError());
    const res = await GET(req("http://x/api/v1/syllabus"));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHORIZED");
  });

  it("returns 422 when the exam scope is missing", async () => {
    vi.mocked(resolveActor).mockResolvedValue(actor);
    vi.mocked(requireExamId).mockImplementation(() => {
      throw new ValidationError("Exam scope required");
    });
    const res = await GET(req("http://x/api/v1/syllabus"));
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("VALIDATION");
  });

  it("returns 200 with the node list in the envelope", async () => {
    vi.mocked(resolveActor).mockResolvedValue(actor);
    vi.mocked(requireExamId).mockReturnValue("exam-1");
    vi.mocked(taxonomyService.listNodes).mockResolvedValue([
      {
        id: "n1",
        type: "SUBJECT",
        title: "Polity",
        slug: "polity",
        summary: null,
        orderIndex: 0,
        examAngle: null,
        hasChildren: true,
      },
    ]);
    const res = await GET(req("http://x/api/v1/syllabus"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toBeNull();
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ slug: "polity", hasChildren: true });
    expect(vi.mocked(taxonomyService.listNodes)).toHaveBeenCalledWith(actor, "exam-1", null);
  });
});

import { describe, expect, it } from "vitest";
import { PyqService } from "./pyq.service";
import type {
  PyqDetail,
  PyqFilters,
  PyqRepository,
  PyqSummary,
} from "./pyq.repository";
import { ForbiddenError, NotFoundError } from "@server/errors";
import type { Actor } from "@server/context";

const student: Actor = { userId: "u1", email: "s@x.com", roles: [{ role: "STUDENT", examId: null }] };
const noRoles: Actor = { userId: "u2", email: "n@x.com", roles: [] };

function summary(id: string): PyqSummary {
  return {
    id,
    slug: `q-${id}`,
    title: `Question ${id}`,
    stage: "MAINS",
    kind: "DESCRIPTIVE",
    year: 2023,
    paper: "Paper II",
    marks: "15",
    difficulty: "MEDIUM",
    topics: [],
  };
}

class FakePyqRepo implements PyqRepository {
  rows: PyqSummary[] = [];
  detail: PyqDetail | null = null;
  lastFilters: PyqFilters | null = null;

  async list(_examId: string, filters: PyqFilters): Promise<PyqSummary[]> {
    this.lastFilters = filters;
    return this.rows;
  }
  async years(): Promise<number[]> {
    return [2023, 2022];
  }
  async getBySlug(): Promise<PyqDetail | null> {
    return this.detail;
  }
}

describe("PyqService", () => {
  it("requires pyq:read", async () => {
    const svc = new PyqService(new FakePyqRepo());
    await expect(svc.list(noRoles, "e1", { limit: 10 })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("paginates with a cursor when there is more", async () => {
    const repo = new FakePyqRepo();
    repo.rows = [summary("a"), summary("b"), summary("c")];
    const page = await new PyqService(repo).list(student, "e1", { limit: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBe("b");
    expect(repo.lastFilters?.limit).toBe(2);
  });

  it("returns no cursor on the last page", async () => {
    const repo = new FakePyqRepo();
    repo.rows = [summary("a")];
    const page = await new PyqService(repo).list(student, "e1", { limit: 20 });
    expect(page.nextCursor).toBeNull();
  });

  it("throws NotFound for an unknown slug", async () => {
    const svc = new PyqService(new FakePyqRepo());
    await expect(svc.getBySlug(student, "e1", "missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});

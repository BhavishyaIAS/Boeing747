import { describe, expect, it } from "vitest";
import { CurrentAffairsService } from "./current-affairs.service";
import type {
  CaDetail,
  CaFilters,
  CaSummary,
  CurrentAffairsRepository,
} from "./current-affairs.repository";
import { ForbiddenError, NotFoundError } from "@server/errors";
import type { Actor } from "@server/context";

const student: Actor = { userId: "u1", email: "s@x.com", roles: [{ role: "STUDENT", examId: null }] };
const noRoles: Actor = { userId: "u2", email: "n@x.com", roles: [] };

function summary(id: string): CaSummary {
  return {
    id,
    slug: `ca-${id}`,
    title: `Update ${id}`,
    cadence: "DAILY",
    region: "NATIONAL",
    category: "Economy",
    publishDate: new Date("2026-07-04"),
    topics: [],
  };
}

class FakeCaRepo implements CurrentAffairsRepository {
  rows: CaSummary[] = [];
  detail: CaDetail | null = null;
  lastFilters: CaFilters | null = null;
  async list(_examId: string, filters: CaFilters): Promise<CaSummary[]> {
    this.lastFilters = filters;
    return this.rows;
  }
  async categories(): Promise<string[]> {
    return ["Economy", "Environment"];
  }
  async getBySlug(): Promise<CaDetail | null> {
    return this.detail;
  }
}

describe("CurrentAffairsService", () => {
  it("requires ca:read", async () => {
    const svc = new CurrentAffairsService(new FakeCaRepo());
    await expect(svc.list(noRoles, "e1", { limit: 10 })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("passes filters through and paginates", async () => {
    const repo = new FakeCaRepo();
    repo.rows = [summary("a"), summary("b"), summary("c")];
    const page = await new CurrentAffairsService(repo).list(student, "e1", {
      limit: 2,
      region: "ANDHRA_PRADESH",
    });
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBe("b");
    expect(repo.lastFilters?.region).toBe("ANDHRA_PRADESH");
  });

  it("throws NotFound for an unknown slug", async () => {
    const svc = new CurrentAffairsService(new FakeCaRepo());
    await expect(svc.getBySlug(student, "e1", "missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});

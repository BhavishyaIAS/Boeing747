import { describe, expect, it } from "vitest";
import type { NodeProgressStatus } from "@prisma/client";
import { NodeProgressService, nextRevisionDate } from "./node-progress.service";
import type {
  NodeProgressRepository,
  NodeStatusRecord,
  UpsertNodeStatusData,
} from "./node-progress.repository";
import { ForbiddenError } from "@server/errors";
import type { Actor } from "@server/context";

const student: Actor = { userId: "u1", email: "s@x.com", roles: [{ role: "STUDENT", examId: null }] };
const noRoles: Actor = { userId: "u2", email: "n@x.com", roles: [] };

class FakeNodeProgressRepo implements NodeProgressRepository {
  status = new Map<string, NodeStatusRecord>();
  upserts: Array<{ nodeId: string; data: UpsertNodeStatusData }> = [];

  async getStatus(_userId: string, nodeId: string): Promise<NodeStatusRecord | null> {
    return this.status.get(nodeId) ?? null;
  }
  async getStatuses(
    _userId: string,
    nodeIds: string[],
  ): Promise<Record<string, NodeProgressStatus>> {
    const out: Record<string, NodeProgressStatus> = {};
    for (const id of nodeIds) {
      const s = this.status.get(id);
      if (s) out[id] = s.status;
    }
    return out;
  }
  async upsert(_userId: string, nodeId: string, data: UpsertNodeStatusData): Promise<void> {
    this.upserts.push({ nodeId, data });
    this.status.set(nodeId, { status: data.status, revisionCount: data.revisionCount });
  }
}

describe("nextRevisionDate", () => {
  const now = new Date("2026-07-05T00:00:00Z");
  it("uses increasing intervals and caps at the last one", () => {
    expect(nextRevisionDate(0, now).getTime()).toBe(now.getTime() + 3 * 86400000);
    expect(nextRevisionDate(1, now).getTime()).toBe(now.getTime() + 7 * 86400000);
    expect(nextRevisionDate(99, now).getTime()).toBe(now.getTime() + 60 * 86400000);
  });
});

describe("NodeProgressService.markStatus", () => {
  const now = new Date("2026-07-05T00:00:00Z");

  it("requires syllabus:read", async () => {
    const svc = new NodeProgressService(new FakeNodeProgressRepo());
    await expect(svc.markStatus(noRoles, "exam-1", "n1", "MASTERED")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("schedules a revision when mastered", async () => {
    const repo = new FakeNodeProgressRepo();
    await new NodeProgressService(repo).markStatus(student, "exam-1", "n1", "MASTERED", now);
    const entry = repo.upserts[0];
    expect(entry?.data.status).toBe("MASTERED");
    expect(entry?.data.nextRevisionAt?.getTime()).toBe(now.getTime() + 3 * 86400000);
  });

  it("increments the revision count and reschedules on REVISED", async () => {
    const repo = new FakeNodeProgressRepo();
    repo.status.set("n1", { status: "MASTERED", revisionCount: 1 });
    await new NodeProgressService(repo).markStatus(student, "exam-1", "n1", "REVISED", now);
    const entry = repo.upserts[0];
    expect(entry?.data.revisionCount).toBe(2);
    expect(entry?.data.nextRevisionAt?.getTime()).toBe(now.getTime() + 14 * 86400000);
  });

  it("clears the revision schedule for in-progress", async () => {
    const repo = new FakeNodeProgressRepo();
    await new NodeProgressService(repo).markStatus(student, "exam-1", "n1", "IN_PROGRESS", now);
    expect(repo.upserts[0]?.data.nextRevisionAt).toBeNull();
  });
});

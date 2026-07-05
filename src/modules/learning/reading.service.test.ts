import { describe, expect, it } from "vitest";
import { ReadingService } from "./reading.service";
import type { ReadingRepository } from "./reading.repository";
import { ForbiddenError } from "@server/errors";
import type { Actor } from "@server/context";

const student: Actor = { userId: "u1", email: "s@x.com", roles: [{ role: "STUDENT", examId: null }] };
const noRoles: Actor = { userId: "u2", email: "n@x.com", roles: [] };

class FakeReadingRepo implements ReadingRepository {
  progress = 0;
  saved: { progress: number; seconds: number } | null = null;
  async getProgress(): Promise<number> {
    return this.progress;
  }
  async upsert(_u: string, _c: string, progressPercent: number, addSeconds: number): Promise<void> {
    this.saved = { progress: progressPercent, seconds: addSeconds };
  }
}

describe("ReadingService.record", () => {
  it("requires content:read", async () => {
    const svc = new ReadingService(new FakeReadingRepo());
    await expect(
      svc.record(noRoles, "e1", "c1", { progressPercent: 10, durationSeconds: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("clamps progress to 0–100 and rounds", async () => {
    const repo = new FakeReadingRepo();
    await new ReadingService(repo).record(student, "e1", "c1", {
      progressPercent: 142.6,
      durationSeconds: 3,
    });
    expect(repo.saved?.progress).toBe(100);
  });

  it("never decreases progress on scroll-up", async () => {
    const repo = new FakeReadingRepo();
    repo.progress = 80;
    await new ReadingService(repo).record(student, "e1", "c1", {
      progressPercent: 30,
      durationSeconds: 2,
    });
    expect(repo.saved?.progress).toBe(80);
  });
});

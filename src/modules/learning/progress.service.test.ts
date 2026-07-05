import { describe, expect, it } from "vitest";
import { ProgressService, computeStreak } from "./progress.service";
import type {
  ContinueReadingItem,
  ProgressRepository,
  RevisionDueItem,
  SubjectCoverageRow,
} from "./progress.repository";
import { ForbiddenError } from "@server/errors";
import type { Actor } from "@server/context";

const student: Actor = { userId: "u1", email: "s@x.com", roles: [{ role: "STUDENT", examId: null }] };
const noRoles: Actor = { userId: "u2", email: "n@x.com", roles: [] };

class FakeProgressRepo implements ProgressRepository {
  continueReadingRows: ContinueReadingItem[] = [];
  weeklySeconds = 0;
  readingEvents = 0;
  revisionDueRows: RevisionDueItem[] = [];
  revisionCount = 0;
  coverageRows: SubjectCoverageRow[] = [];
  studyDates: Date[] = [];

  async continueReading(): Promise<ContinueReadingItem[]> {
    return this.continueReadingRows;
  }
  async weeklyStudySeconds(): Promise<number> {
    return this.weeklySeconds;
  }
  async readingEventsSince(): Promise<number> {
    return this.readingEvents;
  }
  async revisionDue(): Promise<RevisionDueItem[]> {
    return this.revisionDueRows;
  }
  async revisionDueCount(): Promise<number> {
    return this.revisionCount;
  }
  async subjectCoverage(): Promise<SubjectCoverageRow[]> {
    return this.coverageRows;
  }
  async activeStudyDates(): Promise<Date[]> {
    return this.studyDates;
  }
}

describe("computeStreak", () => {
  const today = new Date("2026-07-05T09:00:00Z");
  const day = (n: number) => new Date(today.getTime() - n * 86400000);

  it("counts consecutive days including today", () => {
    expect(computeStreak([day(0), day(1), day(2)], today)).toBe(3);
  });

  it("keeps a streak that ran through yesterday even if today is idle", () => {
    expect(computeStreak([day(1), day(2)], today)).toBe(2);
  });

  it("breaks on a gap", () => {
    expect(computeStreak([day(0), day(2), day(3)], today)).toBe(1);
  });

  it("is zero with no activity", () => {
    expect(computeStreak([], today)).toBe(0);
  });
});

describe("ProgressService.getDashboard", () => {
  it("requires syllabus:read", async () => {
    const svc = new ProgressService(new FakeProgressRepo());
    await expect(svc.getDashboard(noRoles, "exam-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("computes coverage %, focus areas, and study minutes", async () => {
    const repo = new FakeProgressRepo();
    repo.weeklySeconds = 3720; // 62 min
    repo.readingEvents = 14;
    repo.revisionCount = 8;
    repo.coverageRows = [
      { subjectId: "s1", title: "Polity", slug: "polity", total: 10, mastered: 7 },
      { subjectId: "s2", title: "Economy", slug: "economy", total: 10, mastered: 2 },
      { subjectId: "s3", title: "Geography", slug: "geography", total: 0, mastered: 0 },
    ];
    const dash = await new ProgressService(repo).getDashboard(student, "exam-1");

    expect(dash.weeklyStudyMinutes).toBe(62);
    expect(dash.topicsReadThisWeek).toBe(14);
    expect(dash.revisionDueCount).toBe(8);
    expect(dash.coverage[0]).toMatchObject({ title: "Polity", percent: 70 });
    expect(dash.coverage[2]).toMatchObject({ title: "Geography", percent: 0 });
    // Only subjects with content and < 40% coverage are focus areas.
    expect(dash.focusAreas).toEqual(["Economy"]);
  });

  it("returns sensible zeros for a brand-new user", async () => {
    const dash = await new ProgressService(new FakeProgressRepo()).getDashboard(student, "exam-1");
    expect(dash.weeklyStudyMinutes).toBe(0);
    expect(dash.streakDays).toBe(0);
    expect(dash.continueReading).toEqual([]);
    expect(dash.focusAreas).toEqual([]);
  });
});

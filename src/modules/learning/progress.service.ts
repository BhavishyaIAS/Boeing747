import type { Actor } from "@server/context";
import { authorize } from "@server/authorize";
import { PERMISSIONS } from "@modules/identity";
import {
  PrismaProgressRepository,
  type ContinueReadingItem,
  type ProgressRepository,
  type RevisionDueItem,
} from "./progress.repository";

export interface SubjectCoverage {
  title: string;
  slug: string;
  percent: number;
  total: number;
}

export interface DashboardData {
  weeklyStudyMinutes: number;
  topicsReadThisWeek: number;
  revisionDueCount: number;
  streakDays: number;
  continueReading: ContinueReadingItem[];
  revisionDue: RevisionDueItem[];
  coverage: SubjectCoverage[];
  focusAreas: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

/**
 * Consecutive-day streak ending today (inclusive) from a set of active-day
 * timestamps. Pure so it can be unit-tested deterministically.
 */
export function computeStreak(activeDates: Date[], now: Date): number {
  const days = new Set(activeDates.map(toDayKey));
  let streak = 0;
  const cursor = new Date(now.getTime());
  // A gap on "today" doesn't break a streak that ran through yesterday.
  if (!days.has(toDayKey(cursor))) cursor.setTime(cursor.getTime() - DAY_MS);
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - DAY_MS);
  }
  return streak;
}

/**
 * Aggregates the student dashboard from the progress read model. Read-only;
 * requires syllabus:read (held by every signed-in student).
 */
export class ProgressService {
  constructor(private readonly repo: ProgressRepository = new PrismaProgressRepository()) {}

  async getDashboard(actor: Actor, examId: string, now: Date = new Date()): Promise<DashboardData> {
    authorize(actor, PERMISSIONS.SYLLABUS_READ, { examId });
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const streakWindow = new Date(now.getTime() - 60 * DAY_MS);
    const userId = actor.userId;

    const [
      continueReading,
      weeklySeconds,
      topicsReadThisWeek,
      revisionDue,
      revisionDueCount,
      coverageRows,
      studyDates,
    ] = await Promise.all([
      this.repo.continueReading(userId, examId, 3),
      this.repo.weeklyStudySeconds(userId, weekAgo),
      this.repo.readingEventsSince(userId, weekAgo),
      this.repo.revisionDue(userId, examId, now, 5),
      this.repo.revisionDueCount(userId, examId, now),
      this.repo.subjectCoverage(userId, examId),
      this.repo.activeStudyDates(userId, streakWindow),
    ]);

    const coverage: SubjectCoverage[] = coverageRows.map((c) => ({
      title: c.title,
      slug: c.slug,
      total: c.total,
      percent: c.total === 0 ? 0 : Math.round((c.mastered / c.total) * 100),
    }));

    const focusAreas = coverage
      .filter((c) => c.total > 0 && c.percent < 40)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 3)
      .map((c) => c.title);

    return {
      weeklyStudyMinutes: Math.round(weeklySeconds / 60),
      topicsReadThisWeek,
      revisionDueCount,
      streakDays: computeStreak(studyDates, now),
      continueReading,
      revisionDue,
      coverage,
      focusAreas,
    };
  }
}

export const progressService = new ProgressService();

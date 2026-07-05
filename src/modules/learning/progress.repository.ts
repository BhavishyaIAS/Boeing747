import type { ContentType, PrismaClient } from "@prisma/client";
import { prisma } from "@lib/db";

export interface ContinueReadingItem {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  progressPercent: number;
  readAt: Date;
}

export interface RevisionDueItem {
  nodeId: string;
  title: string;
  slug: string;
}

export interface SubjectCoverageRow {
  subjectId: string;
  title: string;
  slug: string;
  total: number;
  mastered: number;
}

/** Read model powering the student dashboard. All reads are user + exam scoped. */
export interface ProgressRepository {
  continueReading(userId: string, examId: string, limit: number): Promise<ContinueReadingItem[]>;
  weeklyStudySeconds(userId: string, since: Date): Promise<number>;
  readingEventsSince(userId: string, since: Date): Promise<number>;
  revisionDue(userId: string, examId: string, now: Date, limit: number): Promise<RevisionDueItem[]>;
  revisionDueCount(userId: string, examId: string, now: Date): Promise<number>;
  subjectCoverage(userId: string, examId: string): Promise<SubjectCoverageRow[]>;
  activeStudyDates(userId: string, since: Date): Promise<Date[]>;
}

export class PrismaProgressRepository implements ProgressRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async continueReading(
    userId: string,
    examId: string,
    limit: number,
  ): Promise<ContinueReadingItem[]> {
    const rows = await this.db.readingHistory.findMany({
      where: { userId, item: { examId, status: "PUBLISHED", deletedAt: null } },
      orderBy: { readAt: "desc" },
      distinct: ["contentItemId"],
      take: limit,
      include: { item: { select: { id: true, title: true, slug: true, type: true } } },
    });
    return rows.map((r) => ({
      id: r.item.id,
      title: r.item.title,
      slug: r.item.slug,
      type: r.item.type,
      progressPercent: r.progressPercent,
      readAt: r.readAt,
    }));
  }

  async weeklyStudySeconds(userId: string, since: Date): Promise<number> {
    const agg = await this.db.studySession.aggregate({
      where: { userId, startedAt: { gte: since } },
      _sum: { durationSeconds: true },
    });
    return agg._sum.durationSeconds ?? 0;
  }

  readingEventsSince(userId: string, since: Date): Promise<number> {
    return this.db.readingHistory.count({ where: { userId, readAt: { gte: since } } });
  }

  async revisionDue(
    userId: string,
    examId: string,
    now: Date,
    limit: number,
  ): Promise<RevisionDueItem[]> {
    const rows = await this.db.userNodeProgress.findMany({
      where: { userId, nextRevisionAt: { lte: now }, node: { examId, deletedAt: null } },
      orderBy: { nextRevisionAt: "asc" },
      take: limit,
      include: { node: { select: { id: true, title: true, slug: true } } },
    });
    return rows.map((r) => ({ nodeId: r.node.id, title: r.node.title, slug: r.node.slug }));
  }

  revisionDueCount(userId: string, examId: string, now: Date): Promise<number> {
    return this.db.userNodeProgress.count({
      where: { userId, nextRevisionAt: { lte: now }, node: { examId, deletedAt: null } },
    });
  }

  async subjectCoverage(userId: string, examId: string): Promise<SubjectCoverageRow[]> {
    const subjects = await this.db.syllabusNode.findMany({
      where: { examId, type: "SUBJECT", parentId: null, deletedAt: null },
      orderBy: { orderIndex: "asc" },
      select: { id: true, title: true, slug: true },
    });

    return Promise.all(
      subjects.map(async (subject) => {
        const closures = await this.db.syllabusClosure.findMany({
          where: { ancestorId: subject.id, depth: { gt: 0 } },
          select: { descendantId: true },
        });
        const descendantIds = closures.map((c) => c.descendantId);
        const total = descendantIds.length;
        const mastered =
          total === 0
            ? 0
            : await this.db.userNodeProgress.count({
                where: { userId, status: "MASTERED", nodeId: { in: descendantIds } },
              });
        return { subjectId: subject.id, title: subject.title, slug: subject.slug, total, mastered };
      }),
    );
  }

  async activeStudyDates(userId: string, since: Date): Promise<Date[]> {
    const rows = await this.db.studySession.findMany({
      where: { userId, startedAt: { gte: since } },
      select: { startedAt: true },
    });
    return rows.map((r) => r.startedAt);
  }
}

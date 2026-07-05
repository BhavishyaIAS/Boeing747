import type { PrismaClient } from "@prisma/client";
import { prisma } from "@lib/db";

/**
 * Reading progress persistence. One row per (user, content item) — the latest
 * position — which "continue reading" reads back. Duration accumulates.
 */
export interface ReadingRepository {
  getProgress(userId: string, contentItemId: string): Promise<number>;
  upsert(
    userId: string,
    contentItemId: string,
    progressPercent: number,
    addSeconds: number,
  ): Promise<void>;
}

export class PrismaReadingRepository implements ReadingRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async getProgress(userId: string, contentItemId: string): Promise<number> {
    const row = await this.db.readingHistory.findFirst({
      where: { userId, contentItemId },
      orderBy: { readAt: "desc" },
      select: { progressPercent: true },
    });
    return row?.progressPercent ?? 0;
  }

  async upsert(
    userId: string,
    contentItemId: string,
    progressPercent: number,
    addSeconds: number,
  ): Promise<void> {
    const updated = await this.db.readingHistory.updateMany({
      where: { userId, contentItemId },
      data: {
        progressPercent,
        readAt: new Date(),
        durationSeconds: { increment: addSeconds },
      },
    });
    if (updated.count === 0) {
      await this.db.readingHistory.create({
        data: { userId, contentItemId, progressPercent, durationSeconds: addSeconds },
      });
    }
  }
}

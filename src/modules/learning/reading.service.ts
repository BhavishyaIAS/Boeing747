import type { Actor } from "@server/context";
import { authorize } from "@server/authorize";
import { PERMISSIONS } from "@modules/identity";
import { PrismaReadingRepository, type ReadingRepository } from "./reading.repository";

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Records reading progress. Progress is monotonic (never decreases on scroll-up)
 * and duration accumulates. Requires content:read.
 */
export class ReadingService {
  constructor(private readonly repo: ReadingRepository = new PrismaReadingRepository()) {}

  async record(
    actor: Actor,
    examId: string,
    contentItemId: string,
    input: { progressPercent: number; durationSeconds: number },
  ): Promise<void> {
    authorize(actor, PERMISSIONS.CONTENT_READ, { examId });
    const incoming = clampPercent(input.progressPercent);
    const previous = await this.repo.getProgress(actor.userId, contentItemId);
    const progress = Math.max(previous, incoming);
    const seconds = Math.max(0, Math.round(input.durationSeconds));
    await this.repo.upsert(actor.userId, contentItemId, progress, seconds);
  }

  async getProgress(actor: Actor, examId: string, contentItemId: string): Promise<number> {
    authorize(actor, PERMISSIONS.CONTENT_READ, { examId });
    return this.repo.getProgress(actor.userId, contentItemId);
  }
}

export const readingService = new ReadingService();

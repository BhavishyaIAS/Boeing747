import type { NodeProgressStatus } from "@prisma/client";
import type { Actor } from "@server/context";
import { authorize } from "@server/authorize";
import { PERMISSIONS } from "@modules/identity";
import {
  PrismaNodeProgressRepository,
  type NodeProgressRepository,
} from "./node-progress.repository";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Spaced-revision intervals (days) indexed by how many times revised. */
const REVISION_INTERVALS_DAYS = [3, 7, 14, 30, 60] as const;

/** Next revision date given how many revisions have happened so far. */
export function nextRevisionDate(revisionCount: number, now: Date): Date {
  const idx = Math.min(Math.max(revisionCount, 0), REVISION_INTERVALS_DAYS.length - 1);
  const days = REVISION_INTERVALS_DAYS[idx] ?? REVISION_INTERVALS_DAYS[0];
  return new Date(now.getTime() + days * DAY_MS);
}

/**
 * Per-user syllabus-node progress. Marking MASTERED/REVISED schedules the next
 * spaced revision. Requires syllabus:read (held by every student) and operates
 * on the actor's own progress.
 */
export class NodeProgressService {
  constructor(private readonly repo: NodeProgressRepository = new PrismaNodeProgressRepository()) {}

  async markStatus(
    actor: Actor,
    examId: string,
    nodeId: string,
    status: NodeProgressStatus,
    now: Date = new Date(),
  ): Promise<void> {
    authorize(actor, PERMISSIONS.SYLLABUS_READ, { examId });

    const existing = await this.repo.getStatus(actor.userId, nodeId);
    let revisionCount = existing?.revisionCount ?? 0;
    let nextRevisionAt: Date | null = null;

    if (status === "REVISED") {
      revisionCount += 1;
      nextRevisionAt = nextRevisionDate(revisionCount, now);
    } else if (status === "MASTERED") {
      nextRevisionAt = nextRevisionDate(revisionCount, now);
    }

    await this.repo.upsert(actor.userId, nodeId, {
      status,
      revisionCount,
      lastVisitedAt: now,
      nextRevisionAt,
    });
  }

  async getStatuses(
    actor: Actor,
    examId: string,
    nodeIds: string[],
  ): Promise<Record<string, NodeProgressStatus>> {
    authorize(actor, PERMISSIONS.SYLLABUS_READ, { examId });
    return this.repo.getStatuses(actor.userId, nodeIds);
  }
}

export const nodeProgressService = new NodeProgressService();

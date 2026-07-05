import type { NodeProgressStatus, PrismaClient } from "@prisma/client";
import { prisma } from "@lib/db";

export interface NodeStatusRecord {
  status: NodeProgressStatus;
  revisionCount: number;
}

export interface UpsertNodeStatusData {
  status: NodeProgressStatus;
  revisionCount: number;
  lastVisitedAt: Date;
  nextRevisionAt: Date | null;
}

export interface NodeProgressRepository {
  getStatus(userId: string, nodeId: string): Promise<NodeStatusRecord | null>;
  getStatuses(userId: string, nodeIds: string[]): Promise<Record<string, NodeProgressStatus>>;
  upsert(userId: string, nodeId: string, data: UpsertNodeStatusData): Promise<void>;
}

export class PrismaNodeProgressRepository implements NodeProgressRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async getStatus(userId: string, nodeId: string): Promise<NodeStatusRecord | null> {
    const row = await this.db.userNodeProgress.findUnique({
      where: { userId_nodeId: { userId, nodeId } },
      select: { status: true, revisionCount: true },
    });
    return row;
  }

  async getStatuses(
    userId: string,
    nodeIds: string[],
  ): Promise<Record<string, NodeProgressStatus>> {
    if (nodeIds.length === 0) return {};
    const rows = await this.db.userNodeProgress.findMany({
      where: { userId, nodeId: { in: nodeIds } },
      select: { nodeId: true, status: true },
    });
    return Object.fromEntries(rows.map((r) => [r.nodeId, r.status]));
  }

  async upsert(userId: string, nodeId: string, data: UpsertNodeStatusData): Promise<void> {
    await this.db.userNodeProgress.upsert({
      where: { userId_nodeId: { userId, nodeId } },
      update: {
        status: data.status,
        revisionCount: data.revisionCount,
        lastVisitedAt: data.lastVisitedAt,
        nextRevisionAt: data.nextRevisionAt,
      },
      create: {
        userId,
        nodeId,
        status: data.status,
        revisionCount: data.revisionCount,
        lastVisitedAt: data.lastVisitedAt,
        nextRevisionAt: data.nextRevisionAt,
      },
    });
  }
}

import { prisma } from "@lib/db";

/** A single privileged/mutating action to record in the audit trail. */
export interface AuditEntry {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  examId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Audit sink abstraction so services can be unit-tested with a spy. The default
 * implementation writes to the `audit_log` table.
 */
export interface AuditSink {
  record(entry: AuditEntry): Promise<void>;
}

export const prismaAuditSink: AuditSink = {
  async record(entry) {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        examId: entry.examId ?? null,
        metadata: (entry.metadata ?? {}) as object,
      },
    });
  },
};

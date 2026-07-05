import type { RoleKey } from "@prisma/client";
import type { Actor } from "@server/context";
import { authorize } from "@server/authorize";
import { prismaAuditSink, type AuditSink } from "@server/audit";
import { PERMISSIONS } from "./rbac";
import {
  PrismaIdentityRepository,
  type IdentityRepository,
  type UserWithRoles,
} from "./identity.repository";

export interface UsersPage {
  users: UserWithRoles[];
  nextCursor: string | null;
}

/**
 * Admin-facing user & role management. Requires `user:manage`; granting or
 * revoking SUPER_ADMIN additionally requires `role:manage` (super admin only).
 */
export class AdminIdentityService {
  constructor(
    private readonly repo: IdentityRepository = new PrismaIdentityRepository(),
    private readonly audit: AuditSink = prismaAuditSink,
  ) {}

  async listUsers(actor: Actor, params: { limit: number; cursor?: string | null }): Promise<UsersPage> {
    authorize(actor, PERMISSIONS.USER_MANAGE);
    const rows = await this.repo.listUsers({ limit: params.limit, cursor: params.cursor ?? null });
    const hasMore = rows.length > params.limit;
    const users = hasMore ? rows.slice(0, params.limit) : rows;
    const last = users[users.length - 1];
    return { users, nextCursor: hasMore && last ? last.user.id : null };
  }

  async assignRole(
    actor: Actor,
    userId: string,
    role: RoleKey,
    examId: string | null = null,
  ): Promise<void> {
    this.authorizeRoleChange(actor, role);
    await this.repo.assignRole(userId, role, examId);
    await this.audit.record({
      actorId: actor.userId,
      action: "user.role.assign",
      targetType: "user",
      targetId: userId,
      metadata: { role, examId },
    });
  }

  async removeRole(actor: Actor, userId: string, role: RoleKey): Promise<void> {
    this.authorizeRoleChange(actor, role);
    await this.repo.removeRole(userId, role);
    await this.audit.record({
      actorId: actor.userId,
      action: "user.role.remove",
      targetType: "user",
      targetId: userId,
      metadata: { role },
    });
  }

  private authorizeRoleChange(actor: Actor, role: RoleKey): void {
    authorize(actor, PERMISSIONS.USER_MANAGE);
    if (role === "SUPER_ADMIN") authorize(actor, PERMISSIONS.ROLE_MANAGE);
  }
}

export const adminIdentityService = new AdminIdentityService();

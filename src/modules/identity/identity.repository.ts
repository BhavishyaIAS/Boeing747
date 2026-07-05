import type { PrismaClient, RoleKey, User, UserStatus } from "@prisma/client";
import { prisma } from "@lib/db";
import { isExpired } from "./tokens";

export interface CreateUserData {
  email: string;
  name: string | null;
  passwordHash: string | null;
  status: UserStatus;
  primaryExamId?: string | null;
}

export interface StoredToken {
  identifier: string;
  token: string;
  expires: Date;
}

export interface ActorRoleRow {
  role: RoleKey;
  examId: string | null;
}

export interface UserWithRoles {
  user: User;
  roles: ActorRoleRow[];
}

export interface IdentityRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: CreateUserData): Promise<User>;
  setPasswordHash(userId: string, passwordHash: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
  assignRole(userId: string, role: RoleKey, examId?: string | null): Promise<void>;
  removeRole(userId: string, role: RoleKey): Promise<void>;
  listUsers(params: { limit: number; cursor?: string | null }): Promise<UserWithRoles[]>;

  createToken(token: StoredToken): Promise<void>;
  /** Deletes the matching token (single-use) and reports whether it was valid. */
  consumeToken(identifier: string, tokenHash: string): Promise<boolean>;
  deleteTokens(identifier: string): Promise<void>;

  loadActorRoles(userId: string): Promise<ActorRoleRow[]>;
}

export class PrismaIdentityRepository implements IdentityRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  }

  findUserById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  createUser(data: CreateUserData): Promise<User> {
    return this.db.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        status: data.status,
        primaryExamId: data.primaryExamId ?? null,
      },
    });
  }

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.db.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date(), status: "ACTIVE" },
    });
  }

  async assignRole(userId: string, role: RoleKey, examId: string | null = null): Promise<void> {
    const roleRow = await this.db.role.findUnique({ where: { key: role } });
    if (!roleRow) throw new Error(`Role ${role} is not seeded`);
    await this.db.userRole.upsert({
      where: { userId_roleId: { userId, roleId: roleRow.id } },
      update: {},
      create: { userId, roleId: roleRow.id, examId },
    });
  }

  async removeRole(userId: string, role: RoleKey): Promise<void> {
    const roleRow = await this.db.role.findUnique({ where: { key: role } });
    if (!roleRow) return;
    await this.db.userRole.deleteMany({ where: { userId, roleId: roleRow.id } });
  }

  async listUsers(params: { limit: number; cursor?: string | null }): Promise<UserWithRoles[]> {
    const rows = await this.db.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      include: { roles: { include: { role: true } } },
    });
    return rows.map((r) => {
      const { roles, ...user } = r;
      return { user, roles: roles.map((ur) => ({ role: ur.role.key, examId: ur.examId })) };
    });
  }

  async createToken(token: StoredToken): Promise<void> {
    await this.db.verificationToken.create({ data: token });
  }

  async consumeToken(identifier: string, tokenHash: string): Promise<boolean> {
    const row = await this.db.verificationToken.findUnique({ where: { token: tokenHash } });
    if (!row || row.identifier !== identifier) return false;
    await this.db.verificationToken.delete({ where: { token: tokenHash } });
    return !isExpired(row.expires);
  }

  async deleteTokens(identifier: string): Promise<void> {
    await this.db.verificationToken.deleteMany({ where: { identifier } });
  }

  async loadActorRoles(userId: string): Promise<ActorRoleRow[]> {
    const rows = await this.db.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return rows.map((r) => ({ role: r.role.key, examId: r.examId }));
  }
}

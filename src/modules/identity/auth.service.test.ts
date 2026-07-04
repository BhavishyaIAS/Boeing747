import { describe, expect, it } from "vitest";
import type { RoleKey, User } from "@prisma/client";
import { AuthService } from "./auth.service";
import type {
  ActorRoleRow,
  CreateUserData,
  IdentityRepository,
  StoredToken,
} from "./identity.repository";
import { isExpired } from "./tokens";
import type { MailMessage, MailPort } from "@lib/ports/mail";
import { ConflictError, UnauthorizedError, ValidationError } from "@server/errors";

function makeUser(p: { id: string; email: string } & Partial<User>): User {
  const now = new Date();
  return {
    id: p.id,
    email: p.email,
    emailVerifiedAt: p.emailVerifiedAt ?? null,
    passwordHash: p.passwordHash ?? null,
    name: p.name ?? null,
    avatarUrl: null,
    phone: null,
    status: p.status ?? "PENDING",
    primaryExamId: null,
    preferences: {},
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

class FakeIdentityRepo implements IdentityRepository {
  private seq = 0;
  users = new Map<string, User>(); // by id
  tokens = new Map<string, StoredToken>(); // by token hash
  roles = new Map<string, ActorRoleRow[]>(); // by userId

  private byEmail(email: string): User | undefined {
    return [...this.users.values()].find((u) => u.email === email);
  }
  async findUserByEmail(email: string): Promise<User | null> {
    return this.byEmail(email.trim().toLowerCase()) ?? null;
  }
  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
  async createUser(data: CreateUserData): Promise<User> {
    const user = makeUser({
      id: `u${++this.seq}`,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      status: data.status,
    });
    this.users.set(user.id, user);
    return user;
  }
  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    const u = this.users.get(userId);
    if (u) this.users.set(userId, { ...u, passwordHash });
  }
  async markEmailVerified(userId: string): Promise<void> {
    const u = this.users.get(userId);
    if (u) this.users.set(userId, { ...u, emailVerifiedAt: new Date(), status: "ACTIVE" });
  }
  async assignRole(userId: string, role: RoleKey, examId: string | null = null): Promise<void> {
    const list = this.roles.get(userId) ?? [];
    list.push({ role, examId });
    this.roles.set(userId, list);
  }
  async createToken(token: StoredToken): Promise<void> {
    this.tokens.set(token.token, token);
  }
  async consumeToken(identifier: string, tokenHash: string): Promise<boolean> {
    const row = this.tokens.get(tokenHash);
    if (!row || row.identifier !== identifier) return false;
    this.tokens.delete(tokenHash);
    return !isExpired(row.expires);
  }
  async deleteTokens(identifier: string): Promise<void> {
    for (const [k, v] of this.tokens) if (v.identifier === identifier) this.tokens.delete(k);
  }
  async loadActorRoles(userId: string): Promise<ActorRoleRow[]> {
    return this.roles.get(userId) ?? [];
  }
}

class FakeMail implements MailPort {
  sent: MailMessage[] = [];
  async send(message: MailMessage): Promise<void> {
    this.sent.push(message);
  }
}

function setup() {
  const repo = new FakeIdentityRepo();
  const mail = new FakeMail();
  const svc = new AuthService({ repo, mail, otpFactory: () => "123456", tokenFactory: () => "reset-token-xyz" });
  return { repo, mail, svc };
}

const EMAIL = "aspirant@example.com";
const PW = "Password1";

describe("AuthService — registration & verification", () => {
  it("registers a PENDING user, assigns STUDENT, and emails an OTP", async () => {
    const { repo, mail, svc } = setup();
    const user = await svc.register({ name: "Ravi", email: EMAIL, password: PW });

    expect(user.emailVerified).toBe(false);
    const stored = await repo.findUserByEmail(EMAIL);
    expect(stored?.status).toBe("PENDING");
    expect((await repo.loadActorRoles(stored!.id))[0]?.role).toBe("STUDENT");
    expect(mail.sent.some((m) => m.to === EMAIL)).toBe(true);
    expect(repo.tokens.size).toBe(1); // hashed, not the raw OTP
    expect([...repo.tokens.keys()][0]).not.toBe("123456");
  });

  it("rejects duplicate registration", async () => {
    const { svc } = setup();
    await svc.register({ name: "Ravi", email: EMAIL, password: PW });
    await expect(svc.register({ name: "Ravi", email: EMAIL, password: PW })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("verifies email with the correct OTP and rejects a wrong one", async () => {
    const { repo, svc } = setup();
    await svc.register({ name: "Ravi", email: EMAIL, password: PW });
    await expect(svc.verifyEmail(EMAIL, "000000")).rejects.toBeInstanceOf(ValidationError);
    await svc.verifyEmail(EMAIL, "123456");
    expect((await repo.findUserByEmail(EMAIL))?.emailVerifiedAt).not.toBeNull();
  });
});

describe("AuthService — credentials login", () => {
  it("blocks unverified accounts, then succeeds once verified", async () => {
    const { svc } = setup();
    await svc.register({ name: "Ravi", email: EMAIL, password: PW });
    await expect(svc.verifyCredentials(EMAIL, PW)).rejects.toBeInstanceOf(UnauthorizedError);
    await svc.verifyEmail(EMAIL, "123456");
    await expect(svc.verifyCredentials(EMAIL, PW)).resolves.toMatchObject({ email: EMAIL });
    await expect(svc.verifyCredentials(EMAIL, "WrongPass9")).resolves.toBeNull();
  });
});

describe("AuthService — password reset", () => {
  it("does not leak unknown emails and never sends for them", async () => {
    const { mail, svc } = setup();
    await svc.requestPasswordReset("nobody@example.com");
    expect(mail.sent).toHaveLength(0);
  });

  it("resets the password with a valid token", async () => {
    const { svc } = setup();
    await svc.register({ name: "Ravi", email: EMAIL, password: PW });
    await svc.verifyEmail(EMAIL, "123456");
    await svc.requestPasswordReset(EMAIL);
    await svc.resetPassword(EMAIL, "reset-token-xyz", "BrandNew1");
    await expect(svc.verifyCredentials(EMAIL, "BrandNew1")).resolves.toMatchObject({ email: EMAIL });
  });

  it("rejects an invalid reset token", async () => {
    const { svc } = setup();
    await svc.register({ name: "Ravi", email: EMAIL, password: PW });
    await expect(svc.resetPassword(EMAIL, "wrong-token", "BrandNew1")).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe("AuthService — OTP login & OAuth", () => {
  it("verifies a login OTP", async () => {
    const { svc } = setup();
    await svc.register({ name: "Ravi", email: EMAIL, password: PW });
    await svc.requestLoginOtp(EMAIL);
    await expect(svc.verifyLoginOtp(EMAIL, "123456")).resolves.toMatchObject({ email: EMAIL });
    await expect(svc.verifyLoginOtp(EMAIL, "123456")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("provisions an OAuth user as ACTIVE + verified with STUDENT role", async () => {
    const { repo, svc } = setup();
    const user = await svc.ensureOAuthUser("g@example.com", "Google User");
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(user.status).toBe("ACTIVE");
    expect((await repo.loadActorRoles(user.id))[0]?.role).toBe("STUDENT");
  });
});

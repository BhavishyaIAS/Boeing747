import type { User } from "@prisma/client";
import type { MailPort } from "@lib/ports/mail";
import { consoleMailPort } from "@lib/adapters/mail.console";
import { ConflictError, UnauthorizedError, ValidationError } from "@server/errors";
import {
  PrismaIdentityRepository,
  type IdentityRepository,
} from "./identity.repository";
import { hashPassword, verifyPassword } from "./password";
import {
  expiryFor,
  generateOtp,
  generateUrlToken,
  hashToken,
  identifierFor,
} from "./tokens";

/** Injected sources of non-determinism, overridable in tests. */
export interface AuthServiceDeps {
  repo?: IdentityRepository;
  mail?: MailPort;
  now?: () => Date;
  otpFactory?: () => string;
  tokenFactory?: () => string;
}

/** A user shape safe to return to clients (no password hash). */
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

function toPublic(u: User): PublicUser {
  return { id: u.id, email: u.email, name: u.name, emailVerified: u.emailVerifiedAt != null };
}

/**
 * Account lifecycle: registration, email verification, email-OTP login, and
 * password reset. Auth.js handles the session/cookie mechanics; this service
 * owns the credential and token logic and is fully unit-tested with mocked deps.
 */
export class AuthService {
  private readonly repo: IdentityRepository;
  private readonly mail: MailPort;
  private readonly now: () => Date;
  private readonly otpFactory: () => string;
  private readonly tokenFactory: () => string;

  constructor(deps: AuthServiceDeps = {}) {
    this.repo = deps.repo ?? new PrismaIdentityRepository();
    this.mail = deps.mail ?? consoleMailPort;
    this.now = deps.now ?? (() => new Date());
    this.otpFactory = deps.otpFactory ?? generateOtp;
    this.tokenFactory = deps.tokenFactory ?? generateUrlToken;
  }

  async register(input: { name: string; email: string; password: string }): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.repo.findUserByEmail(email);
    if (existing) throw new ConflictError("An account with this email already exists");

    const passwordHash = await hashPassword(input.password);
    const user = await this.repo.createUser({
      email,
      name: input.name,
      passwordHash,
      status: "PENDING",
    });
    await this.repo.assignRole(user.id, "STUDENT");
    await this.issueOtp("verify", email, "Verify your Bhavishya IAS account");
    return toPublic(user);
  }

  /** Re-send the verification OTP (no-op reveal for unknown/verified emails). */
  async requestEmailVerification(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const user = await this.repo.findUserByEmail(normalized);
    if (user && user.emailVerifiedAt == null) {
      await this.issueOtp("verify", normalized, "Verify your Bhavishya IAS account");
    }
  }

  async verifyEmail(email: string, otp: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const identifier = identifierFor("verify", normalized);
    const ok = await this.repo.consumeToken(identifier, hashToken(identifier, otp));
    if (!ok) throw new ValidationError("Invalid or expired verification code");

    const user = await this.repo.findUserByEmail(normalized);
    if (!user) throw new ValidationError("Invalid or expired verification code");
    await this.repo.markEmailVerified(user.id);
  }

  /** Issue a login OTP. Always resolves (no account enumeration). */
  async requestLoginOtp(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const user = await this.repo.findUserByEmail(normalized);
    if (user) await this.issueOtp("otp", normalized, "Your Bhavishya IAS sign-in code");
  }

  /** Verify a login OTP; returns the user on success (for the OTP provider). */
  async verifyLoginOtp(email: string, otp: string): Promise<User> {
    const normalized = email.trim().toLowerCase();
    const identifier = identifierFor("otp", normalized);
    const ok = await this.repo.consumeToken(identifier, hashToken(identifier, otp));
    if (!ok) throw new UnauthorizedError("Invalid or expired code");
    const user = await this.repo.findUserByEmail(normalized);
    if (!user) throw new UnauthorizedError("Invalid or expired code");
    return user;
  }

  /** Always resolves — never reveals whether the email exists. */
  async requestPasswordReset(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const user = await this.repo.findUserByEmail(normalized);
    if (!user) return;

    const identifier = identifierFor("reset", normalized);
    const raw = this.tokenFactory();
    await this.repo.deleteTokens(identifier);
    await this.repo.createToken({
      identifier,
      token: hashToken(identifier, raw),
      expires: expiryFor("reset", this.now()),
    });
    await this.mail.send({
      to: normalized,
      subject: "Reset your Bhavishya IAS password",
      text: `Use this token to reset your password: ${raw}`,
    });
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const identifier = identifierFor("reset", normalized);
    const ok = await this.repo.consumeToken(identifier, hashToken(identifier, token));
    if (!ok) throw new ValidationError("Invalid or expired reset token");

    const user = await this.repo.findUserByEmail(normalized);
    if (!user) throw new ValidationError("Invalid or expired reset token");
    await this.repo.setPasswordHash(user.id, await hashPassword(newPassword));
  }

  /**
   * Ensure a user exists for an OAuth (Google) sign-in. Google has already
   * verified the email, so the account is created ACTIVE + verified and given
   * the STUDENT role. Existing accounts are linked by email.
   */
  async ensureOAuthUser(email: string, name: string | null): Promise<User> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.repo.findUserByEmail(normalized);
    if (existing) {
      if (existing.emailVerifiedAt == null) await this.repo.markEmailVerified(existing.id);
      return existing;
    }
    const user = await this.repo.createUser({
      email: normalized,
      name,
      passwordHash: null,
      status: "ACTIVE",
    });
    await this.repo.markEmailVerified(user.id);
    await this.repo.assignRole(user.id, "STUDENT");
    // Return the up-to-date record (verification stamped after creation).
    return (await this.repo.findUserById(user.id)) ?? user;
  }

  /** For the Credentials provider: validate email + password. */
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.repo.findUserByEmail(email.trim().toLowerCase());
    if (!user || !user.passwordHash) return null;
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;
    if (user.emailVerifiedAt == null) {
      throw new UnauthorizedError("Please verify your email before signing in");
    }
    return user;
  }

  private async issueOtp(
    purpose: "verify" | "otp",
    email: string,
    subject: string,
  ): Promise<void> {
    const identifier = identifierFor(purpose, email);
    const otp = this.otpFactory();
    await this.repo.deleteTokens(identifier);
    await this.repo.createToken({
      identifier,
      token: hashToken(identifier, otp),
      expires: expiryFor(purpose, this.now()),
    });
    await this.mail.send({ to: email, subject, text: `Your code is: ${otp}` });
  }
}

export const authService = new AuthService();

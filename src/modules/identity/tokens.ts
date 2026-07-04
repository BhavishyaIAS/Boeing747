import { createHash, randomBytes, randomInt } from "node:crypto";

/**
 * One-time tokens for email verification, password reset, and email OTP login.
 * Raw values are sent to the user; only their SHA-256 hash is persisted, so a
 * database leak never exposes a usable token. Hashing is salted with the
 * identifier (e.g. `verify:user@x.com`) so the same OTP for two identifiers
 * yields distinct stored hashes.
 */
export type TokenPurpose = "verify" | "reset" | "otp";

export function identifierFor(purpose: TokenPurpose, email: string): string {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

/** 6-digit numeric OTP, zero-padded, cryptographically random. */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** URL-safe high-entropy token for reset/verification links. */
export function generateUrlToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(identifier: string, raw: string): string {
  return createHash("sha256").update(`${identifier}:${raw}`).digest("hex");
}

export function isExpired(expires: Date, now: Date = new Date()): boolean {
  return expires.getTime() <= now.getTime();
}

/** Default lifetimes (ms). */
export const TOKEN_TTL = {
  verify: 24 * 60 * 60 * 1000, // 24h
  reset: 60 * 60 * 1000, // 1h
  otp: 10 * 60 * 1000, // 10m
} as const;

export function expiryFor(purpose: TokenPurpose, now: Date = new Date()): Date {
  return new Date(now.getTime() + TOKEN_TTL[purpose]);
}

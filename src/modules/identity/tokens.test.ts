import { describe, expect, it } from "vitest";
import {
  expiryFor,
  generateOtp,
  hashToken,
  identifierFor,
  isExpired,
} from "./tokens";

describe("tokens", () => {
  it("builds a normalized, purpose-prefixed identifier", () => {
    expect(identifierFor("verify", "  User@X.com ")).toBe("verify:user@x.com");
  });

  it("generates a 6-digit OTP", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it("hashes deterministically but salts by identifier", () => {
    const a = hashToken("verify:a@x.com", "123456");
    const b = hashToken("verify:b@x.com", "123456");
    expect(a).toBe(hashToken("verify:a@x.com", "123456"));
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("computes expiry and detects expired timestamps", () => {
    const now = new Date("2026-07-04T00:00:00Z");
    const exp = expiryFor("otp", now);
    expect(exp.getTime()).toBe(now.getTime() + 10 * 60 * 1000);
    expect(isExpired(exp, now)).toBe(false);
    expect(isExpired(new Date(now.getTime() - 1), now)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { authorize, can } from "./authorize";
import { ForbiddenError } from "./errors";
import { PERMISSIONS } from "@modules/identity";
import type { Actor } from "./context";

const student: Actor = {
  userId: "u1",
  email: "s@x.com",
  roles: [{ role: "STUDENT", examId: null }],
};
const editorScoped: Actor = {
  userId: "u2",
  email: "e@x.com",
  roles: [{ role: "CONTENT_EDITOR", examId: "exam-1" }],
};
const superAdmin: Actor = {
  userId: "u3",
  email: "a@x.com",
  roles: [{ role: "SUPER_ADMIN", examId: null }],
};

describe("authorize / can", () => {
  it("grants readers content:read but not content:publish", () => {
    expect(can(student, PERMISSIONS.CONTENT_READ)).toBe(true);
    expect(can(student, PERMISSIONS.CONTENT_PUBLISH)).toBe(false);
  });

  it("honours exam scoping on a scoped role", () => {
    expect(can(editorScoped, PERMISSIONS.CONTENT_CREATE, { examId: "exam-1" })).toBe(true);
    expect(can(editorScoped, PERMISSIONS.CONTENT_CREATE, { examId: "exam-2" })).toBe(false);
  });

  it("treats a global role as applying to every exam", () => {
    expect(can(student, PERMISSIONS.CONTENT_READ, { examId: "any-exam" })).toBe(true);
  });

  it("gives SUPER_ADMIN the wildcard grant", () => {
    expect(can(superAdmin, PERMISSIONS.ROLE_MANAGE, { examId: "exam-9" })).toBe(true);
  });

  it("authorize() throws ForbiddenError when denied", () => {
    expect(() => authorize(student, PERMISSIONS.CONTENT_PUBLISH)).toThrow(ForbiddenError);
    expect(() => authorize(student, PERMISSIONS.CONTENT_READ)).not.toThrow();
  });
});

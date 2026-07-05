import { describe, expect, it } from "vitest";
import { BookmarkService } from "./bookmark.service";
import type { BookmarkRepository } from "./bookmark.repository";
import { ForbiddenError } from "@server/errors";
import type { Actor } from "@server/context";

const student: Actor = { userId: "u1", email: "s@x.com", roles: [{ role: "STUDENT", examId: null }] };
const noRoles: Actor = { userId: "u2", email: "n@x.com", roles: [] };

class FakeBookmarkRepo implements BookmarkRepository {
  set = new Set<string>();
  async exists(userId: string, contentItemId: string): Promise<boolean> {
    return this.set.has(`${userId}:${contentItemId}`);
  }
  async create(userId: string, contentItemId: string): Promise<void> {
    this.set.add(`${userId}:${contentItemId}`);
  }
  async remove(userId: string, contentItemId: string): Promise<void> {
    this.set.delete(`${userId}:${contentItemId}`);
  }
}

describe("BookmarkService.toggle", () => {
  it("requires content:read", async () => {
    const svc = new BookmarkService(new FakeBookmarkRepo());
    await expect(svc.toggle(noRoles, "e1", "c1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("toggles on then off", async () => {
    const repo = new FakeBookmarkRepo();
    const svc = new BookmarkService(repo);
    expect(await svc.toggle(student, "e1", "c1")).toBe(true);
    expect(await svc.isBookmarked(student, "e1", "c1")).toBe(true);
    expect(await svc.toggle(student, "e1", "c1")).toBe(false);
    expect(await svc.isBookmarked(student, "e1", "c1")).toBe(false);
  });
});

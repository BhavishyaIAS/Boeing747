import type { Actor } from "@server/context";
import { authorize } from "@server/authorize";
import { PERMISSIONS } from "@modules/identity";
import { PrismaBookmarkRepository, type BookmarkRepository } from "./bookmark.repository";

/** Toggle/query content bookmarks for the current user. Requires content:read. */
export class BookmarkService {
  constructor(private readonly repo: BookmarkRepository = new PrismaBookmarkRepository()) {}

  async isBookmarked(actor: Actor, examId: string, contentItemId: string): Promise<boolean> {
    authorize(actor, PERMISSIONS.CONTENT_READ, { examId });
    return this.repo.exists(actor.userId, contentItemId);
  }

  /** Returns the new bookmarked state. */
  async toggle(actor: Actor, examId: string, contentItemId: string): Promise<boolean> {
    authorize(actor, PERMISSIONS.CONTENT_READ, { examId });
    if (await this.repo.exists(actor.userId, contentItemId)) {
      await this.repo.remove(actor.userId, contentItemId);
      return false;
    }
    await this.repo.create(actor.userId, contentItemId);
    return true;
  }
}

export const bookmarkService = new BookmarkService();

import type { PrismaClient } from "@prisma/client";
import { prisma } from "@lib/db";

/** Content bookmarks (targetType = CONTENT). */
export interface BookmarkRepository {
  exists(userId: string, contentItemId: string): Promise<boolean>;
  create(userId: string, contentItemId: string): Promise<void>;
  remove(userId: string, contentItemId: string): Promise<void>;
}

export class PrismaBookmarkRepository implements BookmarkRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async exists(userId: string, contentItemId: string): Promise<boolean> {
    const count = await this.db.bookmark.count({
      where: { userId, targetType: "CONTENT", contentItemId },
    });
    return count > 0;
  }

  async create(userId: string, contentItemId: string): Promise<void> {
    await this.db.bookmark.create({
      data: { userId, targetType: "CONTENT", contentItemId },
    });
  }

  async remove(userId: string, contentItemId: string): Promise<void> {
    await this.db.bookmark.deleteMany({
      where: { userId, targetType: "CONTENT", contentItemId },
    });
  }
}

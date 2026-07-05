import {
  Prisma,
  type ContentItem,
  type ContentStatus,
  type ContentType,
  type Difficulty,
  type PrismaClient,
  type ReviewDecision,
} from "@prisma/client";
import { prisma } from "@lib/db";

export interface CreateContentData {
  examId: string;
  type: ContentType;
  title: string;
  slug: string;
  authorId: string;
  difficulty: Difficulty | null;
  body: Prisma.InputJsonValue;
  plainText: string;
  readingTimeSeconds: number;
  changeNote: string | null;
  nodeLinks: { nodeId: string; relationType: string }[];
}

export interface ListPublishedParams {
  examId: string;
  type?: ContentType;
  limit: number;
  cursor?: string | null;
}

export interface ListManagedParams extends ListPublishedParams {
  status?: ContentStatus;
}

export interface AddVersionData {
  contentItemId: string;
  body: Prisma.InputJsonValue;
  plainText: string;
  changeNote: string | null;
  createdById: string;
  title?: string;
  readingTimeSeconds?: number;
}

export interface ItemWithBody {
  item: ContentItem;
  body: Prisma.JsonValue;
}

export interface UpdateStatusData {
  status: ContentStatus;
  publishedAt?: Date;
}

export interface AddReviewData {
  contentItemId: string;
  versionId: string;
  reviewerId: string;
  decision: ReviewDecision;
  comment: string | null;
}

/** Sentinel thrown when a create violates the (examId,type,slug) unique index. */
export class DuplicateSlugError extends Error {}

export interface ContentRepository {
  findById(id: string): Promise<ContentItem | null>;
  findByIdWithBody(id: string): Promise<ItemWithBody | null>;
  createWithVersion(data: CreateContentData): Promise<ContentItem>;
  addVersion(data: AddVersionData): Promise<ContentItem>;
  listPublished(params: ListPublishedParams): Promise<ContentItem[]>;
  listManaged(params: ListManagedParams): Promise<ContentItem[]>;
  updateStatus(id: string, data: UpdateStatusData): Promise<ContentItem>;
  addReview(data: AddReviewData): Promise<void>;
}

export class PrismaContentRepository implements ContentRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  findById(id: string): Promise<ContentItem | null> {
    return this.db.contentItem.findFirst({ where: { id, deletedAt: null } });
  }

  async findByIdWithBody(id: string): Promise<ItemWithBody | null> {
    const row = await this.db.contentItem.findFirst({
      where: { id, deletedAt: null },
      include: { currentVersion: true },
    });
    if (!row) return null;
    const { currentVersion, ...item } = row;
    return { item, body: currentVersion?.body ?? {} };
  }

  async addVersion(data: AddVersionData): Promise<ContentItem> {
    return this.db.$transaction(async (tx) => {
      const last = await tx.contentVersion.findFirst({
        where: { contentItemId: data.contentItemId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });
      const version = await tx.contentVersion.create({
        data: {
          contentItemId: data.contentItemId,
          versionNumber: (last?.versionNumber ?? 0) + 1,
          body: data.body,
          plainText: data.plainText,
          changeNote: data.changeNote,
          createdById: data.createdById,
        },
      });
      return tx.contentItem.update({
        where: { id: data.contentItemId },
        data: {
          currentVersionId: version.id,
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.readingTimeSeconds !== undefined
            ? { readingTimeSeconds: data.readingTimeSeconds }
            : {}),
        },
      });
    });
  }

  async createWithVersion(data: CreateContentData): Promise<ContentItem> {
    try {
      return await this.db.$transaction(async (tx) => {
        const item = await tx.contentItem.create({
          data: {
            examId: data.examId,
            type: data.type,
            title: data.title,
            slug: data.slug,
            authorId: data.authorId,
            difficulty: data.difficulty,
            readingTimeSeconds: data.readingTimeSeconds,
          },
        });

        const version = await tx.contentVersion.create({
          data: {
            contentItemId: item.id,
            versionNumber: 1,
            body: data.body,
            plainText: data.plainText,
            changeNote: data.changeNote,
            createdById: data.authorId,
          },
        });

        if (data.nodeLinks.length > 0) {
          await tx.contentNode.createMany({
            data: data.nodeLinks.map((l) => ({
              contentItemId: item.id,
              nodeId: l.nodeId,
              relationType: l.relationType,
            })),
            skipDuplicates: true,
          });
        }

        return tx.contentItem.update({
          where: { id: item.id },
          data: { currentVersionId: version.id },
        });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new DuplicateSlugError();
      }
      throw err;
    }
  }

  listPublished(params: ListPublishedParams): Promise<ContentItem[]> {
    const { examId, type, limit, cursor } = params;
    return this.db.contentItem.findMany({
      where: {
        examId,
        status: "PUBLISHED",
        deletedAt: null,
        ...(type ? { type } : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  listManaged(params: ListManagedParams): Promise<ContentItem[]> {
    const { examId, type, status, limit, cursor } = params;
    return this.db.contentItem.findMany({
      where: {
        examId,
        deletedAt: null,
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  updateStatus(id: string, data: UpdateStatusData): Promise<ContentItem> {
    return this.db.contentItem.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.publishedAt !== undefined ? { publishedAt: data.publishedAt } : {}),
      },
    });
  }

  async addReview(data: AddReviewData): Promise<void> {
    await this.db.contentReview.create({
      data: {
        contentItemId: data.contentItemId,
        versionId: data.versionId,
        reviewerId: data.reviewerId,
        decision: data.decision,
        comment: data.comment,
      },
    });
  }
}

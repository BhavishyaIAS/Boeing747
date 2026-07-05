import {
  Prisma,
  type ContentItem,
  type ReviewDecision,
} from "@prisma/client";
import type { Actor } from "@server/context";
import { authorize, can } from "@server/authorize";
import { PERMISSIONS } from "@modules/identity";
import {
  ACTION_PERMISSION,
  REVIEW_ACTIONS,
  nextStatus,
  type WorkflowAction,
} from "@modules/workflow";
import { ConflictError, ForbiddenError, NotFoundError } from "@server/errors";
import { prismaAuditSink, type AuditSink } from "@server/audit";
import { estimateReadingSeconds, extractPlainText, slugify } from "@lib/utils/text";
import type { ContentStatus, ContentType } from "@prisma/client";
import {
  DuplicateSlugError,
  PrismaContentRepository,
  type ContentRepository,
  type ContentSummary,
  type ItemWithBody,
} from "./content.repository";
import type { CreateContentInput } from "./dto";

const REVIEW_DECISION: Record<Extract<WorkflowAction, "APPROVE" | "REQUEST_CHANGES" | "REJECT">, ReviewDecision> = {
  APPROVE: "APPROVED",
  REQUEST_CHANGES: "CHANGES_REQUESTED",
  REJECT: "REJECTED",
};

export interface ContentPage {
  items: ContentItem[];
  nextCursor: string | null;
}

/**
 * Content domain service: create (with initial version), read (published for
 * students; drafts for editors), and lifecycle transitions with separation of
 * duties. Authorization and examId scoping are enforced here.
 */
export class ContentService {
  constructor(
    private readonly repo: ContentRepository = new PrismaContentRepository(),
    private readonly audit: AuditSink = prismaAuditSink,
  ) {}

  async create(actor: Actor, examId: string, input: CreateContentInput): Promise<ContentItem> {
    authorize(actor, PERMISSIONS.CONTENT_CREATE, { examId });

    const slug = slugify(input.slug ?? input.title);
    if (!slug) throw new ConflictError("Title/slug produced an empty slug");

    const plainText = extractPlainText(input.body);
    const readingTimeSeconds = estimateReadingSeconds(plainText);

    let item: ContentItem;
    try {
      item = await this.repo.createWithVersion({
        examId,
        type: input.type,
        title: input.title,
        slug,
        authorId: actor.userId,
        difficulty: input.difficulty ?? null,
        body: input.body as Prisma.InputJsonValue,
        plainText,
        readingTimeSeconds,
        changeNote: input.changeNote ?? null,
        nodeLinks: (input.nodeIds ?? []).map((nodeId) => ({ nodeId, relationType: "PRIMARY" })),
      });
    } catch (err) {
      if (err instanceof DuplicateSlugError) {
        throw new ConflictError(`A ${input.type} with slug "${slug}" already exists in this exam`);
      }
      throw err;
    }

    await this.audit.record({
      actorId: actor.userId,
      action: "content.create",
      targetType: "content_item",
      targetId: item.id,
      examId,
    });
    return item;
  }

  async list(
    actor: Actor,
    examId: string,
    params: { type?: CreateContentInput["type"]; limit: number; cursor?: string | null },
  ): Promise<ContentPage> {
    authorize(actor, PERMISSIONS.CONTENT_READ, { examId });

    const rows = await this.repo.listPublished({
      examId,
      type: params.type,
      limit: params.limit,
      cursor: params.cursor ?? null,
    });

    const hasMore = rows.length > params.limit;
    const items = hasMore ? rows.slice(0, params.limit) : rows;
    const last = items[items.length - 1];
    return { items, nextCursor: hasMore && last ? last.id : null };
  }

  /** Published content attached to a syllabus node (for the node hub). */
  async listByNode(actor: Actor, examId: string, nodeId: string): Promise<ContentSummary[]> {
    authorize(actor, PERMISSIONS.CONTENT_READ, { examId });
    return this.repo.listPublishedByNode(examId, nodeId);
  }

  /** A published item + body for the reader, by slug. */
  async getPublishedBySlug(actor: Actor, examId: string, slug: string): Promise<ItemWithBody> {
    authorize(actor, PERMISSIONS.CONTENT_READ, { examId });
    const found = await this.repo.findPublishedBySlugWithBody(examId, slug);
    if (!found) throw new NotFoundError("Content not found");
    return found;
  }

  async getById(actor: Actor, examId: string, id: string): Promise<ContentItem> {
    authorize(actor, PERMISSIONS.CONTENT_READ, { examId });

    const item = await this.repo.findById(id);
    // Scope isolation: never reveal that an item exists in another exam.
    if (!item || item.examId !== examId) throw new NotFoundError("Content not found");

    // Students only see published items; unpublished are visible to those who
    // can edit — otherwise treated as not found (no existence leak).
    if (item.status !== "PUBLISHED" && !can(actor, PERMISSIONS.CONTENT_UPDATE, { examId })) {
      throw new NotFoundError("Content not found");
    }
    return item;
  }

  /** Management listing (all statuses) for the CMS. Requires content:update. */
  async listManaged(
    actor: Actor,
    examId: string,
    params: { type?: ContentType; status?: ContentStatus; limit: number; cursor?: string | null },
  ): Promise<ContentPage> {
    authorize(actor, PERMISSIONS.CONTENT_UPDATE, { examId });
    const rows = await this.repo.listManaged({
      examId,
      type: params.type,
      status: params.status,
      limit: params.limit,
      cursor: params.cursor ?? null,
    });
    const hasMore = rows.length > params.limit;
    const items = hasMore ? rows.slice(0, params.limit) : rows;
    const last = items[items.length - 1];
    return { items, nextCursor: hasMore && last ? last.id : null };
  }

  /** Fetch an item plus its current body for the editor. Requires content:update. */
  async getForEditing(actor: Actor, examId: string, id: string): Promise<ItemWithBody> {
    authorize(actor, PERMISSIONS.CONTENT_UPDATE, { examId });
    const found = await this.repo.findByIdWithBody(id);
    if (!found || found.item.examId !== examId) throw new NotFoundError("Content not found");
    return found;
  }

  /**
   * Save an edit as a new immutable version. Only DRAFT items are editable —
   * to change published content, REVISE it back to draft first.
   */
  async updateDraft(
    actor: Actor,
    examId: string,
    id: string,
    input: { title?: string; body: Record<string, unknown>; changeNote?: string },
  ): Promise<ContentItem> {
    authorize(actor, PERMISSIONS.CONTENT_UPDATE, { examId });

    const item = await this.repo.findById(id);
    if (!item || item.examId !== examId) throw new NotFoundError("Content not found");
    if (item.status !== "DRAFT") {
      throw new ConflictError("Only drafts can be edited — revise the content back to draft first");
    }

    const plainText = extractPlainText(input.body);
    const updated = await this.repo.addVersion({
      contentItemId: id,
      body: input.body as Prisma.InputJsonValue,
      plainText,
      changeNote: input.changeNote ?? null,
      createdById: actor.userId,
      ...(input.title !== undefined ? { title: input.title } : {}),
      readingTimeSeconds: estimateReadingSeconds(plainText),
    });

    await this.audit.record({
      actorId: actor.userId,
      action: "content.update",
      targetType: "content_item",
      targetId: id,
      examId,
    });
    return updated;
  }

  async transition(
    actor: Actor,
    examId: string,
    id: string,
    action: WorkflowAction,
    comment?: string,
  ): Promise<ContentItem> {
    const item = await this.repo.findById(id);
    if (!item || item.examId !== examId) throw new NotFoundError("Content not found");

    authorize(actor, ACTION_PERMISSION[action], { examId });

    // Separation of duties: a reviewer may not review their own content.
    if (REVIEW_ACTIONS.has(action) && item.authorId === actor.userId) {
      throw new ForbiddenError("You cannot review your own content");
    }

    const to = nextStatus(item.status, action);
    if (!to) throw new ConflictError(`Cannot ${action} content in state ${item.status}`);

    if (action === "PUBLISH" && !item.currentVersionId) {
      throw new ConflictError("Cannot publish content that has no version");
    }

    const updated = await this.repo.updateStatus(id, {
      status: to,
      ...(to === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    });

    if (isReviewAction(action) && item.currentVersionId) {
      await this.repo.addReview({
        contentItemId: id,
        versionId: item.currentVersionId,
        reviewerId: actor.userId,
        decision: REVIEW_DECISION[action],
        comment: comment ?? null,
      });
    }

    await this.audit.record({
      actorId: actor.userId,
      action: `content.${action.toLowerCase()}`,
      targetType: "content_item",
      targetId: id,
      examId,
      metadata: { from: item.status, to },
    });
    return updated;
  }
}

function isReviewAction(
  action: WorkflowAction,
): action is "APPROVE" | "REQUEST_CHANGES" | "REJECT" {
  return REVIEW_ACTIONS.has(action);
}

export const contentService = new ContentService();

import { describe, expect, it } from "vitest";
import type { ContentItem } from "@prisma/client";
import { ContentService } from "./content.service";
import {
  DuplicateSlugError,
  type AddReviewData,
  type ContentRepository,
  type CreateContentData,
  type ListPublishedParams,
  type UpdateStatusData,
} from "./content.repository";
import type { AuditEntry, AuditSink } from "@server/audit";
import { ConflictError, ForbiddenError, NotFoundError } from "@server/errors";
import type { Actor } from "@server/context";

const editor: Actor = { userId: "u-editor", email: "ed@x.com", roles: [{ role: "CONTENT_EDITOR", examId: null }] };
const reviewer: Actor = { userId: "u-rev", email: "rv@x.com", roles: [{ role: "REVIEWER", examId: null }] };
const reviewerIsAuthor: Actor = { userId: "u-editor", email: "ed@x.com", roles: [{ role: "REVIEWER", examId: null }] };
const admin: Actor = { userId: "u-adm", email: "ad@x.com", roles: [{ role: "ADMIN", examId: null }] };
const student: Actor = { userId: "u-stu", email: "st@x.com", roles: [{ role: "STUDENT", examId: null }] };

const bodyWithWords = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: Array(60).fill("word").join(" ") }] }],
};

function makeItem(p: Partial<ContentItem> & Pick<ContentItem, "id" | "examId" | "authorId">): ContentItem {
  return {
    id: p.id,
    examId: p.examId,
    type: p.type ?? "NOTE",
    title: p.title ?? "Title",
    slug: p.slug ?? "slug",
    status: p.status ?? "DRAFT",
    currentVersionId: "currentVersionId" in p ? (p.currentVersionId ?? null) : "v1",
    authorId: p.authorId,
    difficulty: p.difficulty ?? null,
    readingTimeSeconds: p.readingTimeSeconds ?? 0,
    publishedAt: p.publishedAt ?? null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    deletedAt: p.deletedAt ?? null,
  };
}

class FakeContentRepo implements ContentRepository {
  items = new Map<string, ContentItem>();
  created: CreateContentData[] = [];
  reviews: AddReviewData[] = [];
  duplicate = false;

  seed(item: ContentItem): ContentItem {
    this.items.set(item.id, item);
    return item;
  }
  async findById(id: string): Promise<ContentItem | null> {
    return this.items.get(id) ?? null;
  }
  async createWithVersion(data: CreateContentData): Promise<ContentItem> {
    if (this.duplicate) throw new DuplicateSlugError();
    this.created.push(data);
    return this.seed(
      makeItem({
        id: "c-new",
        examId: data.examId,
        authorId: data.authorId,
        type: data.type,
        title: data.title,
        slug: data.slug,
        readingTimeSeconds: data.readingTimeSeconds,
      }),
    );
  }
  async listPublished(params: ListPublishedParams): Promise<ContentItem[]> {
    return [...this.items.values()].filter(
      (i) => i.examId === params.examId && i.status === "PUBLISHED",
    );
  }
  async updateStatus(id: string, data: UpdateStatusData): Promise<ContentItem> {
    const it = this.items.get(id);
    if (!it) throw new Error("not seeded");
    const updated: ContentItem = {
      ...it,
      status: data.status,
      publishedAt: data.publishedAt ?? it.publishedAt,
    };
    this.items.set(id, updated);
    return updated;
  }
  async addReview(data: AddReviewData): Promise<void> {
    this.reviews.push(data);
  }
}

class FakeAudit implements AuditSink {
  entries: AuditEntry[] = [];
  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

describe("ContentService.create", () => {
  it("creates a DRAFT, derives slug + reading time, and audits", async () => {
    const repo = new FakeContentRepo();
    const audit = new FakeAudit();
    const item = await new ContentService(repo, audit).create(editor, "exam-1", {
      type: "NOTE",
      title: "Right to Life",
      body: bodyWithWords,
    });
    expect(item.status).toBe("DRAFT");
    expect(repo.created[0]?.slug).toBe("right-to-life");
    expect(repo.created[0]?.readingTimeSeconds).toBeGreaterThan(0);
    expect(audit.entries.some((e) => e.action === "content.create")).toBe(true);
  });

  it("rejects a student without content:create", async () => {
    const svc = new ContentService(new FakeContentRepo(), new FakeAudit());
    await expect(
      svc.create(student, "exam-1", { type: "NOTE", title: "X title", body: {} }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("maps a duplicate slug to a Conflict", async () => {
    const repo = new FakeContentRepo();
    repo.duplicate = true;
    const svc = new ContentService(repo, new FakeAudit());
    await expect(
      svc.create(editor, "exam-1", { type: "NOTE", title: "Dupe title", body: {} }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("ContentService.getById", () => {
  it("hides drafts from students but shows them to editors", async () => {
    const repo = new FakeContentRepo();
    repo.seed(makeItem({ id: "c1", examId: "exam-1", authorId: "u-editor", status: "DRAFT" }));
    const svc = new ContentService(repo, new FakeAudit());
    await expect(svc.getById(student, "exam-1", "c1")).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.getById(editor, "exam-1", "c1")).resolves.toMatchObject({ id: "c1" });
  });

  it("does not reveal content from another exam", async () => {
    const repo = new FakeContentRepo();
    repo.seed(makeItem({ id: "c1", examId: "exam-2", authorId: "u-editor", status: "PUBLISHED" }));
    const svc = new ContentService(repo, new FakeAudit());
    await expect(svc.getById(student, "exam-1", "c1")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ContentService.transition", () => {
  function seededDraft(status: ContentItem["status"], currentVersionId: string | null = "v1") {
    const repo = new FakeContentRepo();
    repo.seed(makeItem({ id: "c1", examId: "exam-1", authorId: "u-editor", status, currentVersionId }));
    return repo;
  }

  it("submits a draft for review", async () => {
    const repo = seededDraft("DRAFT");
    const audit = new FakeAudit();
    const item = await new ContentService(repo, audit).transition(editor, "exam-1", "c1", "SUBMIT");
    expect(item.status).toBe("IN_REVIEW");
    expect(audit.entries.some((e) => e.action === "content.submit")).toBe(true);
  });

  it("forbids reviewing your own content (separation of duties)", async () => {
    const repo = seededDraft("IN_REVIEW");
    const svc = new ContentService(repo, new FakeAudit());
    await expect(
      svc.transition(reviewerIsAuthor, "exam-1", "c1", "APPROVE"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lets a reviewer approve and records a review", async () => {
    const repo = seededDraft("IN_REVIEW");
    const item = await new ContentService(repo, new FakeAudit()).transition(
      reviewer,
      "exam-1",
      "c1",
      "APPROVE",
      "looks good",
    );
    expect(item.status).toBe("APPROVED");
    expect(repo.reviews[0]).toMatchObject({ decision: "APPROVED", comment: "looks good" });
  });

  it("rejects an illegal transition", async () => {
    const repo = seededDraft("DRAFT");
    const svc = new ContentService(repo, new FakeAudit());
    await expect(svc.transition(admin, "exam-1", "c1", "PUBLISH")).rejects.toBeInstanceOf(ConflictError);
  });

  it("won't publish content that has no version", async () => {
    const repo = seededDraft("APPROVED", null);
    const svc = new ContentService(repo, new FakeAudit());
    await expect(svc.transition(admin, "exam-1", "c1", "PUBLISH")).rejects.toBeInstanceOf(ConflictError);
  });

  it("publishes approved content and stamps publishedAt", async () => {
    const repo = seededDraft("APPROVED");
    const item = await new ContentService(repo, new FakeAudit()).transition(admin, "exam-1", "c1", "PUBLISH");
    expect(item.status).toBe("PUBLISHED");
    expect(item.publishedAt).not.toBeNull();
  });

  it("forbids a student from submitting", async () => {
    const repo = seededDraft("DRAFT");
    const svc = new ContentService(repo, new FakeAudit());
    await expect(svc.transition(student, "exam-1", "c1", "SUBMIT")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

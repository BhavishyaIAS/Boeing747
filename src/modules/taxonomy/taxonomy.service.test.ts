import { describe, expect, it } from "vitest";
import type { SyllabusNode } from "@prisma/client";
import { TaxonomyService } from "./taxonomy.service";
import type { NodeWithChildFlag, TaxonomyRepository } from "./taxonomy.repository";
import { ForbiddenError, NotFoundError } from "@server/errors";
import type { Actor } from "@server/context";

const reader: Actor = { userId: "u1", email: "r@x.com", roles: [{ role: "STUDENT", examId: null }] };
const noRoles: Actor = { userId: "u2", email: "n@x.com", roles: [] };

function makeNode(partial: Partial<SyllabusNode> & Pick<SyllabusNode, "id">): SyllabusNode {
  return {
    id: partial.id,
    examId: partial.examId ?? "exam-1",
    parentId: partial.parentId ?? null,
    type: partial.type ?? "SUBJECT",
    title: partial.title ?? "Node",
    slug: partial.slug ?? "node",
    summary: partial.summary ?? null,
    orderIndex: partial.orderIndex ?? 0,
    examAngle: partial.examAngle ?? null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    deletedAt: null,
  };
}

class FakeTaxonomyRepo implements TaxonomyRepository {
  children: NodeWithChildFlag[] = [];
  node: SyllabusNode | null = null;
  crumb: SyllabusNode[] = [];
  async listChildren(): Promise<NodeWithChildFlag[]> {
    return this.children;
  }
  async findBySlug(): Promise<SyllabusNode | null> {
    return this.node;
  }
  async breadcrumb(): Promise<SyllabusNode[]> {
    return this.crumb;
  }
}

describe("TaxonomyService", () => {
  it("requires syllabus:read", async () => {
    const svc = new TaxonomyService(new FakeTaxonomyRepo());
    await expect(svc.listNodes(noRoles, "exam-1", null)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("maps nodes to client DTOs with hasChildren", async () => {
    const repo = new FakeTaxonomyRepo();
    repo.children = [
      { node: makeNode({ id: "n1", title: "Polity", slug: "polity" }), hasChildren: true },
      { node: makeNode({ id: "n2", title: "Economy", slug: "economy" }), hasChildren: false },
    ];
    const svc = new TaxonomyService(repo);
    const nodes = await svc.listNodes(reader, "exam-1", null);
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({ title: "Polity", slug: "polity", hasChildren: true });
  });

  it("returns node detail with breadcrumb and children", async () => {
    const repo = new FakeTaxonomyRepo();
    repo.node = makeNode({ id: "n1", title: "Fundamental Rights", slug: "fundamental-rights" });
    repo.crumb = [
      makeNode({ id: "r", title: "Polity", slug: "polity" }),
      makeNode({ id: "n1", title: "Fundamental Rights", slug: "fundamental-rights" }),
    ];
    repo.children = [{ node: makeNode({ id: "c1", title: "Article 21", slug: "article-21" }), hasChildren: false }];
    const svc = new TaxonomyService(repo);
    const detail = await svc.getNodeBySlug(reader, "exam-1", "fundamental-rights");
    expect(detail.breadcrumb.map((b) => b.slug)).toEqual(["polity", "fundamental-rights"]);
    expect(detail.children).toHaveLength(1);
    expect(detail.hasChildren).toBe(true);
  });

  it("throws NotFound for an unknown slug", async () => {
    const svc = new TaxonomyService(new FakeTaxonomyRepo());
    await expect(svc.getNodeBySlug(reader, "exam-1", "missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});

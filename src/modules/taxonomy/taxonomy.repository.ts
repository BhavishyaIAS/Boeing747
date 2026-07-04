import type { PrismaClient, SyllabusNode } from "@prisma/client";
import { prisma } from "@lib/db";

/** A node plus a cheap flag for whether it has (non-deleted) children. */
export interface NodeWithChildFlag {
  node: SyllabusNode;
  hasChildren: boolean;
}

/**
 * Data access for the syllabus graph. All reads are examId-scoped and exclude
 * soft-deleted nodes. Hierarchy uses the adjacency parent_id; breadcrumbs use
 * the closure table.
 */
export interface TaxonomyRepository {
  listChildren(examId: string, parentId: string | null): Promise<NodeWithChildFlag[]>;
  findBySlug(examId: string, slug: string): Promise<SyllabusNode | null>;
  breadcrumb(nodeId: string): Promise<SyllabusNode[]>;
}

export class PrismaTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listChildren(examId: string, parentId: string | null): Promise<NodeWithChildFlag[]> {
    const nodes = await this.db.syllabusNode.findMany({
      where: { examId, parentId, deletedAt: null },
      orderBy: { orderIndex: "asc" },
      include: { _count: { select: { children: { where: { deletedAt: null } } } } },
    });
    return nodes.map((n) => {
      const { _count, ...node } = n;
      return { node, hasChildren: _count.children > 0 };
    });
  }

  async findBySlug(examId: string, slug: string): Promise<SyllabusNode | null> {
    return this.db.syllabusNode.findFirst({ where: { examId, slug, deletedAt: null } });
  }

  async breadcrumb(nodeId: string): Promise<SyllabusNode[]> {
    // Ancestors of the node (including itself) ordered root → leaf via depth desc.
    const closures = await this.db.syllabusClosure.findMany({
      where: { descendantId: nodeId },
      orderBy: { depth: "desc" },
      include: { ancestor: true },
    });
    return closures.map((c) => c.ancestor);
  }
}

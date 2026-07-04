import type { SyllabusNode } from "@prisma/client";
import type { Actor } from "@server/context";
import { authorize } from "@server/authorize";
import { PERMISSIONS } from "@modules/identity";
import { NotFoundError } from "@server/errors";
import {
  PrismaTaxonomyRepository,
  type NodeWithChildFlag,
  type TaxonomyRepository,
} from "./taxonomy.repository";
import type { BreadcrumbDto, NodeDetailDto, NodeDto } from "./dto";

function toNodeDto(n: NodeWithChildFlag): NodeDto {
  return {
    id: n.node.id,
    type: n.node.type,
    title: n.node.title,
    slug: n.node.slug,
    summary: n.node.summary,
    orderIndex: n.node.orderIndex,
    examAngle: n.node.examAngle,
    hasChildren: n.hasChildren,
  };
}

function toBreadcrumb(n: SyllabusNode): BreadcrumbDto {
  return { id: n.id, title: n.title, slug: n.slug };
}

/**
 * Read-only syllabus navigation. Every method requires `syllabus:read` in the
 * exam scope and returns client-safe DTOs.
 */
export class TaxonomyService {
  constructor(private readonly repo: TaxonomyRepository = new PrismaTaxonomyRepository()) {}

  /** Top-level subjects, or the children of `parentId` when provided. */
  async listNodes(actor: Actor, examId: string, parentId: string | null): Promise<NodeDto[]> {
    authorize(actor, PERMISSIONS.SYLLABUS_READ, { examId });
    const children = await this.repo.listChildren(examId, parentId);
    return children.map(toNodeDto);
  }

  /** A single node with its breadcrumb trail and immediate children. */
  async getNodeBySlug(actor: Actor, examId: string, slug: string): Promise<NodeDetailDto> {
    authorize(actor, PERMISSIONS.SYLLABUS_READ, { examId });

    const node = await this.repo.findBySlug(examId, slug);
    if (!node) throw new NotFoundError(`No syllabus node with slug "${slug}"`);

    const [breadcrumb, children] = await Promise.all([
      this.repo.breadcrumb(node.id),
      this.repo.listChildren(examId, node.id),
    ]);

    return {
      id: node.id,
      type: node.type,
      title: node.title,
      slug: node.slug,
      summary: node.summary,
      orderIndex: node.orderIndex,
      examAngle: node.examAngle,
      hasChildren: children.length > 0,
      breadcrumb: breadcrumb.map(toBreadcrumb),
      children: children.map(toNodeDto),
    };
  }
}

export const taxonomyService = new TaxonomyService();

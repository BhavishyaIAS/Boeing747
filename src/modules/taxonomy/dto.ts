import { z } from "zod";

/** Query params for listing syllabus nodes (roots or a parent's children). */
export const listNodesQuerySchema = z.object({
  exam: z.string().uuid().optional(),
  parent: z.string().uuid().optional(),
});
export type ListNodesQuery = z.infer<typeof listNodesQuerySchema>;

/** A node as returned to clients (no soft-deleted / internal fields). */
export interface NodeDto {
  id: string;
  type: string;
  title: string;
  slug: string;
  summary: string | null;
  orderIndex: number;
  examAngle: string | null;
  hasChildren: boolean;
}

export interface BreadcrumbDto {
  id: string;
  title: string;
  slug: string;
}

export interface NodeDetailDto extends NodeDto {
  breadcrumb: BreadcrumbDto[];
  children: NodeDto[];
}

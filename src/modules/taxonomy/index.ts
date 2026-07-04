/** Taxonomy (syllabus graph) module — public API. */
export { TaxonomyService, taxonomyService } from "./taxonomy.service";
export {
  listNodesQuerySchema,
  type ListNodesQuery,
  type NodeDto,
  type NodeDetailDto,
  type BreadcrumbDto,
} from "./dto";
export type { TaxonomyRepository, NodeWithChildFlag } from "./taxonomy.repository";

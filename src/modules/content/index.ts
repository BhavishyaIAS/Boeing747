/** Content module — public API. */
export { ContentService, contentService, type ContentPage } from "./content.service";
export {
  createContentSchema,
  listContentQuerySchema,
  updateContentSchema,
  transitionSchema,
  type CreateContentInput,
  type ListContentQuery,
  type UpdateContentInput,
  type TransitionInput,
} from "./dto";
export type { ItemWithBody, ContentSummary } from "./content.repository";
export type {
  ContentRepository,
  CreateContentData,
  ListPublishedParams,
  UpdateStatusData,
  AddReviewData,
} from "./content.repository";

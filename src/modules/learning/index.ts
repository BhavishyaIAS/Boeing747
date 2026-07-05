/** Learning module — public API (progress & dashboard read model). */
export {
  ProgressService,
  progressService,
  computeStreak,
  type DashboardData,
  type SubjectCoverage,
} from "./progress.service";
export type {
  ProgressRepository,
  ContinueReadingItem,
  RevisionDueItem,
  SubjectCoverageRow,
} from "./progress.repository";
export {
  NodeProgressService,
  nodeProgressService,
  nextRevisionDate,
} from "./node-progress.service";
export type { NodeProgressRepository, NodeStatusRecord } from "./node-progress.repository";
export { ReadingService, readingService } from "./reading.service";
export type { ReadingRepository } from "./reading.repository";
export { BookmarkService, bookmarkService } from "./bookmark.service";
export type { BookmarkRepository } from "./bookmark.repository";

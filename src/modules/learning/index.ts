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

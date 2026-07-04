import { ContentStatus } from "@prisma/client";
import { PERMISSIONS, type Permission } from "@modules/identity";

/**
 * The editorial lifecycle state machine (Phase 2 §10), shared by every content
 * type. Pure and side-effect-free so it is trivially unit-tested; the content
 * service applies its verdicts (persistence, audit, events live there).
 */
export const WORKFLOW_ACTIONS = [
  "SUBMIT",
  "APPROVE",
  "REQUEST_CHANGES",
  "REJECT",
  "PUBLISH",
  "ARCHIVE",
  "REVISE",
] as const;

export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];

const TRANSITIONS: Record<ContentStatus, Partial<Record<WorkflowAction, ContentStatus>>> = {
  DRAFT: {
    SUBMIT: ContentStatus.IN_REVIEW,
    ARCHIVE: ContentStatus.ARCHIVED,
  },
  IN_REVIEW: {
    APPROVE: ContentStatus.APPROVED,
    REQUEST_CHANGES: ContentStatus.DRAFT,
    REJECT: ContentStatus.ARCHIVED,
  },
  APPROVED: {
    PUBLISH: ContentStatus.PUBLISHED,
    REQUEST_CHANGES: ContentStatus.DRAFT,
    ARCHIVE: ContentStatus.ARCHIVED,
  },
  PUBLISHED: {
    ARCHIVE: ContentStatus.ARCHIVED,
    REVISE: ContentStatus.DRAFT,
  },
  ARCHIVED: {
    REVISE: ContentStatus.DRAFT,
  },
};

/** Permission required to perform each action. */
export const ACTION_PERMISSION: Record<WorkflowAction, Permission> = {
  SUBMIT: PERMISSIONS.CONTENT_SUBMIT,
  APPROVE: PERMISSIONS.CONTENT_REVIEW,
  REQUEST_CHANGES: PERMISSIONS.CONTENT_REVIEW,
  REJECT: PERMISSIONS.CONTENT_REVIEW,
  PUBLISH: PERMISSIONS.CONTENT_PUBLISH,
  ARCHIVE: PERMISSIONS.CONTENT_ARCHIVE,
  REVISE: PERMISSIONS.CONTENT_UPDATE,
};

/** Review actions are subject to separation of duties (reviewer ≠ author). */
export const REVIEW_ACTIONS: ReadonlySet<WorkflowAction> = new Set([
  "APPROVE",
  "REQUEST_CHANGES",
  "REJECT",
]);

/** The resulting status for an action, or null if the transition is illegal. */
export function nextStatus(from: ContentStatus, action: WorkflowAction): ContentStatus | null {
  return TRANSITIONS[from][action] ?? null;
}

export function canTransition(from: ContentStatus, action: WorkflowAction): boolean {
  return nextStatus(from, action) !== null;
}

/** All legal actions from a given status (useful for UI affordances). */
export function availableActions(from: ContentStatus): WorkflowAction[] {
  return Object.keys(TRANSITIONS[from]) as WorkflowAction[];
}

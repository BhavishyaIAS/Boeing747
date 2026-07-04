import type { RoleKey } from "@prisma/client";

/**
 * The permission catalogue and the role → permission mapping. Roles are stored
 * in the DB (data-driven), but the canonical grant matrix lives here as the
 * single source of truth for what each role may do. Seeds derive `permission`
 * and `role_permission` rows from this file.
 */
export const PERMISSIONS = {
  CONTENT_READ: "content:read",
  CONTENT_CREATE: "content:create",
  CONTENT_UPDATE: "content:update",
  CONTENT_SUBMIT: "content:submit",
  CONTENT_REVIEW: "content:review",
  CONTENT_PUBLISH: "content:publish",
  CONTENT_ARCHIVE: "content:archive",

  SYLLABUS_READ: "syllabus:read",
  SYLLABUS_MANAGE: "syllabus:manage",

  PYQ_READ: "pyq:read",
  TEST_READ: "test:read",
  TEST_ATTEMPT: "test:attempt",
  TEST_MANAGE: "test:manage",

  CA_READ: "ca:read",
  CA_MANAGE: "ca:manage",

  ANSWER_EVALUATE: "answer:evaluate",
  MEDIA_MANAGE: "media:manage",
  USER_MANAGE: "user:manage",
  ROLE_MANAGE: "role:manage",
  AUDIT_READ: "audit:read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** `"*"` is a wildcard grant held only by SUPER_ADMIN. */
export type PermissionGrant = Permission | "*";

const READER: Permission[] = [
  PERMISSIONS.CONTENT_READ,
  PERMISSIONS.SYLLABUS_READ,
  PERMISSIONS.PYQ_READ,
  PERMISSIONS.TEST_READ,
  PERMISSIONS.CA_READ,
];

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionGrant[]> = {
  STUDENT: [...READER, PERMISSIONS.TEST_ATTEMPT],
  FACULTY: [...READER, PERMISSIONS.TEST_ATTEMPT, PERMISSIONS.ANSWER_EVALUATE],
  CONTENT_EDITOR: [
    ...READER,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_SUBMIT,
    PERMISSIONS.MEDIA_MANAGE,
  ],
  REVIEWER: [...READER, PERMISSIONS.CONTENT_REVIEW],
  ADMIN: [
    ...READER,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_SUBMIT,
    PERMISSIONS.CONTENT_REVIEW,
    PERMISSIONS.CONTENT_PUBLISH,
    PERMISSIONS.CONTENT_ARCHIVE,
    PERMISSIONS.SYLLABUS_MANAGE,
    PERMISSIONS.TEST_MANAGE,
    PERMISSIONS.CA_MANAGE,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.AUDIT_READ,
  ],
  SUPER_ADMIN: ["*"],
};

/** Flat, de-duplicated list of every concrete permission — used by seeds. */
export const PERMISSION_CATALOGUE: Permission[] = Object.values(PERMISSIONS);

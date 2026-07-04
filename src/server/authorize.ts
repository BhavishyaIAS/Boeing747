import { ROLE_PERMISSIONS, type Permission } from "@modules/identity";
import type { Actor } from "./context";
import { ForbiddenError } from "./errors";

interface AuthzOptions {
  /**
   * The exam the action targets. A role scoped to a different exam does not
   * grant the permission; a globally-scoped role (examId null) always applies.
   */
  examId?: string | null;
}

/** Pure predicate: does the actor hold `permission` in the given scope? */
export function can(
  actor: Actor,
  permission: Permission,
  opts: AuthzOptions = {},
): boolean {
  const { examId } = opts;
  return actor.roles.some((r) => {
    if (examId != null && r.examId != null && r.examId !== examId) return false;
    const grants = ROLE_PERMISSIONS[r.role];
    return grants.includes("*") || grants.includes(permission);
  });
}

/** Guard: throws {@link ForbiddenError} unless the actor is authorized. */
export function authorize(
  actor: Actor,
  permission: Permission,
  opts: AuthzOptions = {},
): void {
  if (!can(actor, permission, opts)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

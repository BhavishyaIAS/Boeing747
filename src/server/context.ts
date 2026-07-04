import type { RoleKey } from "@prisma/client";

/**
 * The authenticated actor and its resolved scope. Populated by the auth layer
 * (finalised in Phase 8) and threaded into every service call so authorization
 * and examId scoping are applied centrally.
 */
export interface ActorRole {
  role: RoleKey;
  /** Exam the role is scoped to; null = global (applies to every exam). */
  examId: string | null;
}

export interface Actor {
  userId: string;
  email: string;
  roles: ActorRole[];
}

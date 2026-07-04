import type { Actor } from "@server/context";
import {
  PrismaIdentityRepository,
  type IdentityRepository,
} from "./identity.repository";

/** Assemble an Actor from its parts (used by auth callbacks and tests). */
export function buildActor(
  userId: string,
  email: string,
  roles: Actor["roles"],
): Actor {
  return { userId, email, roles };
}

/** Load an Actor (with roles) by user id. */
export async function loadActor(
  userId: string,
  email: string,
  repo: IdentityRepository = new PrismaIdentityRepository(),
): Promise<Actor> {
  const roles = await repo.loadActorRoles(userId);
  return buildActor(userId, email, roles);
}

/** Load an Actor by email; null when no such user exists. */
export async function loadActorByEmail(
  email: string,
  repo: IdentityRepository = new PrismaIdentityRepository(),
): Promise<Actor | null> {
  const user = await repo.findUserByEmail(email);
  if (!user) return null;
  const roles = await repo.loadActorRoles(user.id);
  return buildActor(user.id, user.email, roles);
}

import { z } from "zod";
import { auth } from "@server/auth";
import type { Actor } from "./context";
import { UnauthorizedError, ValidationError } from "./errors";

/**
 * Resolves the request actor from the Auth.js session (the JWT carries the user
 * id + roles). In non-production, a request may alternatively carry an
 * `x-dev-actor` header with the actor JSON to exercise the API without going
 * through OAuth. In production that shim is disabled and a missing session
 * always yields 401 — there is no fake auth in production.
 */
const actorSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  roles: z
    .array(
      z.object({
        role: z.enum([
          "STUDENT",
          "FACULTY",
          "CONTENT_EDITOR",
          "REVIEWER",
          "ADMIN",
          "SUPER_ADMIN",
        ]),
        examId: z.string().uuid().nullable(),
      }),
    )
    .min(1),
});

export async function resolveActor(req: Request): Promise<Actor> {
  const actor = await tryResolveActor(req);
  if (!actor) throw new UnauthorizedError();
  return actor;
}

/** Actor from the Auth.js session, for Server Components / Server Actions. */
export async function currentActor(): Promise<Actor | null> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      userId: session.user.id,
      email: session.user.email ?? "",
      roles: session.user.roles ?? [],
    };
  }
  return null;
}

export async function requireActor(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) throw new UnauthorizedError();
  return actor;
}

async function tryResolveActor(req: Request): Promise<Actor | null> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      userId: session.user.id,
      email: session.user.email ?? "",
      roles: session.user.roles ?? [],
    };
  }

  // Non-production convenience: exercise the API without a full OAuth round-trip.
  if (process.env.NODE_ENV !== "production") {
    const header = req.headers.get("x-dev-actor");
    if (header) {
      const parsed = actorSchema.safeParse(JSON.parse(header));
      if (parsed.success) return parsed.data;
    }
  }
  return null;
}

/**
 * Resolves the exam scope for a request from the `x-exam-id` header or `exam`
 * query parameter. Returns null when unscoped (caller decides if that's valid).
 */
export function resolveExamId(req: Request): string | null {
  const header = req.headers.get("x-exam-id");
  if (header) return header;
  const url = new URL(req.url);
  return url.searchParams.get("exam");
}

/** Like {@link resolveExamId} but throws a 422 when no scope is provided. */
export function requireExamId(req: Request): string {
  const examId = resolveExamId(req);
  if (!examId) {
    throw new ValidationError("Exam scope required: provide ?exam=<uuid> or the x-exam-id header");
  }
  return examId;
}

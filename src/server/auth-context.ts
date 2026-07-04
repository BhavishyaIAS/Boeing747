import { z } from "zod";
import type { Actor } from "./context";
import { UnauthorizedError, ValidationError } from "./errors";

/**
 * Resolves the request actor. Auth.js integration lands in Phase 8; until then,
 * a signed-in session is not yet available. To let the API be exercised end-to-
 * end in development, a non-production request may carry an `x-dev-actor` header
 * containing the actor JSON. In production this path is disabled and a missing
 * session always yields 401 — there is no fake auth in production.
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

async function tryResolveActor(req: Request): Promise<Actor | null> {
  // TODO(Phase 8): read the Auth.js session and map it to an Actor.
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

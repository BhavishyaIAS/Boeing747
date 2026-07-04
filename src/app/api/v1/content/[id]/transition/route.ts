import type { NextRequest } from "next/server";
import { handle, ok, parseBody } from "@server/api";
import { requireExamId, resolveActor } from "@server/auth-context";
import { contentService, transitionSchema } from "@modules/content";

/**
 * POST /api/v1/content/:id/transition?exam=<uuid>
 * Body: { action: "SUBMIT" | "APPROVE" | ..., comment?: string }
 * Drives the editorial state machine with permission + separation-of-duties
 * checks; review actions record a content_review.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await resolveActor(req);
    const examId = requireExamId(req);
    const { id } = await ctx.params;
    const { action, comment } = await parseBody(req, transitionSchema);
    const item = await contentService.transition(actor, examId, id, action, comment);
    return ok(item);
  });
}

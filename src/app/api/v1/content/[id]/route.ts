import type { NextRequest } from "next/server";
import { handle, ok } from "@server/api";
import { requireExamId, resolveActor } from "@server/auth-context";
import { contentService } from "@modules/content";

/**
 * GET /api/v1/content/:id?exam=<uuid>
 * Returns a single content item. Students see only PUBLISHED items; editors
 * (content:update) also see drafts. Cross-exam access is not revealed.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await resolveActor(req);
    const examId = requireExamId(req);
    const { id } = await ctx.params;
    const item = await contentService.getById(actor, examId, id);
    return ok(item);
  });
}

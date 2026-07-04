import type { NextRequest } from "next/server";
import { handle, ok } from "@server/api";
import { requireExamId, resolveActor } from "@server/auth-context";
import { taxonomyService } from "@modules/taxonomy";

/**
 * GET /api/v1/syllabus/:slug?exam=<uuid>
 * Returns a node with its breadcrumb trail and immediate children.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await resolveActor(req);
    const examId = requireExamId(req);
    const { slug } = await ctx.params;
    const node = await taxonomyService.getNodeBySlug(actor, examId, slug);
    return ok(node);
  });
}

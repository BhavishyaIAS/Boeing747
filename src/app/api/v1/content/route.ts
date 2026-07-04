import type { NextRequest } from "next/server";
import { created, handle, ok, parseBody, parseQuery } from "@server/api";
import { requireExamId, resolveActor } from "@server/auth-context";
import { contentService, createContentSchema, listContentQuerySchema } from "@modules/content";

/**
 * GET /api/v1/content?exam=<uuid>&type=NOTE&cursor=<uuid>&limit=20
 * Lists PUBLISHED content for the exam (cursor-paginated).
 */
export async function GET(req: NextRequest): Promise<Response> {
  return handle(async () => {
    const actor = await resolveActor(req);
    const examId = requireExamId(req);
    const query = parseQuery(new URL(req.url).searchParams, listContentQuerySchema);
    const page = await contentService.list(actor, examId, {
      type: query.type,
      limit: query.limit,
      cursor: query.cursor ?? null,
    });
    return ok(page.items, { nextCursor: page.nextCursor });
  });
}

/**
 * POST /api/v1/content?exam=<uuid>
 * Creates a new DRAFT content item (with version 1).
 */
export async function POST(req: NextRequest): Promise<Response> {
  return handle(async () => {
    const actor = await resolveActor(req);
    const examId = requireExamId(req);
    const input = await parseBody(req, createContentSchema);
    const item = await contentService.create(actor, examId, input);
    return created(item);
  });
}

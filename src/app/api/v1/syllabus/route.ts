import type { NextRequest } from "next/server";
import { handle, ok, parseQuery } from "@server/api";
import { requireExamId, resolveActor } from "@server/auth-context";
import { listNodesQuerySchema, taxonomyService } from "@modules/taxonomy";

/**
 * GET /api/v1/syllabus?exam=<uuid>&parent=<uuid>
 * Lists top-level subjects, or the children of `parent` when provided.
 */
export async function GET(req: NextRequest): Promise<Response> {
  return handle(async () => {
    const actor = await resolveActor(req);
    const examId = requireExamId(req);
    const query = parseQuery(new URL(req.url).searchParams, listNodesQuerySchema);
    const nodes = await taxonomyService.listNodes(actor, examId, query.parent ?? null);
    return ok(nodes);
  });
}

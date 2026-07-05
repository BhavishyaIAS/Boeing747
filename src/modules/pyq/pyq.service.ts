import type { Actor } from "@server/context";
import { authorize } from "@server/authorize";
import { PERMISSIONS } from "@modules/identity";
import { NotFoundError } from "@server/errors";
import {
  PrismaPyqRepository,
  type PyqDetail,
  type PyqFilters,
  type PyqRepository,
  type PyqSummary,
} from "./pyq.repository";

export interface PyqPage {
  items: PyqSummary[];
  nextCursor: string | null;
}

/** Student-facing Previous-Year-Questions browsing. Requires pyq:read. */
export class PyqService {
  constructor(private readonly repo: PyqRepository = new PrismaPyqRepository()) {}

  async list(
    actor: Actor,
    examId: string,
    filters: Omit<PyqFilters, "cursor"> & { cursor?: string | null },
  ): Promise<PyqPage> {
    authorize(actor, PERMISSIONS.PYQ_READ, { examId });
    const rows = await this.repo.list(examId, { ...filters, cursor: filters.cursor ?? null });
    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const last = items[items.length - 1];
    return { items, nextCursor: hasMore && last ? last.id : null };
  }

  async availableYears(actor: Actor, examId: string): Promise<number[]> {
    authorize(actor, PERMISSIONS.PYQ_READ, { examId });
    return this.repo.years(examId);
  }

  async getBySlug(actor: Actor, examId: string, slug: string): Promise<PyqDetail> {
    authorize(actor, PERMISSIONS.PYQ_READ, { examId });
    const detail = await this.repo.getBySlug(examId, slug);
    if (!detail) throw new NotFoundError("Question not found");
    return detail;
  }
}

export const pyqService = new PyqService();

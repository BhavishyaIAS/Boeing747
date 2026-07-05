import type { Actor } from "@server/context";
import { authorize } from "@server/authorize";
import { PERMISSIONS } from "@modules/identity";
import { NotFoundError } from "@server/errors";
import {
  PrismaCurrentAffairsRepository,
  type CaDetail,
  type CaFilters,
  type CaSummary,
  type CurrentAffairsRepository,
} from "./current-affairs.repository";

export interface CaPage {
  items: CaSummary[];
  nextCursor: string | null;
}

/** Student-facing current-affairs feed. Requires ca:read. */
export class CurrentAffairsService {
  constructor(
    private readonly repo: CurrentAffairsRepository = new PrismaCurrentAffairsRepository(),
  ) {}

  async list(
    actor: Actor,
    examId: string,
    filters: Omit<CaFilters, "cursor"> & { cursor?: string | null },
  ): Promise<CaPage> {
    authorize(actor, PERMISSIONS.CA_READ, { examId });
    const rows = await this.repo.list(examId, { ...filters, cursor: filters.cursor ?? null });
    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const last = items[items.length - 1];
    return { items, nextCursor: hasMore && last ? last.id : null };
  }

  async categories(actor: Actor, examId: string): Promise<string[]> {
    authorize(actor, PERMISSIONS.CA_READ, { examId });
    return this.repo.categories(examId);
  }

  async getBySlug(actor: Actor, examId: string, slug: string): Promise<CaDetail> {
    authorize(actor, PERMISSIONS.CA_READ, { examId });
    const detail = await this.repo.getBySlug(examId, slug);
    if (!detail) throw new NotFoundError("Current affairs item not found");
    return detail;
  }
}

export const currentAffairsService = new CurrentAffairsService();

import type { CaCadence, CaRegion, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@lib/db";

export interface CaFilters {
  cadence?: CaCadence;
  region?: CaRegion;
  category?: string;
  limit: number;
  cursor?: string | null;
}

export interface CaTopic {
  title: string;
  slug: string;
}

export interface CaSummary {
  id: string;
  slug: string;
  title: string;
  cadence: CaCadence;
  region: CaRegion;
  category: string | null;
  publishDate: Date;
  topics: CaTopic[];
}

export interface CaDetail extends CaSummary {
  body: Prisma.JsonValue;
}

export interface CurrentAffairsRepository {
  list(examId: string, filters: CaFilters): Promise<CaSummary[]>;
  categories(examId: string): Promise<string[]>;
  getBySlug(examId: string, slug: string): Promise<CaDetail | null>;
}

const topicsOf = (nodes: { node: { title: string; slug: string } }[]): CaTopic[] =>
  nodes.map((n) => ({ title: n.node.title, slug: n.node.slug }));

export class PrismaCurrentAffairsRepository implements CurrentAffairsRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async list(examId: string, filters: CaFilters): Promise<CaSummary[]> {
    const rows = await this.db.contentItem.findMany({
      where: {
        examId,
        type: "CURRENT_AFFAIR",
        status: "PUBLISHED",
        deletedAt: null,
        currentAffair: {
          is: {
            ...(filters.cadence ? { cadence: filters.cadence } : {}),
            ...(filters.region ? { region: filters.region } : {}),
            ...(filters.category ? { category: filters.category } : {}),
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      include: {
        currentAffair: true,
        nodes: { include: { node: { select: { title: true, slug: true } } } },
      },
    });

    return rows.flatMap((row) => {
      if (!row.currentAffair) return [];
      return [
        {
          id: row.id,
          slug: row.slug,
          title: row.title,
          cadence: row.currentAffair.cadence,
          region: row.currentAffair.region,
          category: row.currentAffair.category,
          publishDate: row.currentAffair.publishDate,
          topics: topicsOf(row.nodes),
        },
      ];
    });
  }

  async categories(examId: string): Promise<string[]> {
    const rows = await this.db.currentAffair.findMany({
      where: { category: { not: null }, item: { examId, status: "PUBLISHED", deletedAt: null } },
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    });
    return rows.flatMap((r) => (r.category ? [r.category] : []));
  }

  async getBySlug(examId: string, slug: string): Promise<CaDetail | null> {
    const row = await this.db.contentItem.findFirst({
      where: { examId, slug, type: "CURRENT_AFFAIR", status: "PUBLISHED", deletedAt: null },
      include: {
        currentVersion: true,
        currentAffair: true,
        nodes: { include: { node: { select: { title: true, slug: true } } } },
      },
    });
    if (!row || !row.currentAffair) return null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      cadence: row.currentAffair.cadence,
      region: row.currentAffair.region,
      category: row.currentAffair.category,
      publishDate: row.currentAffair.publishDate,
      topics: topicsOf(row.nodes),
      body: row.currentVersion?.body ?? {},
    };
  }
}

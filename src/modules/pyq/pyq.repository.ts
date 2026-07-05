import type {
  Difficulty,
  ExamStage,
  Prisma,
  PrismaClient,
  QuestionKind,
} from "@prisma/client";
import { prisma } from "@lib/db";

export interface PyqFilters {
  stage?: ExamStage;
  year?: number;
  limit: number;
  cursor?: string | null;
}

export interface PyqTopic {
  title: string;
  slug: string;
}

export interface PyqSummary {
  id: string;
  slug: string;
  title: string;
  stage: ExamStage;
  kind: QuestionKind;
  year: number | null;
  paper: string | null;
  marks: string | null;
  difficulty: Difficulty | null;
  topics: PyqTopic[];
}

export interface PyqOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface PyqModelAnswer {
  title: string;
  slug: string;
  body: Prisma.JsonValue;
}

export interface PyqDetail extends PyqSummary {
  body: Prisma.JsonValue;
  explanation: Prisma.JsonValue | null;
  source: string | null;
  options: PyqOption[];
  modelAnswer: PyqModelAnswer | null;
}

export interface PyqRepository {
  list(examId: string, filters: PyqFilters): Promise<PyqSummary[]>;
  years(examId: string): Promise<number[]>;
  getBySlug(examId: string, slug: string): Promise<PyqDetail | null>;
}

const topicsOf = (nodes: { node: { title: string; slug: string } }[]): PyqTopic[] =>
  nodes.map((n) => ({ title: n.node.title, slug: n.node.slug }));

export class PrismaPyqRepository implements PyqRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async list(examId: string, filters: PyqFilters): Promise<PyqSummary[]> {
    const rows = await this.db.contentItem.findMany({
      where: {
        examId,
        type: "QUESTION",
        status: "PUBLISHED",
        deletedAt: null,
        question: {
          is: {
            isPyq: true,
            ...(filters.stage ? { stage: filters.stage } : {}),
            ...(filters.year ? { year: filters.year } : {}),
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      include: {
        question: true,
        nodes: { include: { node: { select: { title: true, slug: true } } } },
      },
    });

    return rows.flatMap((row) => {
      if (!row.question) return [];
      return [
        {
          id: row.id,
          slug: row.slug,
          title: row.title,
          stage: row.question.stage,
          kind: row.question.kind,
          year: row.question.year,
          paper: row.question.paper,
          marks: row.question.marks?.toString() ?? null,
          difficulty: row.difficulty,
          topics: topicsOf(row.nodes),
        },
      ];
    });
  }

  async years(examId: string): Promise<number[]> {
    const rows = await this.db.question.findMany({
      where: {
        isPyq: true,
        year: { not: null },
        item: { examId, status: "PUBLISHED", deletedAt: null },
      },
      distinct: ["year"],
      orderBy: { year: "desc" },
      select: { year: true },
    });
    return rows.flatMap((r) => (r.year == null ? [] : [r.year]));
  }

  async getBySlug(examId: string, slug: string): Promise<PyqDetail | null> {
    const row = await this.db.contentItem.findFirst({
      where: { examId, slug, type: "QUESTION", status: "PUBLISHED", deletedAt: null },
      include: {
        currentVersion: true,
        question: {
          include: {
            options: { orderBy: { orderIndex: "asc" } },
            modelAnswer: { include: { currentVersion: true } },
          },
        },
        nodes: { include: { node: { select: { title: true, slug: true } } } },
      },
    });
    if (!row || !row.question) return null;

    const ma = row.question.modelAnswer;
    const modelAnswer: PyqModelAnswer | null =
      ma && ma.status === "PUBLISHED"
        ? { title: ma.title, slug: ma.slug, body: ma.currentVersion?.body ?? {} }
        : null;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      stage: row.question.stage,
      kind: row.question.kind,
      year: row.question.year,
      paper: row.question.paper,
      marks: row.question.marks?.toString() ?? null,
      difficulty: row.difficulty,
      topics: topicsOf(row.nodes),
      body: row.currentVersion?.body ?? {},
      explanation: row.question.explanation ?? null,
      source: row.question.source,
      options: row.question.options.map((o) => ({
        id: o.id,
        label: o.label,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
      modelAnswer,
    };
  }
}

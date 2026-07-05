import type { Metadata } from "next";
import Link from "next/link";
import type { ExamStage } from "@prisma/client";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { pyqService } from "@modules/pyq";
import { cn } from "@lib/utils/cn";
import { Card, CardContent } from "@ui/card";
import { Badge } from "@ui/badge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "PYQs" };

const STAGES: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PRELIMS", label: "Prelims" },
  { key: "MAINS", label: "Mains" },
  { key: "INTERVIEW", label: "Interview" },
];

export default async function PyqPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; year?: string }>;
}) {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  const { stage, year } = await searchParams;

  const activeStage = stage && stage !== "ALL" ? (stage as ExamStage) : undefined;
  const activeYear = year ? Number(year) : undefined;

  const [{ items }, years] = await Promise.all([
    pyqService.list(actor, exam.id, { stage: activeStage, year: activeYear, limit: 50 }),
    pyqService.availableYears(actor, exam.id),
  ]);

  const yearHref = (y: number | null) => {
    const p = new URLSearchParams();
    if (stage && stage !== "ALL") p.set("stage", stage);
    if (y) p.set("year", String(y));
    const qs = p.toString();
    return `/app/pyqs${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold">Previous Year Questions</h1>
      <p className="mb-5 text-muted">Practise real APPSC questions with explanations and model answers.</p>

      {/* Stage tabs */}
      <div className="mb-3 flex flex-wrap gap-2">
        {STAGES.map((s) => {
          const p = new URLSearchParams();
          if (s.key !== "ALL") p.set("stage", s.key);
          if (year) p.set("year", year);
          const qs = p.toString();
          const active = (stage ?? "ALL") === s.key;
          return (
            <Link
              key={s.key}
              href={`/app/pyqs${qs ? `?${qs}` : ""}`}
              className={cn(
                "rounded-full border px-3.5 py-1 text-sm transition-colors",
                active
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border-strong text-muted hover:bg-surface-muted",
              )}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {/* Year filter */}
      {years.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-faint">Year:</span>
          <Link
            href={yearHref(null)}
            className={cn(
              "rounded-full px-2.5 py-0.5",
              !activeYear ? "bg-surface-muted font-semibold text-foreground" : "text-muted hover:bg-surface-muted",
            )}
          >
            All
          </Link>
          {years.map((y) => (
            <Link
              key={y}
              href={yearHref(y)}
              className={cn(
                "rounded-full px-2.5 py-0.5 tabular-nums",
                activeYear === y ? "bg-primary-subtle font-semibold text-primary" : "text-muted hover:bg-surface-muted",
              )}
            >
              {y}
            </Link>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-12 text-center text-muted">
          No questions match these filters yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((q) => (
            <Link key={q.id} href={`/app/pyqs/${q.slug}`} className="group">
              <Card className="transition-colors hover:border-border-strong">
                <CardContent className="p-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge tone="primary">{q.stage}</Badge>
                    {q.year ? <span className="tabular-nums">{q.year}</span> : null}
                    {q.paper ? <span>· {q.paper}</span> : null}
                    {q.marks ? <span>· {q.marks} marks</span> : null}
                    {q.difficulty ? <span>· {q.difficulty.toLowerCase()}</span> : null}
                    <span className="ml-auto rounded bg-surface-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                      {q.kind}
                    </span>
                  </div>
                  <div className="font-medium group-hover:text-primary">{q.title}</div>
                  {q.topics.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {q.topics.map((t) => (
                        <span key={t.slug} className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">
                          {t.title}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

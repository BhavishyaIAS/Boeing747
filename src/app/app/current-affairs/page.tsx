import type { Metadata } from "next";
import Link from "next/link";
import type { CaCadence, CaRegion } from "@prisma/client";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { currentAffairsService } from "@modules/current-affairs";
import { cn } from "@lib/utils/cn";
import { Card, CardContent } from "@ui/card";
import { Badge } from "@ui/badge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Current Affairs" };

const CADENCES = [
  { key: "ALL", label: "All" },
  { key: "DAILY", label: "Daily" },
  { key: "WEEKLY", label: "Weekly" },
  { key: "MONTHLY", label: "Monthly" },
];

const REGIONS = [
  { key: "ALL", label: "All regions" },
  { key: "ANDHRA_PRADESH", label: "Andhra Pradesh" },
  { key: "NATIONAL", label: "National" },
  { key: "INTERNATIONAL", label: "International" },
];

const REGION_LABEL: Record<CaRegion, string> = {
  ANDHRA_PRADESH: "AP",
  NATIONAL: "National",
  INTERNATIONAL: "International",
};

function buildHref(current: { cadence?: string; region?: string; category?: string }): string {
  const p = new URLSearchParams();
  if (current.cadence && current.cadence !== "ALL") p.set("cadence", current.cadence);
  if (current.region && current.region !== "ALL") p.set("region", current.region);
  if (current.category) p.set("category", current.category);
  const qs = p.toString();
  return `/app/current-affairs${qs ? `?${qs}` : ""}`;
}

export default async function CurrentAffairsPage({
  searchParams,
}: {
  searchParams: Promise<{ cadence?: string; region?: string; category?: string }>;
}) {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  const sp = await searchParams;

  const cadence = sp.cadence && sp.cadence !== "ALL" ? (sp.cadence as CaCadence) : undefined;
  const region = sp.region && sp.region !== "ALL" ? (sp.region as CaRegion) : undefined;
  const category = sp.category;

  const [{ items }, categories] = await Promise.all([
    currentAffairsService.list(actor, exam.id, { cadence, region, category, limit: 50 }),
    currentAffairsService.categories(actor, exam.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">Current Affairs</h1>
      <p className="mb-5 text-muted">Daily, weekly and monthly updates — linked to your syllabus.</p>

      {/* Cadence tabs */}
      <div className="mb-3 flex flex-wrap gap-2">
        {CADENCES.map((c) => {
          const active = (sp.cadence ?? "ALL") === c.key;
          return (
            <Link
              key={c.key}
              href={buildHref({ ...sp, cadence: c.key })}
              className={cn(
                "rounded-full border px-3.5 py-1 text-sm transition-colors",
                active
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border-strong text-muted hover:bg-surface-muted",
              )}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* Region + category filters */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-faint">Region:</span>
          {REGIONS.map((r) => {
            const active = (sp.region ?? "ALL") === r.key;
            return (
              <Link
                key={r.key}
                href={buildHref({ ...sp, region: r.key })}
                className={cn(
                  "rounded-full px-2.5 py-0.5",
                  active ? "bg-primary-subtle font-semibold text-primary" : "text-muted hover:bg-surface-muted",
                )}
              >
                {r.label}
              </Link>
            );
          })}
        </div>
        {categories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-faint">Category:</span>
            <Link
              href={buildHref({ cadence: sp.cadence, region: sp.region })}
              className={cn(
                "rounded-full px-2.5 py-0.5",
                !category ? "bg-surface-muted font-semibold text-foreground" : "text-muted hover:bg-surface-muted",
              )}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={buildHref({ ...sp, category: c })}
                className={cn(
                  "rounded-full px-2.5 py-0.5",
                  category === c ? "bg-primary-subtle font-semibold text-primary" : "text-muted hover:bg-surface-muted",
                )}
              >
                {c}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-12 text-center text-muted">
          No updates match these filters yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((ca) => (
            <Link key={ca.id} href={`/app/current-affairs/${ca.slug}`} className="group">
              <Card className="transition-colors hover:border-border-strong">
                <CardContent className="p-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge tone={ca.region === "ANDHRA_PRADESH" ? "primary" : "neutral"}>
                      {REGION_LABEL[ca.region]}
                    </Badge>
                    {ca.category ? <span>{ca.category}</span> : null}
                    <span className="ml-auto tabular-nums text-faint">
                      {ca.publishDate.toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="font-medium group-hover:text-primary">{ca.title}</div>
                  {ca.topics.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ca.topics.map((t) => (
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

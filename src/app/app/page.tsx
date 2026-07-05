import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Flame, RotateCcw } from "lucide-react";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { progressService } from "@modules/learning";
import { Card, CardContent } from "@ui/card";
import { Progress } from "@ui/progress";
import { Button } from "@ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default async function DashboardPage() {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  const dash = await progressService.getDashboard(actor, exam.id);
  const name = actor.email.split("@")[0] || "Aspirant";

  const stats = [
    { label: "Study time", value: formatMinutes(dash.weeklyStudyMinutes), icon: Clock },
    { label: "Topics read", value: String(dash.topicsReadThisWeek), icon: BookOpen },
    { label: "Revisions due", value: String(dash.revisionDueCount), icon: RotateCcw },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold capitalize">Good to see you, {name}</h1>
          <p className="text-muted">Here's where your {exam.name} prep stands.</p>
        </div>
        {dash.streakDays > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3.5 py-1.5 text-sm font-semibold text-accent">
            <Flame className="size-4" />
            {dash.streakDays}-day streak
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Continue reading */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
              Continue reading
            </div>
            {dash.continueReading.length === 0 ? (
              <div className="flex flex-col items-start gap-3 py-4">
                <p className="text-sm text-muted">
                  You haven't started reading yet. Begin with the syllabus to build your plan.
                </p>
                <Link href="/app/syllabus">
                  <Button size="sm">Explore the syllabus</Button>
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {dash.continueReading.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/app/read/${item.slug}`}
                      className="group flex items-center gap-4 rounded-lg border border-border p-3 hover:border-border-strong"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium group-hover:text-primary">
                          {item.title}
                        </div>
                        <Progress value={item.progressPercent} className="mt-2" />
                      </div>
                      <span className="shrink-0 text-sm tabular-nums text-muted">
                        {item.progressPercent}%
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* This week */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
              This week
            </div>
            <div className="flex flex-col gap-4">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-surface-muted text-muted">
                    <s.icon className="size-4" />
                  </span>
                  <span className="text-sm text-muted">{s.label}</span>
                  <span className="ml-auto text-lg font-semibold tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage */}
      <Card className="mt-4">
        <CardContent className="p-5">
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-faint">
            Syllabus coverage
          </div>
          {dash.coverage.length === 0 ? (
            <p className="text-sm text-muted">
              The syllabus is being prepared. Coverage will appear as topics are published.
            </p>
          ) : (
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {dash.coverage.map((c) => (
                <div key={c.slug}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <Link href={`/app/syllabus/${c.slug}`} className="font-medium hover:text-primary">
                      {c.title}
                    </Link>
                    <span className="tabular-nums text-muted">{c.percent}%</span>
                  </div>
                  <Progress value={c.percent} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Revision due */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
              Revision due today
            </div>
            {dash.revisionDue.length === 0 ? (
              <p className="text-sm text-muted">Nothing due — you're all caught up. 🎯</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {dash.revisionDue.map((r) => (
                  <li key={r.nodeId} className="py-2 first:pt-0 last:pb-0">
                    <Link
                      href={`/app/syllabus/${r.slug}`}
                      className="flex items-center gap-2 text-sm hover:text-primary"
                    >
                      <RotateCcw className="size-3.5 text-faint" />
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Focus areas */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
              Focus areas
            </div>
            {dash.focusAreas.length === 0 ? (
              <p className="text-sm text-muted">
                No weak areas flagged yet — they'll surface here from your coverage and tests.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {dash.focusAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full bg-warning-bg px-3 py-1 text-xs font-semibold text-warning"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

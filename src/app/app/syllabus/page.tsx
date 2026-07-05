import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { taxonomyService } from "@modules/taxonomy";
import { nodeProgressService } from "@modules/learning";
import { Card, CardContent } from "@ui/card";
import { NodeStatusDot } from "@ui/node-status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Syllabus" };

export default async function SyllabusPage() {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  const subjects = await taxonomyService.listNodes(actor, exam.id, null);
  const statuses = await nodeProgressService.getStatuses(
    actor,
    exam.id,
    subjects.map((s) => s.id),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold">{exam.name} Syllabus</h1>
      <p className="mb-6 text-muted">
        Every subject fragmented into themes, concepts, and exam angles. Drill in to study.
      </p>

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-12 text-center text-muted">
          The syllabus is being prepared. Check back soon.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {subjects.map((s) => (
            <Link key={s.id} href={`/app/syllabus/${s.slug}`} className="group">
              <Card className="transition-colors hover:border-border-strong">
                <CardContent className="flex items-center gap-3 p-4">
                  <NodeStatusDot status={statuses[s.id]} />
                  <div className="min-w-0">
                    <div className="font-medium group-hover:text-primary">{s.title}</div>
                    {s.summary ? (
                      <div className="truncate text-sm text-muted">{s.summary}</div>
                    ) : null}
                  </div>
                  <span className="ml-auto text-xs text-faint">
                    {s.hasChildren ? "Open" : "—"}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-faint" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

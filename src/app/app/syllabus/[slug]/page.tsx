import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileText } from "lucide-react";
import type { ContentType, NodeProgressStatus } from "@prisma/client";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { taxonomyService } from "@modules/taxonomy";
import { contentService, type ContentSummary } from "@modules/content";
import { nodeProgressService } from "@modules/learning";
import { Card, CardContent } from "@ui/card";
import { Button } from "@ui/button";
import { NodeStatusBadge, NodeStatusDot } from "@ui/node-status";
import { markNodeAction } from "../actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<ContentType, string> = {
  NOTE: "Notes",
  MICRO_TOPIC: "Micro-topics",
  MODEL_ANSWER: "Model answers",
  FAQ: "FAQs",
  EDITORIAL: "Editorials",
  QUESTION: "Questions",
  REFERENCE: "References",
  VISUAL: "Visuals",
  VIDEO: "Videos",
  FLASHCARD: "Flashcards",
  CURRENT_AFFAIR: "Current affairs",
};

const MARK_OPTIONS: { status: NodeProgressStatus; label: string }[] = [
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "MASTERED", label: "Mastered" },
  { status: "REVISED", label: "Revised" },
];

function groupByType(items: ContentSummary[]): [ContentType, ContentSummary[]][] {
  const map = new Map<ContentType, ContentSummary[]>();
  for (const item of items) {
    const list = map.get(item.type) ?? [];
    list.push(item);
    map.set(item.type, list);
  }
  return [...map.entries()];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

export default async function NodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await requireActor();
  const exam = await getDefaultExam();

  const node = await taxonomyService.getNodeBySlug(actor, exam.id, slug).catch(() => null);
  if (!node) notFound();

  const [content, childStatuses, selfStatuses] = await Promise.all([
    contentService.listByNode(actor, exam.id, node.id),
    nodeProgressService.getStatuses(actor, exam.id, node.children.map((c) => c.id)),
    nodeProgressService.getStatuses(actor, exam.id, [node.id]),
  ]);
  const selfStatus = selfStatuses[node.id];
  const grouped = groupByType(content);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/app/syllabus" className="hover:text-foreground">
          Syllabus
        </Link>
        {node.breadcrumb.map((b, i) => {
          const isLast = i === node.breadcrumb.length - 1;
          return (
            <span key={b.id} className="flex items-center gap-1">
              <ChevronRight className="size-3.5 text-faint" />
              {isLast ? (
                <span className="font-medium text-foreground">{b.title}</span>
              ) : (
                <Link href={`/app/syllabus/${b.slug}`} className="hover:text-foreground">
                  {b.title}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{node.title}</h1>
        <NodeStatusBadge status={selfStatus} />
        <span className="text-xs uppercase tracking-wide text-faint">{node.type.replace("_", " ")}</span>
      </div>
      {node.summary ? <p className="mb-4 max-w-2xl text-muted">{node.summary}</p> : null}
      {node.examAngle ? (
        <div className="mb-5 rounded-lg border-l-2 border-primary bg-primary-subtle/50 px-4 py-2 text-sm">
          <span className="font-semibold text-primary">Exam angle:</span> {node.examAngle}
        </div>
      ) : null}

      {/* Progress controls */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Mark as:</span>
        {MARK_OPTIONS.map((opt) => (
          <form key={opt.status} action={markNodeAction}>
            <input type="hidden" name="nodeId" value={node.id} />
            <input type="hidden" name="slug" value={node.slug} />
            <input type="hidden" name="status" value={opt.status} />
            <Button
              type="submit"
              size="sm"
              variant={selfStatus === opt.status ? "primary" : "secondary"}
            >
              {opt.label}
            </Button>
          </form>
        ))}
      </div>

      {/* Children */}
      {node.children.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
            Sub-topics ({node.children.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {node.children.map((child) => (
              <Link key={child.id} href={`/app/syllabus/${child.slug}`} className="group">
                <Card className="transition-colors hover:border-border-strong">
                  <CardContent className="flex items-center gap-3 p-3.5">
                    <NodeStatusDot status={childStatuses[child.id]} />
                    <span className="min-w-0 truncate font-medium group-hover:text-primary">
                      {child.title}
                    </span>
                    <ChevronRight className="ml-auto size-4 shrink-0 text-faint" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Attached content */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
          Study material
        </h2>
        {grouped.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted">
            No published material on this topic yet.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map(([type, items]) => (
              <div key={type}>
                <div className="mb-2 text-xs font-semibold text-muted">{TYPE_LABEL[type]}</div>
                <Card>
                  <ul className="divide-y divide-border">
                    {items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/app/read/${item.slug}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted"
                        >
                          <FileText className="size-4 shrink-0 text-faint" />
                          <span className="min-w-0 truncate hover:text-primary">{item.title}</span>
                          {item.readingTimeSeconds ? (
                            <span className="ml-auto shrink-0 text-xs text-faint">
                              {Math.max(1, Math.round(item.readingTimeSeconds / 60))} min
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

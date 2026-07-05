import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { pyqService } from "@modules/pyq";
import { RichText } from "@components/content/rich-text";
import { Badge } from "@ui/badge";
import { AnswerReveal } from "./answer-reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug.startsWith("pyq") ? "Question" : slug };
}

export default async function PyqDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await requireActor();
  const exam = await getDefaultExam();

  const q = await pyqService.getBySlug(actor, exam.id, slug).catch(() => null);
  if (!q) notFound();

  const isMcq = q.kind === "MCQ";

  return (
    <article className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link
          href="/app/pyqs"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          PYQs
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone="primary">{q.stage}</Badge>
        {q.year ? <span className="tabular-nums">{q.year}</span> : null}
        {q.paper ? <span>· {q.paper}</span> : null}
        {q.marks ? <span>· {q.marks} marks</span> : null}
        {q.difficulty ? <span>· {q.difficulty.toLowerCase()}</span> : null}
      </div>

      <h1 className="mb-4 font-serif text-2xl font-bold leading-snug">{q.title}</h1>

      <div className="mb-6 text-[15px]">
        <RichText doc={q.body} />
      </div>

      {isMcq ? (
        <AnswerReveal options={q.options} explanation={<RichText doc={q.explanation ?? {}} />} />
      ) : (
        <div className="flex flex-col gap-4">
          {q.modelAnswer ? (
            <details className="group rounded-xl border border-border bg-surface">
              <summary className="cursor-pointer list-none px-5 py-3.5 font-semibold marker:content-none">
                <span className="text-primary group-open:hidden">Reveal model answer →</span>
                <span className="hidden text-muted group-open:inline">Model answer</span>
              </summary>
              <div className="border-t border-border px-5 py-4">
                <RichText doc={q.modelAnswer.body} />
              </div>
            </details>
          ) : null}

          {q.explanation ? (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                Evaluation points
              </div>
              <RichText doc={q.explanation} />
            </div>
          ) : null}
        </div>
      )}

      {q.topics.length > 0 ? (
        <div className="mt-8 border-t border-border pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
            Linked topics
          </div>
          <div className="flex flex-wrap gap-2">
            {q.topics.map((t) => (
              <Link
                key={t.slug}
                href={`/app/syllabus/${t.slug}`}
                className="rounded-full bg-surface-muted px-3 py-1 text-xs text-muted hover:text-primary"
              >
                {t.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

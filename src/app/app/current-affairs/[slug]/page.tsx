import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { CaRegion } from "@prisma/client";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { currentAffairsService } from "@modules/current-affairs";
import { RichText } from "@components/content/rich-text";
import { Badge } from "@ui/badge";

export const dynamic = "force-dynamic";

const REGION_LABEL: Record<CaRegion, string> = {
  ANDHRA_PRADESH: "Andhra Pradesh",
  NATIONAL: "National",
  INTERNATIONAL: "International",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await requireActor().catch(() => null);
  if (!actor) return { title: "Current Affairs" };
  const exam = await getDefaultExam();
  const ca = await currentAffairsService.getBySlug(actor, exam.id, slug).catch(() => null);
  return { title: ca?.title ?? "Current Affairs" };
}

export default async function CurrentAffairDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const actor = await requireActor();
  const exam = await getDefaultExam();

  const ca = await currentAffairsService.getBySlug(actor, exam.id, slug).catch(() => null);
  if (!ca) notFound();

  return (
    <article className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link
          href="/app/current-affairs"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Current Affairs
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone={ca.region === "ANDHRA_PRADESH" ? "primary" : "neutral"}>
          {REGION_LABEL[ca.region]}
        </Badge>
        <span>{ca.cadence.toLowerCase()}</span>
        {ca.category ? <span>· {ca.category}</span> : null}
        <span className="ml-auto tabular-nums text-faint">
          {ca.publishDate.toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <h1 className="mb-5 font-serif text-3xl font-bold leading-tight">{ca.title}</h1>

      <RichText doc={ca.body} />

      {ca.topics.length > 0 ? (
        <div className="mt-8 border-t border-border pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
            Syllabus linkage
          </div>
          <div className="flex flex-wrap gap-2">
            {ca.topics.map((t) => (
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

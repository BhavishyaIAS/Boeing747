import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { contentService } from "@modules/content";
import { bookmarkService, readingService } from "@modules/learning";
import { RichText } from "@components/content/rich-text";
import { ReaderProgress } from "./reader-progress";
import { BookmarkButton } from "./bookmark-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await requireActor().catch(() => null);
  if (!actor) return { title: "Read" };
  const exam = await getDefaultExam();
  const data = await contentService.getPublishedBySlug(actor, exam.id, slug).catch(() => null);
  return { title: data?.item.title ?? "Read" };
}

export default async function ReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actor = await requireActor();
  const exam = await getDefaultExam();

  const data = await contentService.getPublishedBySlug(actor, exam.id, slug).catch(() => null);
  if (!data) notFound();
  const { item, body } = data;

  const [bookmarked, initialProgress] = await Promise.all([
    bookmarkService.isBookmarked(actor, exam.id, item.id),
    readingService.getProgress(actor, exam.id, item.id),
  ]);

  const minutes = Math.max(1, Math.round((item.readingTimeSeconds ?? 0) / 60));

  return (
    <>
      <ReaderProgress contentItemId={item.id} initialProgress={initialProgress} />
      <article className="mx-auto max-w-2xl">
        <div className="mb-4">
          <Link
            href="/app/syllabus"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Syllabus
          </Link>
        </div>

        <header className="mb-6 border-b border-border pb-5">
          <h1 className="mb-3 font-serif text-3xl font-bold leading-tight">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <Clock className="size-4" />
              {minutes} min read
            </span>
            <span className="text-xs uppercase tracking-wide text-faint">
              {item.type.replace(/_/g, " ")}
            </span>
            <div className="ml-auto">
              <BookmarkButton contentItemId={item.id} initial={bookmarked} />
            </div>
          </div>
        </header>

        <RichText doc={body} />
      </article>
    </>
  );
}

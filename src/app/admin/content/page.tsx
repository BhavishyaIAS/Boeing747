import Link from "next/link";
import type { ContentStatus } from "@prisma/client";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { contentService } from "@modules/content";
import { cn } from "@lib/utils/cn";
import { StatusBadge } from "@ui/badge";
import { Button } from "@ui/button";
import { Table, TD, TH, THead, TR } from "@ui/table";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Draft" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "APPROVED", label: "Approved" },
  { key: "PUBLISHED", label: "Published" },
  { key: "ARCHIVED", label: "Archived" },
];

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  const { status } = await searchParams;
  const active = status ?? "ALL";
  const filter = active !== "ALL" ? (active as ContentStatus) : undefined;
  const { items } = await contentService.listManaged(actor, exam.id, { limit: 50, status: filter });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Content</h1>
        <Link href="/admin/content/new">
          <Button>+ New</Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "ALL" ? "/admin/content" : `/admin/content?status=${f.key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active === f.key
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border-strong text-muted hover:bg-surface-muted",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-12 text-center text-muted">
          No content yet. <Link href="/admin/content/new" className="text-primary hover:underline">Create the first item</Link>.
        </div>
      ) : (
        <Table>
          <THead>
            <TR className="border-t-0">
              <TH>Title</TH>
              <TH>Type</TH>
              <TH>Status</TH>
              <TH>Updated</TH>
            </TR>
          </THead>
          <tbody>
            {items.map((it) => (
              <TR key={it.id} className="hover:bg-surface-muted">
                <TD>
                  <Link href={`/admin/content/${it.id}`} className="font-medium hover:text-primary">
                    {it.title}
                  </Link>
                </TD>
                <TD className="text-muted">{it.type}</TD>
                <TD>
                  <StatusBadge status={it.status} />
                </TD>
                <TD className="text-muted tabular-nums">
                  {new Date(it.updatedAt).toLocaleDateString()}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

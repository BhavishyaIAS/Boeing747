import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { can } from "@server/authorize";
import { contentService } from "@modules/content";
import { ACTION_PERMISSION, REVIEW_ACTIONS, availableActions, type WorkflowAction } from "@modules/workflow";
import { extractPlainText } from "@lib/utils/text";
import { StatusBadge } from "@ui/badge";
import { Button } from "@ui/button";
import { Card, CardContent } from "@ui/card";
import { Input, Label, Textarea } from "@ui/field";
import { saveDraftAction, transitionAction } from "../actions";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<WorkflowAction, string> = {
  SUBMIT: "Submit for review",
  APPROVE: "Approve",
  REQUEST_CHANGES: "Request changes",
  REJECT: "Reject",
  PUBLISH: "Publish",
  ARCHIVE: "Archive",
  REVISE: "Revise (new draft)",
};

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActor();
  const exam = await getDefaultExam();

  const data = await contentService.getForEditing(actor, exam.id, id).catch(() => null);
  if (!data) notFound();
  const { item, body } = data;

  const text = extractPlainText(body);
  const isDraft = item.status === "DRAFT";

  const permitted = availableActions(item.status).filter(
    (a) =>
      can(actor, ACTION_PERMISSION[a], { examId: exam.id }) &&
      !(REVIEW_ACTIONS.has(a) && item.authorId === actor.userId),
  );
  const reviewActions = permitted.filter((a) => REVIEW_ACTIONS.has(a));
  const otherActions = permitted.filter((a) => !REVIEW_ACTIONS.has(a));
  const isOwnContent = item.authorId === actor.userId;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 text-sm">
        <Link href="/admin/content" className="text-muted hover:text-foreground">
          ← Content
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <StatusBadge status={item.status} />
        <span className="text-sm text-faint">{item.type}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Editor */}
        <Card>
          <CardContent className="p-5">
            {isDraft ? (
              <form action={saveDraftAction} className="flex flex-col gap-4">
                <input type="hidden" name="id" value={item.id} />
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" defaultValue={item.title} required minLength={3} />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" name="content" rows={16} defaultValue={text} placeholder="Write the content…" />
                  <p className="mt-1.5 text-xs text-faint">
                    Plain text for now; rich editing (TipTap) arrives with the Notes module.
                  </p>
                </div>
                <div>
                  <Button type="submit">Save draft</Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                  This item is <strong>{item.status.toLowerCase().replace("_", " ")}</strong> and is
                  read-only. Revise it back to a draft to edit.
                </p>
                <div className="whitespace-pre-wrap rounded-lg border border-border bg-surface-muted p-4 text-sm">
                  {text || <span className="text-faint">No content yet.</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
                Workflow
              </div>
              {otherActions.length === 0 && reviewActions.length === 0 ? (
                <p className="text-sm text-muted">No actions available to you in this state.</p>
              ) : null}

              <div className="flex flex-col gap-2">
                {otherActions.map((a) => (
                  <form key={a} action={transitionAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="action" value={a} />
                    <Button
                      type="submit"
                      variant={a === "PUBLISH" ? "primary" : "secondary"}
                      className="w-full"
                    >
                      {ACTION_LABEL[a]}
                    </Button>
                  </form>
                ))}
              </div>

              {reviewActions.length > 0 ? (
                <form action={transitionAction} className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <input type="hidden" name="id" value={item.id} />
                  <Label htmlFor="comment">Review comment</Label>
                  <Textarea id="comment" name="comment" rows={3} placeholder="Optional note to the author" />
                  <div className="flex flex-wrap gap-2">
                    {reviewActions.map((a) => (
                      <Button
                        key={a}
                        type="submit"
                        name="action"
                        value={a}
                        variant={a === "APPROVE" ? "primary" : a === "REJECT" ? "danger" : "secondary"}
                        size="sm"
                      >
                        {ACTION_LABEL[a]}
                      </Button>
                    ))}
                  </div>
                </form>
              ) : null}

              {item.status === "IN_REVIEW" && isOwnContent ? (
                <p className="mt-3 text-xs text-warning">
                  You can't review your own content (separation of duties).
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 text-sm">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                Details
              </div>
              <dl className="flex flex-col gap-1.5 text-muted">
                <div className="flex justify-between gap-2">
                  <dt>Reading time</dt>
                  <dd>{Math.max(1, Math.round((item.readingTimeSeconds ?? 0) / 60))} min</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Slug</dt>
                  <dd className="font-mono text-xs">{item.slug}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Updated</dt>
                  <dd className="tabular-nums">{new Date(item.updatedAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

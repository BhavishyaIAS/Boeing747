import type { NodeProgressStatus } from "@prisma/client";
import { cn } from "@lib/utils/cn";
import { Badge, type BadgeProps } from "@ui/badge";

const TONE: Record<NodeProgressStatus, NonNullable<BadgeProps["tone"]>> = {
  NOT_STARTED: "neutral",
  IN_PROGRESS: "review",
  REVISED: "approved",
  MASTERED: "published",
};

const LABEL: Record<NodeProgressStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  REVISED: "Revised",
  MASTERED: "Mastered",
};

export function NodeStatusBadge({ status }: { status?: NodeProgressStatus | null }) {
  const s = status ?? "NOT_STARTED";
  return (
    <Badge tone={TONE[s]}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {LABEL[s]}
    </Badge>
  );
}

/** Compact status indicator for dense lists (tree rows, cards). */
export function NodeStatusDot({ status }: { status?: NodeProgressStatus | null }) {
  if (!status || status === "NOT_STARTED") {
    return <span className="size-2.5 rounded-full border border-border-strong" aria-label="Not started" />;
  }
  const cls =
    status === "IN_PROGRESS" ? "bg-warning" : status === "REVISED" ? "bg-info" : "bg-success";
  return <span className={cn("size-2.5 rounded-full", cls)} aria-label={LABEL[status]} />;
}

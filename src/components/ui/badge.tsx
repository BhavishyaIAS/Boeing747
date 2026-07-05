import type * as React from "react";
import type { ContentStatus } from "@prisma/client";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-surface-muted text-muted",
        review: "bg-warning-bg text-warning",
        approved: "bg-info-bg text-info",
        published: "bg-success-bg text-success",
        archived: "bg-surface-muted text-faint",
        primary: "bg-primary-subtle text-primary",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const STATUS_TONE: Record<ContentStatus, NonNullable<BadgeProps["tone"]>> = {
  DRAFT: "neutral",
  IN_REVIEW: "review",
  APPROVED: "approved",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

const STATUS_LABEL: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

/** Content-lifecycle status chip (reuses the one status scale everywhere). */
export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

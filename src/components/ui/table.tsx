import type * as React from "react";
import { cn } from "@lib/utils/cn";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("bg-surface-muted", className)} {...props} />;
}

export function TH({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-faint",
        className,
      )}
      {...props}
    />
  );
}

export function TR({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("border-t border-border", className)} {...props} />;
}

export function TD({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}

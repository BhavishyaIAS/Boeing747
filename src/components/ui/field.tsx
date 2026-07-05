import type * as React from "react";
import { cn } from "@lib/utils/cn";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-semibold", className)} {...props} />;
}

const controlClass =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--ring)] disabled:opacity-50";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-24 font-mono", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(controlClass, "pr-8", className)} {...props} />;
}

export function Help({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-1.5 text-xs text-faint", className)} {...props} />;
}

"use client";

import { useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@lib/utils/cn";
import { Button } from "@ui/button";
import type { PyqOption } from "@modules/pyq";

/**
 * MCQ practice: pick an option, then reveal the correct answer and explanation.
 * The explanation is server-rendered and passed in as children.
 */
export function AnswerReveal({
  options,
  explanation,
}: {
  options: PyqOption[];
  explanation: ReactNode;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {options.map((o) => {
          const isSelected = selected === o.id;
          const showCorrect = revealed && o.isCorrect;
          const showWrong = revealed && isSelected && !o.isCorrect;
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => setSelected(o.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                  showCorrect && "border-success bg-success-bg text-success",
                  showWrong && "border-danger bg-danger-bg text-danger",
                  !revealed && isSelected && "border-primary bg-primary-subtle",
                  !revealed && !isSelected && "border-border hover:bg-surface-muted",
                  revealed && !showCorrect && !showWrong && "border-border opacity-70",
                )}
                aria-pressed={isSelected}
              >
                <span className="font-semibold">{o.label}.</span>
                <span className="min-w-0 flex-1">{o.text}</span>
                {showCorrect ? <Check className="size-4 shrink-0" /> : null}
                {showWrong ? <X className="size-4 shrink-0" /> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {!revealed ? (
        <Button className="mt-4" onClick={() => setRevealed(true)}>
          Show answer
        </Button>
      ) : (
        <div className="mt-5 rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
            Explanation
          </div>
          {explanation}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@ui/button";
import { toggleBookmarkAction } from "../actions";

export function BookmarkButton({
  contentItemId,
  initial,
}: {
  contentItemId: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={on ? "primary" : "secondary"}
      size="sm"
      disabled={pending}
      aria-pressed={on}
      onClick={() =>
        startTransition(async () => {
          setOn(await toggleBookmarkAction(contentItemId));
        })
      }
    >
      <Bookmark className={on ? "size-4 fill-current" : "size-4"} />
      {on ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}

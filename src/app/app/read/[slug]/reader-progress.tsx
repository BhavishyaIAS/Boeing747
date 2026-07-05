"use client";

import { useEffect, useRef, useState } from "react";
import { recordReadingAction } from "../actions";

/**
 * A fixed top reading-progress bar that tracks scroll depth and periodically
 * persists the position + time spent. Flushes on tab hide and unmount so
 * "continue reading" resumes accurately.
 */
export function ReaderProgress({
  contentItemId,
  initialProgress,
}: {
  contentItemId: string;
  initialProgress: number;
}) {
  const [display, setDisplay] = useState(initialProgress);
  const pct = useRef(initialProgress);
  const lastSentPct = useRef(initialProgress);
  const lastFlush = useRef(Date.now());

  useEffect(() => {
    const compute = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      return max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100;
    };
    const onScroll = () => {
      const p = compute();
      pct.current = p;
      setDisplay(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const flush = () => {
      const now = Date.now();
      const add = Math.round((now - lastFlush.current) / 1000);
      lastFlush.current = now;
      if (add <= 0 && pct.current === lastSentPct.current) return;
      lastSentPct.current = pct.current;
      void recordReadingAction(contentItemId, pct.current, Math.max(0, add));
    };
    const interval = setInterval(flush, 8000);
    const onVisibility = () => {
      if (document.hidden) flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [contentItemId]);

  return (
    <div
      className="fixed left-0 top-0 z-50 h-1 bg-primary transition-[width] duration-150"
      style={{ width: `${display}%` }}
      aria-hidden
    />
  );
}

"use server";

import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { bookmarkService, readingService } from "@modules/learning";

export async function recordReadingAction(
  contentItemId: string,
  progressPercent: number,
  durationSeconds: number,
): Promise<void> {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  await readingService.record(actor, exam.id, contentItemId, { progressPercent, durationSeconds });
}

export async function toggleBookmarkAction(contentItemId: string): Promise<boolean> {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  return bookmarkService.toggle(actor, exam.id, contentItemId);
}

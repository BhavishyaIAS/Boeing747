"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ContentType } from "@prisma/client";
import { requireActor } from "@server/auth-context";
import { getDefaultExam } from "@server/exam-context";
import { contentService } from "@modules/content";
import type { WorkflowAction } from "@modules/workflow";

function textToDoc(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  return {
    type: "doc",
    content: trimmed ? [{ type: "paragraph", content: [{ type: "text", text: trimmed }] }] : [],
  };
}

export async function createContentAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "NOTE") as ContentType;
  const item = await contentService.create(actor, exam.id, {
    type,
    title,
    body: { type: "doc", content: [] },
  });
  redirect(`/admin/content/${item.id}`);
}

export async function saveDraftAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  await contentService.updateDraft(actor, exam.id, id, { title, body: textToDoc(content) });
  revalidatePath(`/admin/content/${id}`);
}

export async function transitionAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const exam = await getDefaultExam();
  const id = String(formData.get("id"));
  const action = String(formData.get("action")) as WorkflowAction;
  const commentRaw = formData.get("comment");
  const comment = commentRaw ? String(commentRaw) : undefined;
  await contentService.transition(actor, exam.id, id, action, comment);
  revalidatePath(`/admin/content/${id}`);
  revalidatePath("/admin/content");
}

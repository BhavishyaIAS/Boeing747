import { z } from "zod";
import { ContentType, Difficulty } from "@prisma/client";
import { WORKFLOW_ACTIONS } from "@modules/workflow";

/** Create a new content item (enters as DRAFT with version 1). */
export const createContentSchema = z.object({
  type: z.nativeEnum(ContentType),
  title: z.string().min(3).max(300),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug may contain only lowercase letters, digits and hyphens")
    .max(96)
    .optional(),
  difficulty: z.nativeEnum(Difficulty).nullable().optional(),
  /** TipTap/ProseMirror document (stored in content_version.body). */
  body: z.record(z.string(), z.unknown()).default({}),
  changeNote: z.string().max(500).optional(),
  nodeIds: z.array(z.string().uuid()).max(50).optional(),
});
export type CreateContentInput = z.infer<typeof createContentSchema>;

/** List published content (cursor-paginated). */
export const listContentQuerySchema = z.object({
  exam: z.string().uuid().optional(),
  type: z.nativeEnum(ContentType).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListContentQuery = z.infer<typeof listContentQuerySchema>;

/** Save an edit to a DRAFT item (creates a new version). */
export const updateContentSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  body: z.record(z.string(), z.unknown()),
  changeNote: z.string().max(500).optional(),
});
export type UpdateContentInput = z.infer<typeof updateContentSchema>;

/** Drive the editorial state machine. */
export const transitionSchema = z.object({
  action: z.enum(WORKFLOW_ACTIONS),
  comment: z.string().max(2000).optional(),
});
export type TransitionInput = z.infer<typeof transitionSchema>;

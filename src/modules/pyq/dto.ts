import { z } from "zod";
import { ExamStage } from "@prisma/client";

/** Browse PYQs, filtered by stage/year, cursor-paginated. */
export const listPyqQuerySchema = z.object({
  stage: z.nativeEnum(ExamStage).optional(),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListPyqQuery = z.infer<typeof listPyqQuerySchema>;

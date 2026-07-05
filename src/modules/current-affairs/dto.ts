import { z } from "zod";
import { CaCadence, CaRegion } from "@prisma/client";

/** Browse the current-affairs feed, filtered by cadence/region/category. */
export const listCaQuerySchema = z.object({
  cadence: z.nativeEnum(CaCadence).optional(),
  region: z.nativeEnum(CaRegion).optional(),
  category: z.string().max(80).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListCaQuery = z.infer<typeof listCaQuerySchema>;

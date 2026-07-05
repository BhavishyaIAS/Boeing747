/** Current Affairs module — public API. */
export {
  CurrentAffairsService,
  currentAffairsService,
  type CaPage,
} from "./current-affairs.service";
export { listCaQuerySchema, type ListCaQuery } from "./dto";
export type {
  CurrentAffairsRepository,
  CaSummary,
  CaDetail,
  CaTopic,
  CaFilters,
} from "./current-affairs.repository";

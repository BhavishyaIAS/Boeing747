-- Full-text search (Phase 3 §8, Decision #2). Adds tsvector columns to the
-- searchable tables with GIN indexes, kept current by triggers. Apply after the
-- Prisma migration (these columns are not modeled in schema.prisma; the app
-- reads them only through the SearchPort with raw SQL).
--
-- Weighting: title = A, keywords/plain summary = B, body plain_text = C.

-- ── syllabus_node ────────────────────────────────────────────────
ALTER TABLE "syllabus_node" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

CREATE OR REPLACE FUNCTION syllabus_node_search_update() RETURNS trigger AS $$
BEGIN
  NEW."search_vector" :=
    setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."summary", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."examAngle", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_syllabus_node_search ON "syllabus_node";
CREATE TRIGGER trg_syllabus_node_search
  BEFORE INSERT OR UPDATE OF "title", "summary", "examAngle"
  ON "syllabus_node"
  FOR EACH ROW EXECUTE FUNCTION syllabus_node_search_update();

CREATE INDEX IF NOT EXISTS "syllabus_node_search_idx"
  ON "syllabus_node" USING GIN ("search_vector");

-- ── content_item (title weighted A; body plain_text folded in from the
--    current version, refreshed by the application on publish) ─────
ALTER TABLE "content_item" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

CREATE OR REPLACE FUNCTION content_item_search_update() RETURNS trigger AS $$
BEGIN
  NEW."search_vector" :=
    setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_item_search ON "content_item";
CREATE TRIGGER trg_content_item_search
  BEFORE INSERT OR UPDATE OF "title"
  ON "content_item"
  FOR EACH ROW EXECUTE FUNCTION content_item_search_update();

CREATE INDEX IF NOT EXISTS "content_item_search_idx"
  ON "content_item" USING GIN ("search_vector");

-- Partial index powering student-facing published feeds.
CREATE INDEX IF NOT EXISTS "content_item_published_idx"
  ON "content_item" ("examId", "type", "publishedAt" DESC)
  WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL;

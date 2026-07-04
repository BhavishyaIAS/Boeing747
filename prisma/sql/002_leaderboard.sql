-- Leaderboard materialized view (Phase 3 §7, FR-TEST-03). Ranks submitted
-- attempts per test by score. Refresh on a schedule or after batch scoring:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;

CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard AS
SELECT
  a."testId"                                                       AS test_id,
  a."userId"                                                       AS user_id,
  a."score"                                                        AS score,
  a."submittedAt"                                                  AS submitted_at,
  RANK() OVER (PARTITION BY a."testId" ORDER BY a."score" DESC)    AS rank
FROM "test_attempt" a
WHERE a."status" = 'SUBMITTED';

-- Unique index is required for REFRESH ... CONCURRENTLY.
CREATE UNIQUE INDEX IF NOT EXISTS "leaderboard_test_user_idx"
  ON leaderboard (test_id, user_id);

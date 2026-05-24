-- Version chain for the regenerate flow.
-- Additive only: all columns are nullable / defaulted, existing rows remain valid.

ALTER TABLE "public"."Summary"
  ADD COLUMN "parentId" TEXT,
  ADD COLUMN "rootId"   TEXT,
  ADD COLUMN "version"  INTEGER NOT NULL DEFAULT 1;

-- Self-relation: deleting v2 must NOT cascade to v3, so SetNull.
ALTER TABLE "public"."Summary"
  ADD CONSTRAINT "Summary_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "public"."Summary"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Summary_rootId_idx"   ON "public"."Summary"("rootId");
CREATE INDEX "Summary_parentId_idx" ON "public"."Summary"("parentId");

CREATE TABLE IF NOT EXISTS curriculum_mapping_programs (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (institution_id) REFERENCES organization_registry_institutions(id),
  UNIQUE (institution_id, code)
);

ALTER TABLE accreditation_frameworks_review_team_memberships
ADD COLUMN conflict_status TEXT NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_curr_programs_institution ON curriculum_mapping_programs(institution_id);

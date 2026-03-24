CREATE TABLE IF NOT EXISTS accreditation_frameworks_accreditors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_frameworks (
  id TEXT PRIMARY KEY,
  accreditor_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (accreditor_id) REFERENCES accreditation_frameworks_accreditors(id),
  UNIQUE (accreditor_id, code)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_framework_versions (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL,
  version_tag TEXT NOT NULL,
  status TEXT NOT NULL,
  published_at TEXT,
  effective_start_date TEXT,
  effective_end_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (framework_id) REFERENCES accreditation_frameworks_frameworks(id),
  UNIQUE (framework_id, version_tag)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_standards (
  id TEXT PRIMARY KEY,
  framework_version_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sequence INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (framework_version_id) REFERENCES accreditation_frameworks_framework_versions(id),
  UNIQUE (framework_version_id, code)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_criteria (
  id TEXT PRIMARY KEY,
  framework_version_id TEXT NOT NULL,
  standard_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  statement TEXT,
  sequence INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (framework_version_id) REFERENCES accreditation_frameworks_framework_versions(id),
  FOREIGN KEY (standard_id) REFERENCES accreditation_frameworks_standards(id),
  UNIQUE (standard_id, code)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_criterion_elements (
  id TEXT PRIMARY KEY,
  framework_version_id TEXT NOT NULL,
  criterion_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  statement TEXT NOT NULL,
  element_type TEXT NOT NULL,
  required_flag INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  effective_start_date TEXT,
  effective_end_date TEXT,
  supersedes_element_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (framework_version_id) REFERENCES accreditation_frameworks_framework_versions(id),
  FOREIGN KEY (criterion_id) REFERENCES accreditation_frameworks_criteria(id),
  FOREIGN KEY (supersedes_element_id) REFERENCES accreditation_frameworks_criterion_elements(id),
  UNIQUE (criterion_id, code)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_evidence_requirements (
  id TEXT PRIMARY KEY,
  framework_version_id TEXT NOT NULL,
  criterion_id TEXT,
  criterion_element_id TEXT,
  requirement_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requirement_type TEXT NOT NULL,
  cardinality_rule TEXT NOT NULL,
  timing_expectation TEXT,
  evidence_class TEXT,
  is_mandatory INTEGER NOT NULL,
  effective_start_date TEXT,
  effective_end_date TEXT,
  supersedes_requirement_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (framework_version_id) REFERENCES accreditation_frameworks_framework_versions(id),
  FOREIGN KEY (criterion_id) REFERENCES accreditation_frameworks_criteria(id),
  FOREIGN KEY (criterion_element_id) REFERENCES accreditation_frameworks_criterion_elements(id),
  FOREIGN KEY (supersedes_requirement_id) REFERENCES accreditation_frameworks_evidence_requirements(id),
  UNIQUE (framework_version_id, requirement_code)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_cycles (
  id TEXT PRIMARY KEY,
  framework_version_id TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cycle_start_date TEXT NOT NULL,
  cycle_end_date TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (framework_version_id) REFERENCES accreditation_frameworks_framework_versions(id),
  FOREIGN KEY (institution_id) REFERENCES organization_registry_institutions(id)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_scopes (
  id TEXT PRIMARY KEY,
  accreditation_cycle_id TEXT NOT NULL,
  name TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  program_ids_json TEXT NOT NULL,
  organization_unit_ids_json TEXT NOT NULL,
  effective_start_date TEXT,
  effective_end_date TEXT,
  scope_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (accreditation_cycle_id) REFERENCES accreditation_frameworks_cycles(id)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_cycle_milestones (
  id TEXT PRIMARY KEY,
  accreditation_cycle_id TEXT NOT NULL,
  name TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL,
  scope_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (accreditation_cycle_id) REFERENCES accreditation_frameworks_cycles(id),
  FOREIGN KEY (scope_id) REFERENCES accreditation_frameworks_scopes(id)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_review_events (
  id TEXT PRIMARY KEY,
  accreditation_cycle_id TEXT NOT NULL,
  review_team_id TEXT,
  scope_id TEXT,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (accreditation_cycle_id) REFERENCES accreditation_frameworks_cycles(id),
  FOREIGN KEY (scope_id) REFERENCES accreditation_frameworks_scopes(id),
  FOREIGN KEY (review_team_id) REFERENCES accreditation_frameworks_review_teams(id)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_decision_records (
  id TEXT PRIMARY KEY,
  accreditation_cycle_id TEXT NOT NULL,
  review_event_id TEXT,
  decision_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  rationale TEXT,
  issued_at TEXT NOT NULL,
  status TEXT NOT NULL,
  supersedes_decision_record_id TEXT,
  superseded_by_decision_record_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (accreditation_cycle_id) REFERENCES accreditation_frameworks_cycles(id),
  FOREIGN KEY (review_event_id) REFERENCES accreditation_frameworks_review_events(id),
  FOREIGN KEY (supersedes_decision_record_id) REFERENCES accreditation_frameworks_decision_records(id),
  FOREIGN KEY (superseded_by_decision_record_id) REFERENCES accreditation_frameworks_decision_records(id)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_reviewer_profiles (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL UNIQUE,
  institution_id TEXT NOT NULL,
  reviewer_type TEXT NOT NULL,
  credential_summary TEXT,
  conflict_of_interest_notes TEXT,
  expertise_areas_json TEXT NOT NULL,
  status TEXT NOT NULL,
  effective_start_date TEXT,
  effective_end_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (person_id) REFERENCES organization_registry_people(id),
  FOREIGN KEY (institution_id) REFERENCES organization_registry_institutions(id)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_review_teams (
  id TEXT PRIMARY KEY,
  accreditation_cycle_id TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (accreditation_cycle_id) REFERENCES accreditation_frameworks_cycles(id),
  FOREIGN KEY (institution_id) REFERENCES organization_registry_institutions(id)
);

CREATE TABLE IF NOT EXISTS accreditation_frameworks_review_team_memberships (
  id TEXT PRIMARY KEY,
  review_team_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  reviewer_profile_id TEXT,
  role TEXT NOT NULL,
  responsibility_summary TEXT,
  is_primary INTEGER NOT NULL,
  state TEXT NOT NULL,
  effective_start_date TEXT,
  effective_end_date TEXT,
  supersedes_membership_id TEXT,
  superseded_by_membership_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (review_team_id) REFERENCES accreditation_frameworks_review_teams(id),
  FOREIGN KEY (person_id) REFERENCES organization_registry_people(id),
  FOREIGN KEY (reviewer_profile_id) REFERENCES accreditation_frameworks_reviewer_profiles(id),
  FOREIGN KEY (supersedes_membership_id) REFERENCES accreditation_frameworks_review_team_memberships(id),
  FOREIGN KEY (superseded_by_membership_id) REFERENCES accreditation_frameworks_review_team_memberships(id)
);

CREATE INDEX IF NOT EXISTS idx_afr_frameworks_accreditor ON accreditation_frameworks_frameworks(accreditor_id);
CREATE INDEX IF NOT EXISTS idx_afr_versions_framework ON accreditation_frameworks_framework_versions(framework_id);
CREATE INDEX IF NOT EXISTS idx_afr_cycles_framework_version ON accreditation_frameworks_cycles(framework_version_id);
CREATE INDEX IF NOT EXISTS idx_afr_cycles_institution ON accreditation_frameworks_cycles(institution_id);
CREATE INDEX IF NOT EXISTS idx_afr_scopes_cycle ON accreditation_frameworks_scopes(accreditation_cycle_id);
CREATE INDEX IF NOT EXISTS idx_afr_milestones_cycle ON accreditation_frameworks_cycle_milestones(accreditation_cycle_id);
CREATE INDEX IF NOT EXISTS idx_afr_events_cycle ON accreditation_frameworks_review_events(accreditation_cycle_id);
CREATE INDEX IF NOT EXISTS idx_afr_decisions_cycle ON accreditation_frameworks_decision_records(accreditation_cycle_id);
CREATE INDEX IF NOT EXISTS idx_afr_reviewer_profiles_institution ON accreditation_frameworks_reviewer_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_afr_review_teams_cycle ON accreditation_frameworks_review_teams(accreditation_cycle_id);
CREATE INDEX IF NOT EXISTS idx_afr_review_memberships_team ON accreditation_frameworks_review_team_memberships(review_team_id);

import { ReviewerProfileRepository, ReviewTeamRepository } from '../../domain/repositories/repositories.js';
import { ReviewerProfile } from '../../domain/entities/reviewer-profile.js';
import { ReviewTeam } from '../../domain/entities/review-team.js';

function parseJson(value) {
  if (!value) {
    return [];
  }
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function filterClause(filter = {}, keyMap = {}) {
  const where = [];
  const params = {};
  for (const [filterKey, column] of Object.entries(keyMap)) {
    const value = filter[filterKey];
    if (value === undefined || value === null) {
      continue;
    }
    where.push(`${column} = @${filterKey}`);
    params[filterKey] = value;
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

export class SqliteReviewerProfileRepository extends ReviewerProfileRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  async save(profile) {
    this.database.run(
      `INSERT INTO accreditation_frameworks_reviewer_profiles
       (id, person_id, institution_id, reviewer_type, credential_summary, conflict_of_interest_notes,
        expertise_areas_json, status, effective_start_date, effective_end_date, created_at, updated_at)
       VALUES (@id, @personId, @institutionId, @reviewerType, @credentialSummary, @conflictOfInterestNotes,
        @expertiseAreasJson, @status, @effectiveStartDate, @effectiveEndDate, @createdAt, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET
         person_id=excluded.person_id, institution_id=excluded.institution_id, reviewer_type=excluded.reviewer_type,
         credential_summary=excluded.credential_summary, conflict_of_interest_notes=excluded.conflict_of_interest_notes,
         expertise_areas_json=excluded.expertise_areas_json, status=excluded.status, effective_start_date=excluded.effective_start_date,
         effective_end_date=excluded.effective_end_date, updated_at=excluded.updated_at`,
      {
        id: profile.id,
        personId: profile.personId,
        institutionId: profile.institutionId,
        reviewerType: profile.reviewerType,
        credentialSummary: profile.credentialSummary,
        conflictOfInterestNotes: profile.conflictOfInterestNotes,
        expertiseAreasJson: JSON.stringify(profile.expertiseAreas),
        status: profile.status,
        effectiveStartDate: profile.effectiveStartDate,
        effectiveEndDate: profile.effectiveEndDate,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    );
    return profile;
  }

  async getById(id) {
    const row = this.database.get('SELECT * FROM accreditation_frameworks_reviewer_profiles WHERE id = @id', { id });
    return row ? this.#map(row) : null;
  }

  async getByPersonId(personId) {
    const row = this.database.get(
      'SELECT * FROM accreditation_frameworks_reviewer_profiles WHERE person_id = @personId',
      { personId },
    );
    return row ? this.#map(row) : null;
  }

  async findByFilter(filter = {}) {
    const { sql, params } = filterClause(filter, {
      id: 'id',
      personId: 'person_id',
      institutionId: 'institution_id',
      reviewerType: 'reviewer_type',
      status: 'status',
    });
    const rows = this.database.all(
      `SELECT * FROM accreditation_frameworks_reviewer_profiles ${sql} ORDER BY created_at ASC`,
      params,
    );
    return rows.map((row) => this.#map(row));
  }

  #map(row) {
    return new ReviewerProfile({
      id: row.id,
      personId: row.person_id,
      institutionId: row.institution_id,
      reviewerType: row.reviewer_type,
      credentialSummary: row.credential_summary,
      conflictOfInterestNotes: row.conflict_of_interest_notes,
      expertiseAreas: parseJson(row.expertise_areas_json),
      status: row.status,
      effectiveStartDate: row.effective_start_date,
      effectiveEndDate: row.effective_end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

export class SqliteReviewTeamRepository extends ReviewTeamRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  async save(team) {
    this.database.transaction(() => {
      this.database.run(
        `INSERT INTO accreditation_frameworks_review_teams
         (id, accreditation_cycle_id, institution_id, name, description, status, created_at, updated_at)
         VALUES (@id, @accreditationCycleId, @institutionId, @name, @description, @status, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           accreditation_cycle_id=excluded.accreditation_cycle_id, institution_id=excluded.institution_id,
           name=excluded.name, description=excluded.description, status=excluded.status, updated_at=excluded.updated_at`,
        {
          id: team.id,
          accreditationCycleId: team.accreditationCycleId,
          institutionId: team.institutionId,
          name: team.name,
          description: team.description,
          status: team.status,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
        },
      );

      for (const membership of team.memberships) {
        this.database.run(
          `INSERT INTO accreditation_frameworks_review_team_memberships
           (id, review_team_id, person_id, reviewer_profile_id, role, responsibility_summary, is_primary, state,
            conflict_status, effective_start_date, effective_end_date, supersedes_membership_id, superseded_by_membership_id, created_at, updated_at)
           VALUES (@id, @reviewTeamId, @personId, @reviewerProfileId, @role, @responsibilitySummary, @isPrimary, @state,
            @conflictStatus,
            @effectiveStartDate, @effectiveEndDate, @supersedesMembershipId, @supersededByMembershipId, @createdAt, @updatedAt)
           ON CONFLICT(id) DO UPDATE SET
             review_team_id=excluded.review_team_id, person_id=excluded.person_id, reviewer_profile_id=excluded.reviewer_profile_id,
             role=excluded.role, responsibility_summary=excluded.responsibility_summary, is_primary=excluded.is_primary,
             state=excluded.state, conflict_status=excluded.conflict_status, effective_start_date=excluded.effective_start_date, effective_end_date=excluded.effective_end_date,
             supersedes_membership_id=excluded.supersedes_membership_id, superseded_by_membership_id=excluded.superseded_by_membership_id,
             updated_at=excluded.updated_at`,
          {
            id: membership.id,
            reviewTeamId: membership.reviewTeamId,
            personId: membership.personId,
            reviewerProfileId: membership.reviewerProfileId,
            role: membership.role,
            responsibilitySummary: membership.responsibilitySummary,
            isPrimary: membership.isPrimary ? 1 : 0,
            state: membership.state,
            conflictStatus: membership.conflictStatus,
            effectiveStartDate: membership.effectiveStartDate,
            effectiveEndDate: membership.effectiveEndDate,
            supersedesMembershipId: membership.supersedesMembershipId,
            supersededByMembershipId: membership.supersededByMembershipId,
            createdAt: membership.createdAt,
            updatedAt: membership.updatedAt,
          },
        );
      }
    });
    return team;
  }

  async getById(id) {
    const row = this.database.get('SELECT * FROM accreditation_frameworks_review_teams WHERE id = @id', { id });
    return row ? this.#map(row) : null;
  }

  async findByFilter(filter = {}) {
    const { sql, params } = filterClause(filter, {
      id: 'id',
      accreditationCycleId: 'accreditation_cycle_id',
      institutionId: 'institution_id',
      status: 'status',
      name: 'name',
    });
    const rows = this.database.all(
      `SELECT * FROM accreditation_frameworks_review_teams ${sql} ORDER BY created_at ASC`,
      params,
    );
    return rows.map((row) => this.#map(row));
  }

  #map(row) {
    const memberships = this.database.all(
      `SELECT * FROM accreditation_frameworks_review_team_memberships
       WHERE review_team_id = @reviewTeamId
       ORDER BY created_at ASC`,
      { reviewTeamId: row.id },
    );
    return new ReviewTeam({
      id: row.id,
      accreditationCycleId: row.accreditation_cycle_id,
      institutionId: row.institution_id,
      name: row.name,
      description: row.description,
      status: row.status,
      memberships: memberships.map((item) => ({
        id: item.id,
        reviewTeamId: item.review_team_id,
        personId: item.person_id,
        reviewerProfileId: item.reviewer_profile_id,
        role: item.role,
        responsibilitySummary: item.responsibility_summary,
        isPrimary: item.is_primary === 1,
        state: item.state,
        conflictStatus: item.conflict_status ?? 'none',
        effectiveStartDate: item.effective_start_date,
        effectiveEndDate: item.effective_end_date,
        supersedesMembershipId: item.supersedes_membership_id,
        supersededByMembershipId: item.superseded_by_membership_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

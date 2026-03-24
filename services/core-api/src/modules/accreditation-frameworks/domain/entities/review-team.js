import { assertDateOrder, assertOneOf, assertRequired, assertString } from '../../../shared/kernel/assertions.js';
import { ValidationError } from '../../../shared/kernel/errors.js';
import { createId, nowIso } from '../../../shared/kernel/identity.js';
import { reviewTeamMembershipState, reviewTeamStatus } from '../value-objects/accreditation-statuses.js';

function assertUnique(values, message) {
  if (new Set(values).size !== values.length) {
    throw new ValidationError(message);
  }
}

export class ReviewTeamMembership {
  constructor(props) {
    assertRequired(props.id, 'ReviewTeamMembership.id');
    assertRequired(props.reviewTeamId, 'ReviewTeamMembership.reviewTeamId');
    assertRequired(props.personId, 'ReviewTeamMembership.personId');
    assertString(props.role, 'ReviewTeamMembership.role');
    assertOneOf(props.state, 'ReviewTeamMembership.state', Object.values(reviewTeamMembershipState));
    assertDateOrder(props.effectiveStartDate, props.effectiveEndDate);

    this.id = props.id;
    this.reviewTeamId = props.reviewTeamId;
    this.personId = props.personId;
    this.reviewerProfileId = props.reviewerProfileId ?? null;
    this.role = props.role;
    this.responsibilitySummary = props.responsibilitySummary ?? null;
    this.isPrimary = props.isPrimary ?? false;
    this.state = props.state;
    this.effectiveStartDate = props.effectiveStartDate ?? null;
    this.effectiveEndDate = props.effectiveEndDate ?? null;
    this.supersedesMembershipId = props.supersedesMembershipId ?? null;
    this.supersededByMembershipId = props.supersededByMembershipId ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input) {
    const now = nowIso();
    return new ReviewTeamMembership({
      id: input.id ?? createId('rtm'),
      reviewTeamId: input.reviewTeamId,
      personId: input.personId,
      reviewerProfileId: input.reviewerProfileId,
      role: input.role,
      responsibilitySummary: input.responsibilitySummary,
      isPrimary: input.isPrimary ?? false,
      state: input.state ?? reviewTeamMembershipState.ACTIVE,
      effectiveStartDate: input.effectiveStartDate,
      effectiveEndDate: input.effectiveEndDate,
      supersedesMembershipId: input.supersedesMembershipId,
      supersededByMembershipId: input.supersededByMembershipId,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export class ReviewTeam {
  constructor(props) {
    assertRequired(props.id, 'ReviewTeam.id');
    assertRequired(props.accreditationCycleId, 'ReviewTeam.accreditationCycleId');
    assertRequired(props.institutionId, 'ReviewTeam.institutionId');
    assertString(props.name, 'ReviewTeam.name');
    assertOneOf(props.status, 'ReviewTeam.status', Object.values(reviewTeamStatus));

    this.id = props.id;
    this.accreditationCycleId = props.accreditationCycleId;
    this.institutionId = props.institutionId;
    this.name = props.name;
    this.description = props.description ?? null;
    this.status = props.status;
    this.memberships = (props.memberships ?? []).map((item) =>
      item instanceof ReviewTeamMembership ? item : new ReviewTeamMembership(item),
    );
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this.#assertIntegrity();
  }

  static create(input) {
    const now = nowIso();
    return new ReviewTeam({
      id: input.id ?? createId('rt'),
      accreditationCycleId: input.accreditationCycleId,
      institutionId: input.institutionId,
      name: input.name,
      description: input.description,
      status: input.status ?? reviewTeamStatus.DRAFT,
      memberships: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  activate() {
    if (this.status !== reviewTeamStatus.DRAFT) {
      throw new ValidationError('ReviewTeam can only move to active from draft');
    }
    this.status = reviewTeamStatus.ACTIVE;
    this.updatedAt = nowIso();
    return this;
  }

  addMembership(input) {
    const membership = ReviewTeamMembership.create({
      ...input,
      reviewTeamId: this.id,
    });

    const activeForPerson = this.memberships.find(
      (item) => item.personId === membership.personId && item.state === reviewTeamMembershipState.ACTIVE,
    );
    if (activeForPerson && !membership.supersedesMembershipId) {
      throw new ValidationError(`Active ReviewTeamMembership already exists for personId: ${membership.personId}`);
    }

    if (membership.supersedesMembershipId) {
      const superseded = this.memberships.find((item) => item.id === membership.supersedesMembershipId);
      if (!superseded) {
        throw new ValidationError(`ReviewTeamMembership.supersedesMembershipId not found: ${membership.supersedesMembershipId}`);
      }
      if (superseded.supersededByMembershipId) {
        throw new ValidationError('ReviewTeamMembership already superseded and cannot be superseded twice');
      }
      if (superseded.personId !== membership.personId) {
        throw new ValidationError('Superseding membership must keep the same personId');
      }
      superseded.state = reviewTeamMembershipState.SUPERSEDED;
      superseded.supersededByMembershipId = membership.id;
      superseded.updatedAt = nowIso();
    }

    this.memberships.push(membership);
    this.updatedAt = nowIso();
    this.#assertIntegrity();
    return membership;
  }

  #assertIntegrity() {
    const primaryMemberships = this.memberships.filter(
      (membership) => membership.state === reviewTeamMembershipState.ACTIVE && membership.isPrimary,
    );
    if (primaryMemberships.length > 1) {
      throw new ValidationError('ReviewTeam allows only one active primary membership');
    }

    for (const membership of this.memberships) {
      if (membership.reviewTeamId !== this.id) {
        throw new ValidationError(
          `ReviewTeamMembership.reviewTeamId must match ReviewTeam.id: ${membership.id}`,
        );
      }
    }

    const supersededIds = this.memberships
      .filter((membership) => membership.supersedesMembershipId)
      .map((membership) => membership.supersedesMembershipId);
    assertUnique(supersededIds, 'ReviewTeamMembership cannot supersede the same membership twice');
  }
}

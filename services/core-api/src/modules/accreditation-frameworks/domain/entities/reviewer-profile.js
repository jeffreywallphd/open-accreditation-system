import { assertDateOrder, assertOneOf, assertRequired, assertString } from '../../../shared/kernel/assertions.js';
import { createId, nowIso } from '../../../shared/kernel/identity.js';
import { recordStatus } from '../../../shared/value-objects/statuses.js';

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.trim() !== ''))];
}

export class ReviewerProfile {
  constructor(props) {
    assertRequired(props.id, 'ReviewerProfile.id');
    assertRequired(props.personId, 'ReviewerProfile.personId');
    assertRequired(props.institutionId, 'ReviewerProfile.institutionId');
    assertString(props.reviewerType, 'ReviewerProfile.reviewerType');
    assertOneOf(props.status, 'ReviewerProfile.status', Object.values(recordStatus));
    assertDateOrder(props.effectiveStartDate, props.effectiveEndDate);

    this.id = props.id;
    this.personId = props.personId;
    this.institutionId = props.institutionId;
    this.reviewerType = props.reviewerType;
    this.credentialSummary = props.credentialSummary ?? null;
    this.conflictOfInterestNotes = props.conflictOfInterestNotes ?? null;
    this.expertiseAreas = uniqueStrings(props.expertiseAreas);
    this.status = props.status;
    this.effectiveStartDate = props.effectiveStartDate ?? null;
    this.effectiveEndDate = props.effectiveEndDate ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input) {
    const now = nowIso();
    return new ReviewerProfile({
      id: input.id ?? createId('revp'),
      personId: input.personId,
      institutionId: input.institutionId,
      reviewerType: input.reviewerType,
      credentialSummary: input.credentialSummary,
      conflictOfInterestNotes: input.conflictOfInterestNotes,
      expertiseAreas: input.expertiseAreas,
      status: input.status ?? recordStatus.ACTIVE,
      effectiveStartDate: input.effectiveStartDate,
      effectiveEndDate: input.effectiveEndDate,
      createdAt: now,
      updatedAt: now,
    });
  }
}

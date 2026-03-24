export const evidenceType = Object.freeze({
  DOCUMENT: 'document',
  METRIC: 'metric',
  NARRATIVE: 'narrative',
  DATASET: 'dataset',
  ASSESSMENT_ARTIFACT: 'assessment-artifact',
});

export const evidenceSourceType = Object.freeze({
  MANUAL: 'manual',
  UPLOAD: 'upload',
  INTEGRATION: 'integration',
});

export const evidenceStatus = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  SUPERSEDED: 'superseded',
  INCOMPLETE: 'incomplete',
  ARCHIVED: 'archived',
});

export const evidenceArtifactStatus = Object.freeze({
  AVAILABLE: 'available',
  QUARANTINED: 'quarantined',
  REMOVED: 'removed',
});

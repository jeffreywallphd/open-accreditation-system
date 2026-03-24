import assert from 'node:assert/strict';
import { ValidationError } from '../../src/modules/shared/kernel/errors.js';
import { EvidenceItem } from '../../src/modules/evidence-management/domain/entities/evidence-item.js';
import {
  evidenceSourceType,
  evidenceStatus,
  evidenceType,
} from '../../src/modules/evidence-management/domain/value-objects/evidence-classifications.js';

function createBaseEvidenceItemInput() {
  return {
    institutionId: 'inst_1',
    title: 'Program Review Narrative',
    evidenceType: evidenceType.NARRATIVE,
    sourceType: evidenceSourceType.MANUAL,
  };
}

export async function runTests(): Promise<void> {
  assert.throws(
    () =>
      EvidenceItem.create({
        ...createBaseEvidenceItemInput(),
        evidenceType: 'pdf',
      }),
    ValidationError,
    'evidenceType validation should reject unknown values',
  );

  assert.throws(
    () =>
      EvidenceItem.create({
        ...createBaseEvidenceItemInput(),
        sourceType: 'email-dropbox',
      }),
    ValidationError,
    'sourceType validation should reject unknown values',
  );

  assert.throws(
    () =>
      EvidenceItem.create({
        ...createBaseEvidenceItemInput(),
        storageBucket: 'bucket-should-not-live-on-item',
      }),
    ValidationError,
    'EvidenceItem must stay separate from artifact storage fields',
  );

  const evidenceItem = EvidenceItem.create({
    ...createBaseEvidenceItemInput(),
    status: evidenceStatus.DRAFT,
  });

  assert.throws(() => evidenceItem.activate(), ValidationError, 'draft evidence cannot activate without completeness/artifact');
  assert.equal(evidenceItem.usability.isUsable, false);

  evidenceItem.addArtifact({
    artifactName: 'Program Narrative.pdf',
    artifactType: 'primary',
    mimeType: 'application/pdf',
    storageBucket: 'evidence-bucket',
    storageKey: 'evidence/program-narrative.pdf',
  });
  evidenceItem.markComplete();
  evidenceItem.activate();

  assert.equal(evidenceItem.status, evidenceStatus.ACTIVE);
  assert.equal(evidenceItem.usability.isComplete, true);
  assert.equal(evidenceItem.usability.hasAvailableArtifact, true);
  assert.equal(evidenceItem.usability.isUsable, true);

  evidenceItem.markIncomplete();
  assert.equal(evidenceItem.status, evidenceStatus.INCOMPLETE);
  assert.equal(evidenceItem.usability.isUsable, false);
}

import assert from 'node:assert/strict';
import { ValidationError } from '../../src/modules/shared/kernel/errors.js';
import { EvidenceItem } from '../../src/modules/evidence-management/domain/entities/evidence-item.js';
import {
  evidenceArtifactStatus,
  evidenceSourceType,
  evidenceStatus,
  evidenceType,
} from '../../src/modules/evidence-management/domain/value-objects/evidence-classifications.js';

function createBaseEvidenceItemInput() {
  return {
    institutionId: 'inst_1',
    title: 'Program Review Narrative',
    description: 'Mapped narrative evidence for program review.',
    evidenceType: evidenceType.NARRATIVE,
    sourceType: evidenceSourceType.MANUAL,
    reportingPeriodId: 'period_2026',
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

  const evidenceItem = EvidenceItem.create(createBaseEvidenceItemInput());
  assert.equal(evidenceItem.status, evidenceStatus.DRAFT);
  assert.equal(evidenceItem.isComplete, false);
  assert.equal(evidenceItem.supersededByEvidenceItemId, null);

  assert.throws(
    () =>
      EvidenceItem.create({
        ...createBaseEvidenceItemInput(),
        status: evidenceStatus.ACTIVE,
      }),
    ValidationError,
    'new evidence cannot be created directly as active',
  );
  assert.throws(
    () =>
      EvidenceItem.create({
        ...createBaseEvidenceItemInput(),
        isComplete: true,
      }),
    ValidationError,
    'new evidence cannot be created directly as complete',
  );
  assert.throws(
    () =>
      EvidenceItem.create({
        ...createBaseEvidenceItemInput(),
        supersededByEvidenceItemId: 'ev_item_other',
      }),
    ValidationError,
    'new evidence cannot be created directly as superseded',
  );

  assert.throws(() => evidenceItem.activateForUse(), ValidationError, 'draft evidence cannot activate until complete');
  assert.equal(evidenceItem.usability.isUsable, false);

  evidenceItem.markIncomplete();
  assert.equal(evidenceItem.status, evidenceStatus.INCOMPLETE);
  assert.equal(evidenceItem.isComplete, false);

  evidenceItem.registerArtifactMetadata({
    artifactName: 'Program Narrative.pdf',
    artifactType: 'primary',
    mimeType: 'application/pdf',
    storageBucket: 'evidence-bucket',
    storageKey: 'evidence/program-narrative.pdf',
  });
  evidenceItem.markReadyForUse();
  assert.equal(evidenceItem.status, evidenceStatus.DRAFT);
  assert.equal(evidenceItem.isComplete, true);
  evidenceItem.activateForUse();

  assert.equal(evidenceItem.status, evidenceStatus.ACTIVE);
  assert.equal(evidenceItem.usability.isComplete, true);
  assert.equal(evidenceItem.usability.hasAvailableArtifact, true);
  assert.equal(evidenceItem.usability.requiresArtifactForActivation, false);
  assert.equal(evidenceItem.usability.isUsable, true);

  assert.throws(
    () =>
      evidenceItem.registerArtifactMetadata({
        artifactName: 'Program Narrative v2.pdf',
        artifactType: 'revision',
        mimeType: 'application/pdf',
        storageBucket: 'evidence-bucket',
        storageKey: 'evidence/program-narrative-v2.pdf',
      }),
    ValidationError,
    'active evidence must not accept new artifact registration',
  );

  evidenceItem.markIncomplete();
  assert.equal(evidenceItem.status, evidenceStatus.INCOMPLETE);
  assert.equal(evidenceItem.usability.isUsable, false);
  assert.equal(evidenceItem.usability.currentArtifactId !== null, true);

  const successorId = 'ev_item_successor';
  evidenceItem.supersedeWith(successorId);
  assert.equal(evidenceItem.status, evidenceStatus.SUPERSEDED);
  assert.equal(evidenceItem.supersededByEvidenceItemId, successorId);
  assert.equal(evidenceItem.usability.isUsable, false);

  assert.throws(
    () => evidenceItem.registerArtifactMetadata({
      artifactName: 'replacement.pdf',
      artifactType: 'primary',
      mimeType: 'application/pdf',
      storageBucket: 'evidence',
      storageKey: 'replacement.pdf',
    }),
    ValidationError,
    'superseded evidence cannot be modified',
  );
  assert.throws(
    () => evidenceItem.archive(),
    ValidationError,
    'superseded evidence is terminal and cannot transition to archived',
  );

  const draftCannotSupersede = EvidenceItem.create({
    ...createBaseEvidenceItemInput(),
    evidenceType: evidenceType.DOCUMENT,
    sourceType: evidenceSourceType.UPLOAD,
  });
  assert.throws(
    () => draftCannotSupersede.supersedeBy('ev_item_successor'),
    ValidationError,
    'draft evidence cannot be superseded directly',
  );
  draftCannotSupersede.markIncomplete();
  assert.throws(
    () => draftCannotSupersede.activateForUse(),
    ValidationError,
    'incomplete evidence cannot activate directly',
  );
  draftCannotSupersede.archive();
  assert.equal(draftCannotSupersede.status, evidenceStatus.ARCHIVED);
  assert.throws(
    () => draftCannotSupersede.markIncomplete(),
    ValidationError,
    'archived evidence is terminal and cannot be marked incomplete',
  );

  assert.throws(
    () =>
      new EvidenceItem({
        id: 'ev_item_mismatch',
        institutionId: 'inst_1',
        title: 'Mismatch',
        evidenceType: evidenceType.DOCUMENT,
        sourceType: evidenceSourceType.UPLOAD,
        status: evidenceStatus.DRAFT,
        isComplete: false,
        artifacts: [
          {
            id: 'ev_art_wrong',
            evidenceItemId: 'different_item',
            artifactName: 'mismatch.pdf',
            artifactType: 'primary',
            mimeType: 'application/pdf',
            storageBucket: 'evidence',
            storageKey: 'mismatch.pdf',
            status: 'available',
            uploadedAt: '2026-01-01T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ValidationError,
    'artifact ownership must remain inside the EvidenceItem aggregate',
  );

  const archived = EvidenceItem.create({
    ...createBaseEvidenceItemInput(),
    evidenceType: evidenceType.DOCUMENT,
    sourceType: evidenceSourceType.UPLOAD,
  });
  archived.archive();
  assert.throws(() => archived.markReadyForUse(), ValidationError, 'archived evidence cannot be modified');

  const missingActivationMetadata = EvidenceItem.create({
    institutionId: 'inst_1',
    title: 'Upload Missing Metadata',
    evidenceType: evidenceType.DOCUMENT,
    sourceType: evidenceSourceType.UPLOAD,
  });
  missingActivationMetadata.markReadyForUse();
  missingActivationMetadata.registerArtifactMetadata({
    artifactName: 'doc.pdf',
    artifactType: 'primary',
    mimeType: 'application/pdf',
    storageBucket: 'evidence',
    storageKey: 'doc.pdf',
  });
  assert.throws(
    () => missingActivationMetadata.activateForUse(),
    ValidationError,
    'active evidence must satisfy core metadata requirements',
  );

  const uploadRequiresArtifact = EvidenceItem.create({
    institutionId: 'inst_1',
    title: 'Upload Needs Artifact',
    description: 'Evidence imported by upload.',
    evidenceType: evidenceType.METRIC,
    sourceType: evidenceSourceType.UPLOAD,
    reviewCycleId: 'cycle_2026',
  });
  uploadRequiresArtifact.markReadyForUse();
  assert.equal(uploadRequiresArtifact.requiresArtifactForActivation, true);
  assert.throws(
    () => uploadRequiresArtifact.activateForUse(),
    ValidationError,
    'upload evidence cannot activate without an available artifact',
  );

  const manualNarrativeWithoutArtifact = EvidenceItem.create({
    institutionId: 'inst_1',
    title: 'Manual Narrative',
    description: 'Narrative entered directly into system metadata.',
    evidenceType: evidenceType.NARRATIVE,
    sourceType: evidenceSourceType.MANUAL,
    reviewCycleId: 'cycle_2026',
  });
  manualNarrativeWithoutArtifact.markReadyForUse();
  manualNarrativeWithoutArtifact.activateForUse();
  assert.equal(manualNarrativeWithoutArtifact.usability.requiresArtifactForActivation, false);
  assert.equal(manualNarrativeWithoutArtifact.usability.hasAvailableArtifact, false);
  assert.equal(manualNarrativeWithoutArtifact.usability.isUsable, true);

  const integrationMetricWithoutArtifact = EvidenceItem.create({
    institutionId: 'inst_1',
    title: 'Integration Metric',
    description: 'Metric synced from external source.',
    evidenceType: evidenceType.METRIC,
    sourceType: evidenceSourceType.INTEGRATION,
    reviewCycleId: 'cycle_2026',
  });
  integrationMetricWithoutArtifact.markReadyForUse();
  integrationMetricWithoutArtifact.activateForUse();
  assert.equal(integrationMetricWithoutArtifact.usability.requiresArtifactForActivation, false);
  assert.equal(integrationMetricWithoutArtifact.usability.isUsable, true);

  const manualDocumentWithoutArtifact = EvidenceItem.create({
    institutionId: 'inst_1',
    title: 'Manual Document',
    description: 'Document entered manually but still requires an artifact for activation.',
    evidenceType: evidenceType.DOCUMENT,
    sourceType: evidenceSourceType.MANUAL,
    reviewCycleId: 'cycle_2026',
  });
  manualDocumentWithoutArtifact.markReadyForUse();
  assert.throws(
    () => manualDocumentWithoutArtifact.activateForUse(),
    ValidationError,
    'document evidence requires an available artifact even when sourceType is manual',
  );

  const archivedCannotBeSuperseded = EvidenceItem.create({
    ...createBaseEvidenceItemInput(),
    evidenceType: evidenceType.DATASET,
    sourceType: evidenceSourceType.INTEGRATION,
  });
  archivedCannotBeSuperseded.archive();
  assert.throws(
    () => archivedCannotBeSuperseded.supersedeWith('ev_item_newer'),
    ValidationError,
    'archived evidence cannot be superseded',
  );

  const removedArtifactRejected = EvidenceItem.create({
    ...createBaseEvidenceItemInput(),
    sourceType: evidenceSourceType.UPLOAD,
    evidenceType: evidenceType.DOCUMENT,
  });
  assert.throws(
    () =>
      removedArtifactRejected.registerArtifactMetadata({
        artifactName: 'removed.pdf',
        artifactType: 'primary',
        mimeType: 'application/pdf',
        storageBucket: 'evidence',
        storageKey: 'removed.pdf',
        status: evidenceArtifactStatus.REMOVED,
      }),
    ValidationError,
    'removed artifacts cannot be registered as new artifact records',
  );
}

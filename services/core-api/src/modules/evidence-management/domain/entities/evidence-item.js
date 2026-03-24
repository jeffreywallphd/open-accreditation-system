import { assertRequired, assertString } from '../../../shared/kernel/assertions.js';
import { ValidationError } from '../../../shared/kernel/errors.js';
import { createId, nowIso } from '../../../shared/kernel/identity.js';
import {
  evidenceArtifactStatus,
  evidenceStatus,
  parseEvidenceArtifactStatus,
  parseEvidenceSourceType,
  parseEvidenceStatus,
  parseEvidenceType,
  requiresArtifactForActivation,
} from '../value-objects/evidence-classifications.js';

const EDITABLE_EVIDENCE_STATUSES = Object.freeze(new Set([evidenceStatus.DRAFT, evidenceStatus.INCOMPLETE]));
const EVIDENCE_STATUS_TRANSITIONS = Object.freeze({
  [evidenceStatus.DRAFT]: new Set([evidenceStatus.INCOMPLETE, evidenceStatus.ACTIVE, evidenceStatus.ARCHIVED]),
  [evidenceStatus.INCOMPLETE]: new Set([evidenceStatus.DRAFT, evidenceStatus.ARCHIVED]),
  [evidenceStatus.ACTIVE]: new Set([evidenceStatus.INCOMPLETE, evidenceStatus.SUPERSEDED, evidenceStatus.ARCHIVED]),
  [evidenceStatus.SUPERSEDED]: new Set(),
  [evidenceStatus.ARCHIVED]: new Set(),
});

export class EvidenceArtifact {
  constructor(props) {
    assertRequired(props.id, 'EvidenceArtifact.id');
    assertRequired(props.evidenceItemId, 'EvidenceArtifact.evidenceItemId');
    assertString(props.artifactName, 'EvidenceArtifact.artifactName');
    assertString(props.artifactType, 'EvidenceArtifact.artifactType');
    assertString(props.mimeType, 'EvidenceArtifact.mimeType');
    assertString(props.storageBucket, 'EvidenceArtifact.storageBucket');
    assertString(props.storageKey, 'EvidenceArtifact.storageKey');
    parseEvidenceArtifactStatus(props.status);

    if (props.byteSize !== undefined && props.byteSize !== null && (!Number.isInteger(props.byteSize) || props.byteSize < 0)) {
      throw new ValidationError('EvidenceArtifact.byteSize must be a non-negative integer');
    }

    this.id = props.id;
    this.evidenceItemId = props.evidenceItemId;
    this.artifactName = props.artifactName;
    this.artifactType = props.artifactType;
    this.mimeType = props.mimeType;
    this.fileExtension = props.fileExtension ?? null;
    this.byteSize = props.byteSize ?? null;
    this.storageBucket = props.storageBucket;
    this.storageKey = props.storageKey;
    this.sourceChecksum = props.sourceChecksum ?? null;
    this.status = props.status;
    this.uploadedAt = props.uploadedAt ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input) {
    if (input.status === evidenceArtifactStatus.REMOVED) {
      throw new ValidationError('EvidenceArtifact.status=removed cannot be registered as a new artifact');
    }

    const now = nowIso();
    return new EvidenceArtifact({
      id: input.id ?? createId('ev_art'),
      evidenceItemId: input.evidenceItemId,
      artifactName: input.artifactName,
      artifactType: input.artifactType ?? 'primary',
      mimeType: input.mimeType,
      fileExtension: input.fileExtension,
      byteSize: input.byteSize,
      storageBucket: input.storageBucket,
      storageKey: input.storageKey,
      sourceChecksum: input.sourceChecksum,
      status: input.status ?? evidenceArtifactStatus.AVAILABLE,
      uploadedAt: input.uploadedAt ?? now,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(input) {
    return new EvidenceArtifact(input);
  }
}

export class EvidenceItem {
  constructor(props) {
    assertRequired(props.id, 'EvidenceItem.id');
    assertRequired(props.institutionId, 'EvidenceItem.institutionId');
    assertString(props.title, 'EvidenceItem.title');
    parseEvidenceType(props.evidenceType);
    parseEvidenceSourceType(props.sourceType);
    parseEvidenceStatus(props.status);

    this.#assertNoArtifactStorageFields(props);

    this.id = props.id;
    this.institutionId = props.institutionId;
    this.title = props.title;
    this.description = props.description ?? null;
    this.evidenceType = props.evidenceType;
    this.sourceType = props.sourceType;
    this.status = props.status;
    this.isComplete = props.isComplete ?? false;
    this.supersededByEvidenceItemId = props.supersededByEvidenceItemId ?? null;
    this.reportingPeriodId = props.reportingPeriodId ?? null;
    this.reviewCycleId = props.reviewCycleId ?? null;
    this.artifacts = (props.artifacts ?? []).map((item) =>
      item instanceof EvidenceArtifact ? item : EvidenceArtifact.rehydrate(item),
    );
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this.#assertArtifactOwnershipIntegrity();
    this.#assertUsabilityIntegrity();
    this.#assertSupersessionIntegrity();
  }

  static create(input) {
    if (input.status !== undefined && input.status !== evidenceStatus.DRAFT) {
      throw new ValidationError('EvidenceItem.create only supports initial status=draft');
    }
    if (input.isComplete !== undefined && input.isComplete !== false) {
      throw new ValidationError('EvidenceItem.create only supports initial isComplete=false');
    }
    if (input.supersededByEvidenceItemId !== undefined && input.supersededByEvidenceItemId !== null) {
      throw new ValidationError('EvidenceItem.create cannot set supersededByEvidenceItemId');
    }

    const now = nowIso();
    return new EvidenceItem({
      id: input.id ?? createId('ev_item'),
      institutionId: input.institutionId,
      title: input.title,
      description: input.description,
      evidenceType: input.evidenceType,
      sourceType: input.sourceType,
      status: evidenceStatus.DRAFT,
      isComplete: false,
      supersededByEvidenceItemId: null,
      reportingPeriodId: input.reportingPeriodId,
      reviewCycleId: input.reviewCycleId,
      artifacts: input.artifacts ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(input) {
    return new EvidenceItem(input);
  }

  registerArtifactMetadata(input) {
    this.#assertArtifactMutationAllowed('register artifact metadata');

    const artifact = EvidenceArtifact.create({
      ...input,
      evidenceItemId: this.id,
    });
    this.artifacts.push(artifact);
    this.updatedAt = nowIso();
    return artifact;
  }

  addArtifact(input) {
    return this.registerArtifactMetadata(input);
  }

  markReadyForUse() {
    this.#assertCanMarkReady();
    this.isComplete = true;
    if (this.status === evidenceStatus.INCOMPLETE) {
      this.status = evidenceStatus.DRAFT;
    }
    this.updatedAt = nowIso();
    return this;
  }

  markComplete() {
    return this.markReadyForUse();
  }

  markIncomplete() {
    this.#assertCanMarkIncomplete();
    this.isComplete = false;
    this.status = evidenceStatus.INCOMPLETE;
    this.updatedAt = nowIso();
    return this;
  }

  activateForUse() {
    this.#assertTransition(evidenceStatus.ACTIVE, 'activate');
    this.#assertCanActivate();
    this.status = evidenceStatus.ACTIVE;
    this.updatedAt = nowIso();
    return this;
  }

  activate() {
    return this.activateForUse();
  }

  supersedeBy(successorEvidenceItemId) {
    assertRequired(successorEvidenceItemId, 'EvidenceItem.supersededByEvidenceItemId');
    if (successorEvidenceItemId === this.id) {
      throw new ValidationError('EvidenceItem cannot supersede itself');
    }
    this.#assertTransition(evidenceStatus.SUPERSEDED, 'supersede');
    this.status = evidenceStatus.SUPERSEDED;
    this.supersededByEvidenceItemId = successorEvidenceItemId;
    this.updatedAt = nowIso();
    return this;
  }

  supersedeWith(successorEvidenceItemId) {
    return this.supersedeBy(successorEvidenceItemId);
  }

  archive() {
    this.#assertTransition(evidenceStatus.ARCHIVED, 'archive');
    this.status = evidenceStatus.ARCHIVED;
    this.updatedAt = nowIso();
    return this;
  }

  get requiresArtifactForActivation() {
    return requiresArtifactForActivation({
      evidenceType: this.evidenceType,
      sourceType: this.sourceType,
    });
  }

  get usability() {
    const hasAvailableArtifact = this.currentArtifact !== null;
    const hasRequiredArtifact = this.requiresArtifactForActivation ? hasAvailableArtifact : true;
    const isUsable = this.status === evidenceStatus.ACTIVE && this.isComplete && hasRequiredArtifact;
    return {
      isComplete: this.isComplete,
      hasAvailableArtifact,
      requiresArtifactForActivation: this.requiresArtifactForActivation,
      currentArtifactId: this.currentArtifact?.id ?? null,
      isUsable,
    };
  }

  get currentArtifact() {
    for (let index = this.artifacts.length - 1; index >= 0; index -= 1) {
      if (this.artifacts[index].status === evidenceArtifactStatus.AVAILABLE) {
        return this.artifacts[index];
      }
    }
    return null;
  }

  #assertArtifactOwnershipIntegrity() {
    for (const artifact of this.artifacts) {
      if (artifact.evidenceItemId !== this.id) {
        throw new ValidationError('EvidenceArtifact.evidenceItemId must match owning EvidenceItem.id');
      }
    }
  }

  #assertUsabilityIntegrity() {
    if (this.status === evidenceStatus.INCOMPLETE && this.isComplete) {
      throw new ValidationError('EvidenceItem.status=incomplete requires isComplete=false');
    }

    if (this.status === evidenceStatus.ACTIVE) {
      this.#assertCanActivate();
    }
  }

  #assertSupersessionIntegrity() {
    if (this.status === evidenceStatus.SUPERSEDED && !this.supersededByEvidenceItemId) {
      throw new ValidationError('EvidenceItem.status=superseded requires supersededByEvidenceItemId');
    }
    if (this.status !== evidenceStatus.SUPERSEDED && this.supersededByEvidenceItemId) {
      throw new ValidationError('EvidenceItem.supersededByEvidenceItemId is only valid when status is superseded');
    }
  }

  #assertTransition(nextStatus, action) {
    const allowed = EVIDENCE_STATUS_TRANSITIONS[this.status] ?? new Set();
    if (!allowed.has(nextStatus)) {
      throw new ValidationError(
        `EvidenceItem cannot ${action} from status=${this.status} to status=${nextStatus}`,
      );
    }
  }

  #assertCanMarkReady() {
    if (this.status !== evidenceStatus.DRAFT && this.status !== evidenceStatus.INCOMPLETE) {
      throw new ValidationError(`EvidenceItem cannot mark complete while status is ${this.status}`);
    }
  }

  #assertCanMarkIncomplete() {
    if (this.status !== evidenceStatus.DRAFT && this.status !== evidenceStatus.ACTIVE && this.status !== evidenceStatus.INCOMPLETE) {
      throw new ValidationError(`EvidenceItem cannot mark incomplete while status is ${this.status}`);
    }
  }

  #assertNoArtifactStorageFields(props) {
    if (
      props.storageBucket !== undefined ||
      props.storageKey !== undefined ||
      props.mimeType !== undefined ||
      props.byteSize !== undefined
    ) {
      throw new ValidationError(
        'EvidenceItem must not embed artifact storage metadata; use EvidenceArtifact child records instead',
      );
    }
  }

  #assertArtifactMutationAllowed(action) {
    if (!EDITABLE_EVIDENCE_STATUSES.has(this.status)) {
      throw new ValidationError(`EvidenceItem cannot ${action} while status is ${this.status}`);
    }
  }

  #assertActivationMetadata() {
    if (!this.description || typeof this.description !== 'string' || this.description.trim() === '') {
      throw new ValidationError('EvidenceItem.status=active requires non-empty description');
    }
    if (!this.reportingPeriodId && !this.reviewCycleId) {
      throw new ValidationError('EvidenceItem.status=active requires reportingPeriodId or reviewCycleId');
    }
  }

  #assertCanActivate() {
    this.#assertActivationMetadata();

    if (!this.isComplete) {
      throw new ValidationError('EvidenceItem.status=active requires isComplete=true');
    }

    if (this.requiresArtifactForActivation && !this.usability.hasAvailableArtifact) {
      throw new ValidationError(
        'EvidenceItem.status=active requires at least one available EvidenceArtifact for the current evidenceType/sourceType',
      );
    }
  }
}

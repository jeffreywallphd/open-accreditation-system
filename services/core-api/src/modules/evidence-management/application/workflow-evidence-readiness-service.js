import { WorkflowEvidenceReadinessContract } from './contracts/workflow-evidence-readiness-contract.js';

function normalizeIdList(values = []) {
  const normalized = [...new Set((values ?? []).filter(Boolean).map((value) => `${value}`.trim()).filter(Boolean)];
  normalized.sort((left, right) => left.localeCompare(right));
  return normalized;
}

export class WorkflowEvidenceReadinessService extends WorkflowEvidenceReadinessContract {
  constructor(deps) {
    super();
    this.evidenceManagement = deps.evidenceManagement;
  }

  async evaluateWorkflowEvidenceReadiness(input) {
    const evidenceItemIds = normalizeIdList(input.evidenceItemIds ?? []);
    const missingEvidenceItemIds = [];
    const outOfInstitutionScopeEvidenceItemIds = [];
    const incompleteEvidenceItemIds = [];
    const inactiveEvidenceItemIds = [];
    const unusableEvidenceItemIds = [];
    let usableEvidenceItemCount = 0;

    for (const evidenceItemId of evidenceItemIds) {
      const evidenceItem = await this.evidenceManagement.getEvidenceItemById(evidenceItemId);
      if (!evidenceItem) {
        missingEvidenceItemIds.push(evidenceItemId);
        continue;
      }
      if (evidenceItem.institutionId !== input.institutionId) {
        outOfInstitutionScopeEvidenceItemIds.push(evidenceItemId);
        continue;
      }
      if (evidenceItem.isComplete !== true) {
        incompleteEvidenceItemIds.push(evidenceItemId);
      }
      if (evidenceItem.status !== 'active') {
        inactiveEvidenceItemIds.push(evidenceItemId);
      }
      if (evidenceItem.usability?.isUsable !== true) {
        unusableEvidenceItemIds.push(evidenceItemId);
      } else {
        usableEvidenceItemCount += 1;
      }
    }

    const requiredUsableEvidenceCount = Math.max(
      0,
      Number.isInteger(input.minimumUsableEvidenceCount)
        ? input.minimumUsableEvidenceCount
        : evidenceItemIds.length,
    );
    const referencedEvidenceRequirementSatisfied =
      missingEvidenceItemIds.length === 0 &&
      outOfInstitutionScopeEvidenceItemIds.length === 0 &&
      incompleteEvidenceItemIds.length === 0 &&
      inactiveEvidenceItemIds.length === 0 &&
      unusableEvidenceItemIds.length === 0 &&
      usableEvidenceItemCount >= requiredUsableEvidenceCount;

    let collectionRequirementSatisfied = true;
    let collectionContextStatus = 'not-applicable';
    let collectionUsableEvidenceCount = 0;
    if (input.evidenceCollectionId) {
      if (!input.reviewCycleId) {
        collectionRequirementSatisfied = false;
        collectionContextStatus = 'missing-review-cycle';
      } else {
        const usableCycleEvidence = await this.evidenceManagement.listEvidenceItems({
          institutionId: input.institutionId,
          reviewCycleId: input.reviewCycleId,
          versionState: 'current',
          status: 'active',
          isUsable: true,
        });
        collectionUsableEvidenceCount = usableCycleEvidence.length;
        collectionRequirementSatisfied = collectionUsableEvidenceCount > 0;
        collectionContextStatus = collectionRequirementSatisfied ? 'satisfied' : 'empty';
      }
    }

    return {
      requiredCount: evidenceItemIds.length,
      foundCount: evidenceItemIds.length - missingEvidenceItemIds.length,
      requiredUsableEvidenceCount,
      usableEvidenceItemCount,
      missingEvidenceItemIds,
      outOfInstitutionScopeEvidenceItemIds,
      incompleteEvidenceItemIds,
      inactiveEvidenceItemIds,
      unusableEvidenceItemIds,
      evidenceCollectionId: input.evidenceCollectionId ?? null,
      collectionContextStatus,
      collectionUsableEvidenceCount,
      collectionRequirementSatisfied,
      referencedEvidenceRequirementSatisfied,
      isSufficient: referencedEvidenceRequirementSatisfied && collectionRequirementSatisfied,
    };
  }
}


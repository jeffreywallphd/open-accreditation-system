import { AccreditationFrameworksService } from './application/accreditation-frameworks-service.js';
import { createAccreditationFrameworksApi } from './api/accreditation-frameworks-api.js';
import {
  InMemoryAccreditationCycleRepository,
  InMemoryAccreditationFrameworkRepository,
  InMemoryAccreditorRepository,
  InMemoryFrameworkVersionRepository,
  InMemoryReviewerProfileRepository,
  InMemoryReviewTeamRepository,
  InMemoryScopeReferenceAdapter,
} from './infrastructure/persistence/in-memory-accreditation-frameworks-repositories.js';

export function createAccreditationFrameworksModule(dependencies = {}) {
  const repositories = {
    accreditors: dependencies.accreditors ?? new InMemoryAccreditorRepository(),
    frameworks: dependencies.frameworks ?? new InMemoryAccreditationFrameworkRepository(),
    frameworkVersions: dependencies.frameworkVersions ?? new InMemoryFrameworkVersionRepository(),
    cycles: dependencies.cycles ?? new InMemoryAccreditationCycleRepository(),
    reviewerProfiles: dependencies.reviewerProfiles ?? new InMemoryReviewerProfileRepository(),
    reviewTeams: dependencies.reviewTeams ?? new InMemoryReviewTeamRepository(),
  };

  const scopeReferences = dependencies.scopeReferences ?? new InMemoryScopeReferenceAdapter(dependencies.scopeReferenceSeed);

  const service = new AccreditationFrameworksService({
    ...repositories,
    scopeReferences,
  });
  const api = createAccreditationFrameworksApi(service);

  return {
    repositories,
    service,
    api,
  };
}

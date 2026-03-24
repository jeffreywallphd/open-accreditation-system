import { Module } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../infrastructure/persistence/persistence.tokens.js';
import { OrganizationRegistryModule, ORG_SERVICE } from '../organization-registry/organization-registry.module.js';
import { CurriculumMappingModule, CURR_SERVICE } from '../curriculum-mapping/curriculum-mapping.module.js';
import { AccreditationFrameworksService } from './application/accreditation-frameworks-service.js';
import { OrganizationRegistryScopeReferenceAdapter } from './infrastructure/adapters/organization-registry-scope-reference-adapter.js';
import {
  SqliteAccreditationFrameworkRepository,
  SqliteAccreditorRepository,
  SqliteFrameworkVersionRepository,
} from './infrastructure/persistence/sqlite-accreditor-framework-repositories.js';
import { SqliteAccreditationCycleRepository } from './infrastructure/persistence/sqlite-cycle-repositories.js';
import {
  SqliteReviewerProfileRepository,
  SqliteReviewTeamRepository,
} from './infrastructure/persistence/sqlite-reviewer-repositories.js';
import { AccreditationFrameworksController } from './api/accreditation-frameworks.controller.js';

export const AFR_REPOSITORY_TOKENS = {
  accreditors: Symbol('AFR_ACCREDITOR_REPOSITORY'),
  frameworks: Symbol('AFR_FRAMEWORK_REPOSITORY'),
  frameworkVersions: Symbol('AFR_FRAMEWORK_VERSION_REPOSITORY'),
  cycles: Symbol('AFR_CYCLE_REPOSITORY'),
  reviewerProfiles: Symbol('AFR_REVIEWER_PROFILE_REPOSITORY'),
  reviewTeams: Symbol('AFR_REVIEW_TEAM_REPOSITORY'),
};

export const AFR_SCOPE_REFERENCES = Symbol('AFR_SCOPE_REFERENCES');
export const AFR_SERVICE = Symbol('AFR_SERVICE');

@Module({
  imports: [OrganizationRegistryModule, CurriculumMappingModule],
  controllers: [AccreditationFrameworksController],
  providers: [
    {
      provide: AFR_REPOSITORY_TOKENS.accreditors,
      inject: [DATABASE_CONNECTION],
      useFactory: (database) => new SqliteAccreditorRepository(database),
    },
    {
      provide: AFR_REPOSITORY_TOKENS.frameworks,
      inject: [DATABASE_CONNECTION],
      useFactory: (database) => new SqliteAccreditationFrameworkRepository(database),
    },
    {
      provide: AFR_REPOSITORY_TOKENS.frameworkVersions,
      inject: [DATABASE_CONNECTION],
      useFactory: (database) => new SqliteFrameworkVersionRepository(database),
    },
    {
      provide: AFR_REPOSITORY_TOKENS.cycles,
      inject: [DATABASE_CONNECTION],
      useFactory: (database) => new SqliteAccreditationCycleRepository(database),
    },
    {
      provide: AFR_REPOSITORY_TOKENS.reviewerProfiles,
      inject: [DATABASE_CONNECTION],
      useFactory: (database) => new SqliteReviewerProfileRepository(database),
    },
    {
      provide: AFR_REPOSITORY_TOKENS.reviewTeams,
      inject: [DATABASE_CONNECTION],
      useFactory: (database) => new SqliteReviewTeamRepository(database),
    },
    {
      provide: AFR_SCOPE_REFERENCES,
      inject: [ORG_SERVICE, CURR_SERVICE],
      useFactory: (organizationRegistryService, curriculumMappingService) =>
        new OrganizationRegistryScopeReferenceAdapter({
          organizationRegistryService,
          curriculumMappingService,
        }),
    },
    {
      provide: AFR_SERVICE,
      inject: [
        AFR_REPOSITORY_TOKENS.accreditors,
        AFR_REPOSITORY_TOKENS.frameworks,
        AFR_REPOSITORY_TOKENS.frameworkVersions,
        AFR_REPOSITORY_TOKENS.cycles,
        AFR_REPOSITORY_TOKENS.reviewerProfiles,
        AFR_REPOSITORY_TOKENS.reviewTeams,
        AFR_SCOPE_REFERENCES,
      ],
      useFactory: (accreditors, frameworks, frameworkVersions, cycles, reviewerProfiles, reviewTeams, scopeReferences) =>
        new AccreditationFrameworksService({
          accreditors,
          frameworks,
          frameworkVersions,
          cycles,
          reviewerProfiles,
          reviewTeams,
          scopeReferences,
        }),
    },
  ],
  exports: [AFR_SERVICE],
})
export class AccreditationFrameworksModule {}

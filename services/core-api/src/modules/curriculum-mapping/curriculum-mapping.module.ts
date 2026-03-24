import { Module } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../infrastructure/persistence/persistence.tokens.js';
import { ORG_REPOSITORY_TOKENS, OrganizationRegistryModule } from '../organization-registry/organization-registry.module.js';
import { CurriculumMappingService } from './application/curriculum-mapping-service.js';
import { SqliteProgramRepository } from './infrastructure/persistence/sqlite-curriculum-mapping-repositories.js';
import { CurriculumMappingController } from './api/curriculum-mapping.controller.js';

export const CURR_REPOSITORY_TOKENS = {
  programs: Symbol('CURR_PROGRAM_REPOSITORY'),
};

export const CURR_SERVICE = Symbol('CURR_SERVICE');

@Module({
  imports: [OrganizationRegistryModule],
  controllers: [CurriculumMappingController],
  providers: [
    {
      provide: CURR_REPOSITORY_TOKENS.programs,
      inject: [DATABASE_CONNECTION],
      useFactory: (database) => new SqliteProgramRepository(database),
    },
    {
      provide: CURR_SERVICE,
      inject: [CURR_REPOSITORY_TOKENS.programs, ORG_REPOSITORY_TOKENS.institutions],
      useFactory: (programs, institutions) =>
        new CurriculumMappingService({
          programs,
          institutions,
        }),
    },
  ],
  exports: [CURR_SERVICE],
})
export class CurriculumMappingModule {}

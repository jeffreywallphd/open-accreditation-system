import { ScopeReferencePort } from '../../application/scope-reference-port.js';
import { ValidationError } from '../../../shared/kernel/errors.js';

export class OrganizationRegistryScopeReferenceAdapter extends ScopeReferencePort {
  constructor({ organizationRegistryService, curriculumMappingService }) {
    super();
    this.organizationRegistryService = organizationRegistryService;
    this.curriculumMappingService = curriculumMappingService;
  }

  async ensurePersonExists(personId) {
    const person = await this.organizationRegistryService.getPersonById(personId);
    if (!person) {
      throw new ValidationError(`Person not found: ${personId}`);
    }
  }

  async ensurePersonInInstitution(personId, institutionId) {
    const person = await this.organizationRegistryService.getPersonById(personId);
    if (!person) {
      throw new ValidationError(`Person not found: ${personId}`);
    }
    if (person.institutionId !== institutionId) {
      throw new ValidationError('Person.institutionId must match target institution');
    }
  }

  async ensureInstitutionExists(institutionId) {
    const institution = await this.organizationRegistryService.getInstitutionById(institutionId);
    if (!institution) {
      throw new ValidationError(`Institution not found: ${institutionId}`);
    }
  }

  async ensureProgramsExistForInstitution(programIds, institutionId) {
    if (programIds.length === 0) {
      return;
    }

    if (!this.curriculumMappingService) {
      throw new ValidationError('Program reference validation is unavailable; curriculum-mapping adapter not configured');
    }

    for (const id of programIds) {
      const program = await this.curriculumMappingService.getProgramById(id);
      if (!program) {
        throw new ValidationError(`Program not found: ${id}`);
      }
      if (program.institutionId !== institutionId) {
        throw new ValidationError('Program.institutionId must match AccreditationCycle.institutionId');
      }
    }
  }

  async ensureOrganizationUnitsExistForInstitution(organizationUnitIds, institutionId) {
    for (const id of organizationUnitIds) {
      const unit = await this.organizationRegistryService.getOrganizationUnitById(id);
      if (!unit) {
        throw new ValidationError(`OrganizationUnit not found: ${id}`);
      }
      if (unit.institutionId !== institutionId) {
        throw new ValidationError('OrganizationUnit.institutionId must match AccreditationCycle.institutionId');
      }
    }
  }
}

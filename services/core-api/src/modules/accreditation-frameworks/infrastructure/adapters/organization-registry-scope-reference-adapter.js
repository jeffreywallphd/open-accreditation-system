import { ScopeReferencePort } from '../../application/scope-reference-port.js';
import { ValidationError } from '../../../shared/kernel/errors.js';

export class OrganizationRegistryScopeReferenceAdapter extends ScopeReferencePort {
  constructor({ institutions, people, organizationUnits, programs }) {
    super();
    this.institutions = institutions;
    this.people = people;
    this.organizationUnits = organizationUnits;
    this.programs = programs ?? null;
  }

  async ensurePersonExists(personId) {
    const person = await this.people.getById(personId);
    if (!person) {
      throw new ValidationError(`Person not found: ${personId}`);
    }
  }

  async ensureInstitutionExists(institutionId) {
    const institution = await this.institutions.getById(institutionId);
    if (!institution) {
      throw new ValidationError(`Institution not found: ${institutionId}`);
    }
  }

  async ensureProgramsExist(programIds) {
    if (programIds.length === 0) {
      return;
    }

    if (!this.programs) {
      throw new ValidationError('Program reference validation is unavailable; curriculum-mapping adapter not configured');
    }

    for (const id of programIds) {
      const program = await this.programs.getById(id);
      if (!program) {
        throw new ValidationError(`Program not found: ${id}`);
      }
    }
  }

  async ensureOrganizationUnitsExist(organizationUnitIds) {
    for (const id of organizationUnitIds) {
      const unit = await this.organizationUnits.getById(id);
      if (!unit) {
        throw new ValidationError(`OrganizationUnit not found: ${id}`);
      }
    }
  }
}

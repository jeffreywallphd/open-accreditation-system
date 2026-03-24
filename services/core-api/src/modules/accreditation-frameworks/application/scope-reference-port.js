export class ScopeReferencePort {
  async ensurePersonExists(_personId) {
    throw new Error('ScopeReferencePort.ensurePersonExists not implemented');
  }

  async ensurePersonInInstitution(_personId, _institutionId) {
    throw new Error('ScopeReferencePort.ensurePersonInInstitution not implemented');
  }

  async ensureInstitutionExists(_institutionId) {
    throw new Error('ScopeReferencePort.ensureInstitutionExists not implemented');
  }

  async ensureProgramsExistForInstitution(_programIds, _institutionId) {
    throw new Error('ScopeReferencePort.ensureProgramsExistForInstitution not implemented');
  }

  async ensureOrganizationUnitsExistForInstitution(_organizationUnitIds, _institutionId) {
    throw new Error('ScopeReferencePort.ensureOrganizationUnitsExistForInstitution not implemented');
  }
}

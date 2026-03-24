import {
  AccreditationCycleRepository,
  AccreditationFrameworkRepository,
  AccreditorRepository,
  FrameworkVersionRepository,
  ReviewerProfileRepository,
  ReviewTeamRepository,
} from '../../domain/repositories/repositories.js';
import { ScopeReferencePort } from '../../application/scope-reference-port.js';
import { ValidationError } from '../../../shared/kernel/errors.js';
import { Accreditor } from '../../domain/entities/accreditor.js';
import { AccreditationFramework } from '../../domain/entities/accreditation-framework.js';
import { FrameworkVersion } from '../../domain/entities/framework-version.js';
import { AccreditationCycle } from '../../domain/entities/accreditation-cycle.js';
import { ReviewerProfile } from '../../domain/entities/reviewer-profile.js';
import { ReviewTeam } from '../../domain/entities/review-team.js';

function matchesFilter(item, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (value === undefined || value === null) {
      return true;
    }
    return item[key] === value;
  });
}

export class InMemoryAccreditorRepository extends AccreditorRepository {
  constructor() {
    super();
    this.items = new Map();
  }

  async save(accreditor) {
    const persisted = structuredClone(accreditor);
    this.items.set(accreditor.id, persisted);
    return new Accreditor(structuredClone(persisted));
  }

  async getById(id) {
    const item = this.items.get(id);
    return item ? new Accreditor(structuredClone(item)) : null;
  }

  async findByFilter(filter = {}) {
    return [...this.items.values()]
      .filter((item) => matchesFilter(item, filter))
      .map((item) => new Accreditor(structuredClone(item)));
  }
}

export class InMemoryAccreditationFrameworkRepository extends AccreditationFrameworkRepository {
  constructor() {
    super();
    this.items = new Map();
  }

  async save(framework) {
    const persisted = structuredClone(framework);
    this.items.set(framework.id, persisted);
    return new AccreditationFramework(structuredClone(persisted));
  }

  async getById(id) {
    const item = this.items.get(id);
    return item ? new AccreditationFramework(structuredClone(item)) : null;
  }

  async findByFilter(filter = {}) {
    return [...this.items.values()]
      .filter((item) => matchesFilter(item, filter))
      .map((item) => new AccreditationFramework(structuredClone(item)));
  }
}

export class InMemoryFrameworkVersionRepository extends FrameworkVersionRepository {
  constructor() {
    super();
    this.items = new Map();
  }

  async save(frameworkVersion) {
    const persisted = structuredClone(frameworkVersion);
    this.items.set(frameworkVersion.id, persisted);
    return new FrameworkVersion(structuredClone(persisted));
  }

  async getById(id) {
    const item = this.items.get(id);
    return item ? new FrameworkVersion(structuredClone(item)) : null;
  }

  async getByFrameworkIdAndVersionTag(frameworkId, versionTag) {
    const item =
      [...this.items.values()].find((stored) => stored.frameworkId === frameworkId && stored.versionTag === versionTag) ??
      null;
    return item ? new FrameworkVersion(structuredClone(item)) : null;
  }

  async findByFilter(filter = {}) {
    return [...this.items.values()]
      .filter((item) => matchesFilter(item, filter))
      .map((item) => new FrameworkVersion(structuredClone(item)));
  }
}

export class InMemoryAccreditationCycleRepository extends AccreditationCycleRepository {
  constructor() {
    super();
    this.items = new Map();
  }

  async save(cycle) {
    const persisted = structuredClone(cycle);
    this.items.set(cycle.id, persisted);
    return new AccreditationCycle(structuredClone(persisted));
  }

  async getById(id) {
    const item = this.items.get(id);
    return item ? new AccreditationCycle(structuredClone(item)) : null;
  }

  async findByFilter(filter = {}) {
    return [...this.items.values()]
      .filter((item) => matchesFilter(item, filter))
      .map((item) => new AccreditationCycle(structuredClone(item)));
  }
}

export class InMemoryReviewerProfileRepository extends ReviewerProfileRepository {
  constructor() {
    super();
    this.items = new Map();
  }

  async save(profile) {
    const persisted = structuredClone(profile);
    this.items.set(profile.id, persisted);
    return new ReviewerProfile(structuredClone(persisted));
  }

  async getById(id) {
    const item = this.items.get(id);
    return item ? new ReviewerProfile(structuredClone(item)) : null;
  }

  async getByPersonId(personId) {
    const item = [...this.items.values()].find((stored) => stored.personId === personId) ?? null;
    return item ? new ReviewerProfile(structuredClone(item)) : null;
  }

  async findByFilter(filter = {}) {
    return [...this.items.values()]
      .filter((item) => matchesFilter(item, filter))
      .map((item) => new ReviewerProfile(structuredClone(item)));
  }
}

export class InMemoryReviewTeamRepository extends ReviewTeamRepository {
  constructor() {
    super();
    this.items = new Map();
  }

  async save(team) {
    const persisted = structuredClone(team);
    this.items.set(team.id, persisted);
    return new ReviewTeam(structuredClone(persisted));
  }

  async getById(id) {
    const item = this.items.get(id);
    return item ? new ReviewTeam(structuredClone(item)) : null;
  }

  async findByFilter(filter = {}) {
    return [...this.items.values()]
      .filter((item) => matchesFilter(item, filter))
      .map((item) => new ReviewTeam(structuredClone(item)));
  }
}

export class InMemoryScopeReferenceAdapter extends ScopeReferencePort {
  constructor(input = {}) {
    super();
    this.personIds = new Set(input.personIds ?? []);
    this.institutionIds = new Set(input.institutionIds ?? []);
    this.programIds = new Set(input.programIds ?? []);
    this.organizationUnitIds = new Set(input.organizationUnitIds ?? []);
  }

  async ensurePersonExists(personId) {
    if (!this.personIds.has(personId)) {
      throw new ValidationError(`Person not found: ${personId}`);
    }
  }

  async ensureInstitutionExists(institutionId) {
    if (!this.institutionIds.has(institutionId)) {
      throw new ValidationError(`Institution not found: ${institutionId}`);
    }
  }

  async ensureProgramsExist(programIds) {
    for (const id of programIds) {
      if (!this.programIds.has(id)) {
        throw new ValidationError(`Program not found: ${id}`);
      }
    }
  }

  async ensureOrganizationUnitsExist(organizationUnitIds) {
    for (const id of organizationUnitIds) {
      if (!this.organizationUnitIds.has(id)) {
        throw new ValidationError(`OrganizationUnit not found: ${id}`);
      }
    }
  }
}

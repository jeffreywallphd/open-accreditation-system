import {
  AccreditationFrameworkRepository,
  AccreditorRepository,
  FrameworkVersionRepository,
} from '../../domain/repositories/repositories.js';
import { AccreditationFramework } from '../../domain/entities/accreditation-framework.js';
import { Accreditor } from '../../domain/entities/accreditor.js';
import { FrameworkVersion } from '../../domain/entities/framework-version.js';

function filterClause(filter = {}, keyMap = {}) {
  const where = [];
  const params = {};
  for (const [filterKey, column] of Object.entries(keyMap)) {
    const value = filter[filterKey];
    if (value === undefined || value === null) {
      continue;
    }
    where.push(`${column} = @${filterKey}`);
    params[filterKey] = value;
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

export class SqliteAccreditorRepository extends AccreditorRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  async save(accreditor) {
    this.database.run(
      `INSERT INTO accreditation_frameworks_accreditors
       (id, name, code, description, status, created_at, updated_at)
       VALUES (@id, @name, @code, @description, @status, @createdAt, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, code=excluded.code, description=excluded.description, status=excluded.status, updated_at=excluded.updated_at`,
      {
        id: accreditor.id,
        name: accreditor.name,
        code: accreditor.code,
        description: accreditor.description,
        status: accreditor.status,
        createdAt: accreditor.createdAt,
        updatedAt: accreditor.updatedAt,
      },
    );
    return accreditor;
  }

  async getById(id) {
    const row = this.database.get('SELECT * FROM accreditation_frameworks_accreditors WHERE id = @id', { id });
    return row
      ? new Accreditor({
          id: row.id,
          name: row.name,
          code: row.code,
          description: row.description,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
      : null;
  }

  async findByFilter(filter = {}) {
    const { sql, params } = filterClause(filter, { id: 'id', name: 'name', code: 'code', status: 'status' });
    const rows = this.database.all(
      `SELECT * FROM accreditation_frameworks_accreditors ${sql} ORDER BY created_at ASC`,
      params,
    );
    return rows.map(
      (row) =>
        new Accreditor({
          id: row.id,
          name: row.name,
          code: row.code,
          description: row.description,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }),
    );
  }
}

export class SqliteAccreditationFrameworkRepository extends AccreditationFrameworkRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  async save(framework) {
    this.database.run(
      `INSERT INTO accreditation_frameworks_frameworks
       (id, accreditor_id, name, code, description, status, created_at, updated_at)
       VALUES (@id, @accreditorId, @name, @code, @description, @status, @createdAt, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET
         accreditor_id=excluded.accreditor_id, name=excluded.name, code=excluded.code,
         description=excluded.description, status=excluded.status, updated_at=excluded.updated_at`,
      {
        id: framework.id,
        accreditorId: framework.accreditorId,
        name: framework.name,
        code: framework.code,
        description: framework.description,
        status: framework.status,
        createdAt: framework.createdAt,
        updatedAt: framework.updatedAt,
      },
    );
    return framework;
  }

  async getById(id) {
    const row = this.database.get('SELECT * FROM accreditation_frameworks_frameworks WHERE id = @id', { id });
    return row
      ? new AccreditationFramework({
          id: row.id,
          accreditorId: row.accreditor_id,
          name: row.name,
          code: row.code,
          description: row.description,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
      : null;
  }

  async findByFilter(filter = {}) {
    const { sql, params } = filterClause(filter, {
      id: 'id',
      accreditorId: 'accreditor_id',
      name: 'name',
      code: 'code',
      status: 'status',
    });
    const rows = this.database.all(
      `SELECT * FROM accreditation_frameworks_frameworks ${sql} ORDER BY created_at ASC`,
      params,
    );
    return rows.map(
      (row) =>
        new AccreditationFramework({
          id: row.id,
          accreditorId: row.accreditor_id,
          name: row.name,
          code: row.code,
          description: row.description,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }),
    );
  }
}

function toBool(value) {
  return value === 1;
}

export class SqliteFrameworkVersionRepository extends FrameworkVersionRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  async save(frameworkVersion) {
    this.database.transaction(() => {
      this.database.run(
        `INSERT INTO accreditation_frameworks_framework_versions
         (id, framework_id, version_tag, status, published_at, effective_start_date, effective_end_date, created_at, updated_at)
         VALUES (@id, @frameworkId, @versionTag, @status, @publishedAt, @effectiveStartDate, @effectiveEndDate, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           framework_id=excluded.framework_id, version_tag=excluded.version_tag, status=excluded.status, published_at=excluded.published_at,
           effective_start_date=excluded.effective_start_date, effective_end_date=excluded.effective_end_date, updated_at=excluded.updated_at`,
        {
          id: frameworkVersion.id,
          frameworkId: frameworkVersion.frameworkId,
          versionTag: frameworkVersion.versionTag,
          status: frameworkVersion.status,
          publishedAt: frameworkVersion.publishedAt,
          effectiveStartDate: frameworkVersion.effectiveStartDate,
          effectiveEndDate: frameworkVersion.effectiveEndDate,
          createdAt: frameworkVersion.createdAt,
          updatedAt: frameworkVersion.updatedAt,
        },
      );

      for (const standard of frameworkVersion.standards) {
        this.database.run(
          `INSERT INTO accreditation_frameworks_standards
           (id, framework_version_id, code, title, description, sequence, created_at, updated_at)
           VALUES (@id, @frameworkVersionId, @code, @title, @description, @sequence, @createdAt, @updatedAt)
           ON CONFLICT(id) DO UPDATE SET
             framework_version_id=excluded.framework_version_id, code=excluded.code, title=excluded.title,
             description=excluded.description, sequence=excluded.sequence, updated_at=excluded.updated_at`,
          {
            id: standard.id,
            frameworkVersionId: standard.frameworkVersionId,
            code: standard.code,
            title: standard.title,
            description: standard.description,
            sequence: standard.sequence,
            createdAt: standard.createdAt,
            updatedAt: standard.updatedAt,
          },
        );
      }

      for (const criterion of frameworkVersion.criteria) {
        this.database.run(
          `INSERT INTO accreditation_frameworks_criteria
           (id, framework_version_id, standard_id, code, title, statement, sequence, created_at, updated_at)
           VALUES (@id, @frameworkVersionId, @standardId, @code, @title, @statement, @sequence, @createdAt, @updatedAt)
           ON CONFLICT(id) DO UPDATE SET
             framework_version_id=excluded.framework_version_id, standard_id=excluded.standard_id, code=excluded.code,
             title=excluded.title, statement=excluded.statement, sequence=excluded.sequence, updated_at=excluded.updated_at`,
          {
            id: criterion.id,
            frameworkVersionId: criterion.frameworkVersionId,
            standardId: criterion.standardId,
            code: criterion.code,
            title: criterion.title,
            statement: criterion.statement,
            sequence: criterion.sequence,
            createdAt: criterion.createdAt,
            updatedAt: criterion.updatedAt,
          },
        );
      }

      for (const element of frameworkVersion.criterionElements) {
        this.database.run(
          `INSERT INTO accreditation_frameworks_criterion_elements
           (id, framework_version_id, criterion_id, code, title, statement, element_type, required_flag, sequence,
            effective_start_date, effective_end_date, supersedes_element_id, created_at, updated_at)
           VALUES (@id, @frameworkVersionId, @criterionId, @code, @title, @statement, @elementType, @requiredFlag, @sequence,
            @effectiveStartDate, @effectiveEndDate, @supersedesElementId, @createdAt, @updatedAt)
           ON CONFLICT(id) DO UPDATE SET
             framework_version_id=excluded.framework_version_id, criterion_id=excluded.criterion_id, code=excluded.code, title=excluded.title,
             statement=excluded.statement, element_type=excluded.element_type, required_flag=excluded.required_flag,
             sequence=excluded.sequence, effective_start_date=excluded.effective_start_date, effective_end_date=excluded.effective_end_date,
             supersedes_element_id=excluded.supersedes_element_id, updated_at=excluded.updated_at`,
          {
            id: element.id,
            frameworkVersionId: element.frameworkVersionId,
            criterionId: element.criterionId,
            code: element.code,
            title: element.title,
            statement: element.statement,
            elementType: element.elementType,
            requiredFlag: element.requiredFlag ? 1 : 0,
            sequence: element.sequence,
            effectiveStartDate: element.effectiveStartDate,
            effectiveEndDate: element.effectiveEndDate,
            supersedesElementId: element.supersedesElementId,
            createdAt: element.createdAt,
            updatedAt: element.updatedAt,
          },
        );
      }

      for (const requirement of frameworkVersion.evidenceRequirements) {
        this.database.run(
          `INSERT INTO accreditation_frameworks_evidence_requirements
           (id, framework_version_id, criterion_id, criterion_element_id, requirement_code, title, description,
            requirement_type, cardinality_rule, timing_expectation, evidence_class, is_mandatory,
            effective_start_date, effective_end_date, supersedes_requirement_id, created_at, updated_at)
           VALUES (@id, @frameworkVersionId, @criterionId, @criterionElementId, @requirementCode, @title, @description,
            @requirementType, @cardinalityRule, @timingExpectation, @evidenceClass, @isMandatory,
            @effectiveStartDate, @effectiveEndDate, @supersedesRequirementId, @createdAt, @updatedAt)
           ON CONFLICT(id) DO UPDATE SET
             framework_version_id=excluded.framework_version_id, criterion_id=excluded.criterion_id, criterion_element_id=excluded.criterion_element_id,
             requirement_code=excluded.requirement_code, title=excluded.title, description=excluded.description,
             requirement_type=excluded.requirement_type, cardinality_rule=excluded.cardinality_rule, timing_expectation=excluded.timing_expectation,
             evidence_class=excluded.evidence_class, is_mandatory=excluded.is_mandatory, effective_start_date=excluded.effective_start_date,
             effective_end_date=excluded.effective_end_date, supersedes_requirement_id=excluded.supersedes_requirement_id, updated_at=excluded.updated_at`,
          {
            id: requirement.id,
            frameworkVersionId: requirement.frameworkVersionId,
            criterionId: requirement.criterionId,
            criterionElementId: requirement.criterionElementId,
            requirementCode: requirement.requirementCode,
            title: requirement.title,
            description: requirement.description,
            requirementType: requirement.requirementType,
            cardinalityRule: requirement.cardinalityRule,
            timingExpectation: requirement.timingExpectation,
            evidenceClass: requirement.evidenceClass,
            isMandatory: requirement.isMandatory ? 1 : 0,
            effectiveStartDate: requirement.effectiveStartDate,
            effectiveEndDate: requirement.effectiveEndDate,
            supersedesRequirementId: requirement.supersedesRequirementId,
            createdAt: requirement.createdAt,
            updatedAt: requirement.updatedAt,
          },
        );
      }
    });
    return frameworkVersion;
  }

  async getById(id) {
    const row = this.database.get('SELECT * FROM accreditation_frameworks_framework_versions WHERE id = @id', { id });
    return row ? this.#map(row) : null;
  }

  async getByFrameworkIdAndVersionTag(frameworkId, versionTag) {
    const row = this.database.get(
      `SELECT * FROM accreditation_frameworks_framework_versions WHERE framework_id = @frameworkId AND version_tag = @versionTag`,
      { frameworkId, versionTag },
    );
    return row ? this.#map(row) : null;
  }

  async findByFilter(filter = {}) {
    const { sql, params } = filterClause(filter, {
      id: 'id',
      frameworkId: 'framework_id',
      versionTag: 'version_tag',
      status: 'status',
    });
    const rows = this.database.all(
      `SELECT * FROM accreditation_frameworks_framework_versions ${sql} ORDER BY created_at ASC`,
      params,
    );
    return rows.map((row) => this.#map(row));
  }

  #map(row) {
    const standards = this.database.all(
      'SELECT * FROM accreditation_frameworks_standards WHERE framework_version_id = @id ORDER BY sequence ASC, created_at ASC',
      { id: row.id },
    );
    const criteria = this.database.all(
      'SELECT * FROM accreditation_frameworks_criteria WHERE framework_version_id = @id ORDER BY sequence ASC, created_at ASC',
      { id: row.id },
    );
    const criterionElements = this.database.all(
      'SELECT * FROM accreditation_frameworks_criterion_elements WHERE framework_version_id = @id ORDER BY sequence ASC, created_at ASC',
      { id: row.id },
    );
    const evidenceRequirements = this.database.all(
      'SELECT * FROM accreditation_frameworks_evidence_requirements WHERE framework_version_id = @id ORDER BY created_at ASC',
      { id: row.id },
    );

    return new FrameworkVersion({
      id: row.id,
      frameworkId: row.framework_id,
      versionTag: row.version_tag,
      status: row.status,
      publishedAt: row.published_at,
      effectiveStartDate: row.effective_start_date,
      effectiveEndDate: row.effective_end_date,
      standards: standards.map((item) => ({
        id: item.id,
        frameworkVersionId: item.framework_version_id,
        code: item.code,
        title: item.title,
        description: item.description,
        sequence: item.sequence,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      criteria: criteria.map((item) => ({
        id: item.id,
        frameworkVersionId: item.framework_version_id,
        standardId: item.standard_id,
        code: item.code,
        title: item.title,
        statement: item.statement,
        sequence: item.sequence,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      criterionElements: criterionElements.map((item) => ({
        id: item.id,
        frameworkVersionId: item.framework_version_id,
        criterionId: item.criterion_id,
        code: item.code,
        title: item.title,
        statement: item.statement,
        elementType: item.element_type,
        requiredFlag: toBool(item.required_flag),
        sequence: item.sequence,
        effectiveStartDate: item.effective_start_date,
        effectiveEndDate: item.effective_end_date,
        supersedesElementId: item.supersedes_element_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      evidenceRequirements: evidenceRequirements.map((item) => ({
        id: item.id,
        frameworkVersionId: item.framework_version_id,
        criterionId: item.criterion_id,
        criterionElementId: item.criterion_element_id,
        requirementCode: item.requirement_code,
        title: item.title,
        description: item.description,
        requirementType: item.requirement_type,
        cardinalityRule: item.cardinality_rule,
        timingExpectation: item.timing_expectation,
        evidenceClass: item.evidence_class,
        isMandatory: toBool(item.is_mandatory),
        effectiveStartDate: item.effective_start_date,
        effectiveEndDate: item.effective_end_date,
        supersedesRequirementId: item.supersedes_requirement_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

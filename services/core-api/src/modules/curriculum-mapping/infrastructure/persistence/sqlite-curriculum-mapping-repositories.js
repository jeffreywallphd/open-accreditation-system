import { ProgramRepository } from '../../domain/repositories/repositories.js';
import { Program } from '../../domain/entities/program.js';

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

export class SqliteProgramRepository extends ProgramRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  async save(program) {
    this.database.run(
      `INSERT INTO curriculum_mapping_programs
       (id, institution_id, name, code, description, status, created_at, updated_at)
       VALUES (@id, @institutionId, @name, @code, @description, @status, @createdAt, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET
         institution_id=excluded.institution_id, name=excluded.name, code=excluded.code,
         description=excluded.description, status=excluded.status, updated_at=excluded.updated_at`,
      {
        id: program.id,
        institutionId: program.institutionId,
        name: program.name,
        code: program.code,
        description: program.description,
        status: program.status,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
      },
    );
    return program;
  }

  async getById(id) {
    const row = this.database.get('SELECT * FROM curriculum_mapping_programs WHERE id = @id', { id });
    return row
      ? new Program({
          id: row.id,
          institutionId: row.institution_id,
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
      institutionId: 'institution_id',
      code: 'code',
      status: 'status',
    });
    const rows = this.database.all(`SELECT * FROM curriculum_mapping_programs ${sql} ORDER BY created_at ASC`, params);
    return rows.map(
      (row) =>
        new Program({
          id: row.id,
          institutionId: row.institution_id,
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

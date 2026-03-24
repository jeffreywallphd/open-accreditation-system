import { ValidationError } from '../../shared/kernel/errors.js';
import { Program } from '../domain/entities/program.js';

export class CurriculumMappingService {
  constructor({ programs, institutions }) {
    this.programs = programs;
    this.institutions = institutions;
  }

  async createProgram(input) {
    const institution = await this.institutions.getById(input.institutionId);
    if (!institution) {
      throw new ValidationError(`Institution not found: ${input.institutionId}`);
    }

    const existing = await this.programs.findByFilter({ institutionId: input.institutionId, code: input.code });
    if (existing.length > 0) {
      throw new ValidationError(`Program code already exists in institution: ${input.code}`);
    }

    const program = Program.create(input);
    return this.programs.save(program);
  }

  async getProgramById(id) {
    return this.programs.getById(id);
  }

  async listPrograms(filter = {}) {
    return this.programs.findByFilter(filter);
  }
}

import { assertOneOf, assertRequired, assertString } from '../../../shared/kernel/assertions.js';
import { createId, nowIso } from '../../../shared/kernel/identity.js';
import { recordStatus } from '../../../shared/value-objects/statuses.js';

export class Program {
  constructor(props) {
    assertRequired(props.id, 'Program.id');
    assertRequired(props.institutionId, 'Program.institutionId');
    assertString(props.name, 'Program.name');
    assertString(props.code, 'Program.code');
    assertOneOf(props.status, 'Program.status', Object.values(recordStatus));

    this.id = props.id;
    this.institutionId = props.institutionId;
    this.name = props.name;
    this.code = props.code;
    this.description = props.description ?? null;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input) {
    const now = nowIso();
    return new Program({
      id: input.id ?? createId('prog'),
      institutionId: input.institutionId,
      name: input.name,
      code: input.code,
      description: input.description,
      status: input.status ?? recordStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
  }
}

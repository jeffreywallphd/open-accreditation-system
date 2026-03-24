import { EvidenceItemRepository } from '../../domain/repositories/repositories.js';
import { EvidenceItem } from '../../domain/entities/evidence-item.js';

function matchesFilter(item, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (value === undefined || value === null) {
      return true;
    }
    return item[key] === value;
  });
}

export class InMemoryEvidenceItemRepository extends EvidenceItemRepository {
  constructor() {
    super();
    this.items = new Map();
  }

  async save(evidenceItem) {
    const persisted = structuredClone(evidenceItem);
    this.items.set(evidenceItem.id, persisted);
    return new EvidenceItem(structuredClone(persisted));
  }

  async getById(id) {
    const item = this.items.get(id);
    return item ? new EvidenceItem(structuredClone(item)) : null;
  }

  async findByFilter(filter = {}) {
    return [...this.items.values()]
      .filter((item) => matchesFilter(item, filter))
      .map((item) => new EvidenceItem(structuredClone(item)));
  }
}

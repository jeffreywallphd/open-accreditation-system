import { runTests as runDomainTests } from './unit/foundational-domain-invariants.test.js';
import { runTests as runAccreditationFrameworkTests } from './unit/accreditation-frameworks-domain-slice.test.js';
import { runTests as runPersistenceTests } from './integration/persistence-foundation.integration.test.js';
import { runTests as runHttpTests } from './integration/http-foundation.integration.test.js';
import { runTests as runAccreditationFrameworkPersistenceTests } from './integration/accreditation-frameworks-persistence.integration.test.js';
import { runTests as runAccreditationFrameworkHttpTests } from './integration/accreditation-frameworks-http.integration.test.js';

const suites: Array<[string, () => Promise<void>]> = [
  ['domain invariants', runDomainTests],
  ['accreditation frameworks slice', runAccreditationFrameworkTests],
  ['persistence integration', runPersistenceTests],
  ['http integration', runHttpTests],
  ['accreditation frameworks persistence integration', runAccreditationFrameworkPersistenceTests],
  ['accreditation frameworks http integration', runAccreditationFrameworkHttpTests],
];

let failed = 0;
for (const [name, runner] of suites) {
  try {
    await runner();
    console.log(`PASS: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log(`PASS: all ${suites.length} suites`);
}

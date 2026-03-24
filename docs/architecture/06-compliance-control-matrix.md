# 06 Compliance Control Matrix

## Purpose

This matrix maps architecture controls to implementation zones and evidence artifacts. It is designed for engineering planning and audit readiness, not as legal advice.

## Control Matrix

| Control Objective | Control Statement | Primary Architecture Owner | Implementation Loci | Evidence Artifact |
| --- | --- | --- | --- | --- |
| Access Governance | Access is role- and attribute-constrained by org scope and workflow role. | `identity-access`, `workflow-approvals` | `services/core-api/src/modules/identity-access`, `services/core-api/src/modules/workflow-approvals` | Authorization policy definitions, permission test cases |
| Authentication | Institutional SSO is enforced for user authentication paths. | Platform security | `platform/security/iam`, API gateway/auth middleware | IdP integration config docs, auth integration tests |
| Least Privilege | Service-to-service access uses scoped credentials and minimal permissions. | Platform security, service owners | `platform/security/policies`, service runtime config | Service account policy manifests, access review logs |
| Evidence Lineage | Evidence records preserve source, version, and chain metadata. | `evidence-management` | `services/core-api/src/modules/evidence-management`, `storage/evidence`, `storage/quarantined` | Evidence provenance model and audit trail exports |
| Workflow Accountability | Material approval decisions are traceable to actor, time, and context. | `workflow-approvals` | `services/core-api/src/modules/workflow-approvals`, `schemas/events/submission-approved.schema.json` | Approval event logs, workflow history records |
| Integration Integrity | External data is transformed through canonical schemas with reconciliation. | `integration-hub` | `services/integration-hub/src/connectors`, `mappings`, `pipelines`, `schemas/canonical` | Mapping specs, reconciliation reports, DLQ records |
| Data Protection | Sensitive data is encrypted in transit and at rest. | Platform security | deployment platform and storage configuration | TLS configuration, storage encryption settings |
| Secrets Management | Secrets are managed out of source control and rotated by policy. | Platform security | `platform/security/secrets`, deployment secret stores | Secret inventory, rotation logs |
| Audit Logging | Security and governance-critical actions are auditable. | `compliance-audit`, platform observability | `services/core-api/src/modules/compliance-audit`, `platform/observability/logging` | Audit log retention evidence, query reports |
| Change Control | Architectural changes with risk impact are decision-tracked. | Architecture owners | `docs/decisions/*` | ADR entries with context and consequences |
| AI Governance | AI-generated output is advisory and requires human validation. | `ai-assistant`, `workflow-approvals` | `services/ai-assistant/src/policy-guards`, workflow modules | Review/acceptance events, prompt provenance logs |
| Privacy and FERPA Alignment | Student/faculty records are processed with scoped access and minimization. | Domain and security owners | `platform/compliance/ferpa`, domain modules and APIs | Data flow documentation, access audit samples |
| Accessibility | User-facing experiences meet accessibility-first engineering standards. | App and design-system owners | `apps/web`, `apps/reviewer-portal`, `packages/ui`, `platform/compliance/accessibility` | Accessibility test outputs and remediation logs |
| Retention and Disposal | Evidence and audit records follow retention schedules and disposition rules. | `evidence-management`, `compliance-audit` | `platform/compliance/retention`, storage lifecycle policies | Retention policy docs, deletion/disposition logs |
| Operational Resilience | Critical services have monitoring, alerting, and controlled recovery paths. | Platform operations | `platform/observability/alerts`, `dashboards`, deployment manifests | Alert definitions, incident runbooks, recovery test records |

## Usage Guidance

- use this matrix when defining stories and acceptance criteria
- map new features to at least one control objective before implementation
- update control evidence locations whenever folders or ownership change

# 07 Data Classification

## Purpose

This document defines data classes for the platform and handling requirements by class.

## Classification Levels

### Level 1: Public

Definition:

- content approved for public disclosure

Examples:

- public accreditation summaries
- non-sensitive product docs

Handling:

- no special access restriction beyond integrity controls

### Level 2: Internal

Definition:

- operational data for institutional users that is not public

Examples:

- internal workflow metadata without personal details
- non-sensitive operational dashboards

Handling:

- authenticated access required
- organizational scoping where applicable

### Level 3: Confidential

Definition:

- non-public institutional data that could cause harm if disclosed

Examples:

- draft narratives, internal findings, accreditation readiness status
- connector configuration metadata

Handling:

- encryption in transit and at rest
- role-based access with audit logging
- restricted export pathways

### Level 4: Restricted or Regulated

Definition:

- sensitive personal, academic, employment, or compliance-regulated data

Examples:

- student-linked outcomes data under institutional privacy obligations
- faculty personnel attributes
- sensitive evidence attachments

Handling:

- strict least-privilege plus attribute-based constraints
- mandatory auditability for access and change
- redaction/minimization in logs and AI prompts
- retention and disposal policies enforced

## Data Domain Classification Map

| Data Domain | Typical Classification | Primary Owner Context | Storage and Contract Loci |
| --- | --- | --- | --- |
| User and role assignments | Confidential to Restricted | `identity-access` | core DB, auth claims, audit logs |
| Organizational hierarchy | Internal to Confidential | `organization-registry` | canonical schemas, core DB |
| Accreditor standards mappings | Internal to Confidential | `accreditation-frameworks` | data/reference, framework records |
| Evidence metadata | Confidential | `evidence-management` | core DB and event logs |
| Evidence artifacts | Confidential to Restricted | `evidence-management` | `storage/evidence`, `storage/quarantined` |
| Workflow decisions | Confidential | `workflow-approvals` | core DB, workflow events |
| Narrative/report drafts | Confidential | `narratives-reporting` | report stores and export staging |
| Faculty analytics views | Confidential to Restricted | `faculty-intelligence` | canonical person/activity projections |
| Integration payload snapshots | Confidential to Restricted | `integration-hub` | connector stores, dead-letter and retry traces |
| Audit and compliance records | Confidential to Restricted | `compliance-audit` | audit stores, compliance reports |

## Handling Requirements by Lifecycle

Collection:

- collect minimum required fields for the use case
- label records with classification at ingestion boundaries where feasible

Processing:

- avoid moving restricted fields into broad shared caches
- maintain provenance for imported and transformed records

Storage:

- separate artifact/object storage from transactional state
- enforce access policy by organization and role

Transport:

- use authenticated and encrypted channels for all non-public classes

Logging and Observability:

- do not log restricted payload bodies by default
- record correlation IDs, actors, and operation metadata for traceability

AI Usage:

- restricted data in AI workflows requires policy guard review
- preserve provenance and reviewer confirmation before adoption into governed artifacts

## Retention and Disposition

- define retention schedules by data domain in `platform/compliance/retention`
- apply legal hold and exception handling for audit and active review cases
- ensure deletion and archival flows emit auditable events

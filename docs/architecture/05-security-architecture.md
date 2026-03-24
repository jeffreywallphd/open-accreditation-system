# 05 Security Architecture

## Purpose

This document describes the security architecture baseline for the platform and maps security controls to repository structure.

## Security Principles

- least privilege by default
- deny by default at service and data boundaries
- defense in depth across identity, network, application, and data layers
- auditable privileged actions and configuration changes
- secure-by-default developer workflows

## Security Domains in Repository

- policy and IAM assets: `platform/security/iam`, `platform/security/policies`
- secret management assets: `platform/security/secrets`
- threat modeling assets: `platform/security/threat-models`
- compliance mapping overlays: `platform/compliance/*`

## Identity and Access

Target model:

- federated authentication via institutional identity provider
- hybrid RBAC and ABAC authorization model
- scoped access by organization, role, and accreditation cycle
- separate service principals for machine-to-machine workloads

Authorization expectations:

- enforce authorization in application use cases, not only controllers
- check resource ownership and organizational scope for read and write actions
- require explicit elevated privileges for administrative overrides

## Service Boundary Security

- `core-api` is the authoritative write path for governed domain state
- companion services accept narrowly scoped tokens and explicit contracts
- integration connectors use per-system credentials with isolated permissions
- event channels use authenticated producers and consumers

## Data Security

- encryption in transit for all service and external connections
- encryption at rest for transactional and object storage layers
- explicit separation between normal evidence storage and quarantine storage
- PII-sensitive fields excluded from logs unless explicitly approved and redacted

## AI and Security Boundary

- AI outputs are advisory and never auto-authoritative
- prompt and response logging must honor privacy and data minimization rules
- model routing and policy guards in `services/ai-assistant/src/policy-guards`
- human approval is required before AI output becomes institutional record content

## Secure Development and Runtime Controls

- secret values are never committed to repo; `.env.example` is template only
- API schemas and event contracts are reviewed before broad exposure
- dependency and container scanning are expected in CI
- audit events are emitted for approval, evidence, and privileged operations

## Threat Focus Areas

- unauthorized evidence access and exfiltration
- privilege escalation across institution hierarchy
- integration connector credential compromise
- prompt injection and retrieval poisoning in AI flows
- event replay and message tampering
- insecure direct object references in export and report endpoints

## Minimum Security Artifacts Per Major Feature

- threat notes for new attack surface
- authorization matrix for affected actions
- audit event definition updates
- secrets and key-rotation implications
- logging and redaction design notes

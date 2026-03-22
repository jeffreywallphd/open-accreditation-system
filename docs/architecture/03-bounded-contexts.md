# 03 Bounded Contexts

## Purpose

This document defines the target bounded contexts for the core platform and how they map to the repository. It is the reference for deciding where new domain behavior belongs.

## Core Context Map

Primary module root: `services/core-api/src/modules`

Defined contexts:

- `identity-access`
- `organization-registry`
- `accreditation-frameworks`
- `evidence-management`
- `assessment-improvement`
- `workflow-approvals`
- `narratives-reporting`
- `faculty-intelligence`
- `curriculum-mapping`
- `compliance-audit`
- `shared` (limited shared kernel only)

## Ownership Matrix

### `identity-access`

Owns:

- platform identity references, role bindings, access attributes
- policy evaluation inputs and permission resolution contracts

Depends on:

- external identity providers via infrastructure adapters

### `organization-registry`

Owns:

- institutional hierarchy and canonical organization references

Depends on:

- integration-fed organization data from canonical mappings

### `accreditation-frameworks`

Owns:

- standards, criteria, cycle templates, and accreditor extension points

Depends on:

- rule-pack definitions and mapping metadata

### `evidence-management`

Owns:

- evidence metadata, provenance, linkage, and lifecycle states
- references to artifacts in `storage/evidence` and `storage/quarantined`

Depends on:

- object storage adapters
- integration import provenance

### `assessment-improvement`

Owns:

- findings, action plans, assessment outcomes, and closure loops

Depends on:

- curriculum mappings and evidence references

### `workflow-approvals`

Owns:

- submission workflow state, assignments, approvals, and escalations

Depends on:

- identity and organization scoping
- evidence and reporting states

### `narratives-reporting`

Owns:

- narrative sections, report assembly state, export packages

Depends on:

- approved evidence and workflow milestones
- optional AI draft suggestions (advisory)

### `faculty-intelligence`

Owns:

- accreditation-oriented faculty profile projections and analytics views

Depends on:

- canonical faculty/person/activity feeds from integration boundary

### `curriculum-mapping`

Owns:

- outcome, competency, course, and program mapping surfaces

Depends on:

- canonical course/program/person data
- accreditor-framework mappings

### `compliance-audit`

Owns:

- audit query views, control attestations, policy exception records

Depends on:

- event and state signals from all contexts

### `shared`

Owns:

- stable cross-cutting primitives only (no business policy ownership)

Depends on:

- nothing that introduces domain leakage

## Context Interaction Rules

- dependencies flow through application interfaces and published contracts
- contexts do not import each other's infrastructure internals
- vendor/system payloads stay outside core domain contexts
- cross-context coordination is explicit in use cases, events, or orchestration layers

## Internal Layering Standard Per Context

Each context follows:

```text
<context>/
  domain/
  application/
  infrastructure/
  api/
```

Rules:

- `domain` has business invariants only
- `application` orchestrates use cases and ports
- `infrastructure` implements adapters and persistence
- `api` handles transport mapping only

## Fit Guidance for New Work

Put work in an existing context unless a new bounded context is justified by:

- distinct language and ownership
- cohesive invariants
- low coupling to current contexts

Do not create contexts based only on ticket size or team convenience.

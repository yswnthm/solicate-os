# Database Architecture Decisions

## Decision 001: Soft-Delete Convention

**Date:** 2026-08-05  
**Context:** Standardizing how entity inactivity, archiving, and deletion are handled across the database schema before applying workspace-level RLS and structural migration.

### Decision
- **High-level Entities (`people`, `projects`, `clients`):** Maintain `archived_at timestamp with time zone` (or `deleted_at`). Inactive entities are defined by `archived_at IS NOT NULL`. These entities are archived as a whole unit rather than progressing through a multi-stage status lifecycle.
- **Lifecycle Entities (`tasks`, `issues`, `entries`):** Rely on their respective `status` enums (e.g. `'done'`, `'cancelled'`, `'archived'`, `'closed'`) with no dedicated `archived_at` column. These entities naturally transition through operational lifecycles.

### Rationale
- Avoids column bloat on transient operational records.
- Preserves explicit auditability and archiving capabilities for primary organizational entities.
- Maintains consistency for upcoming workspace RLS policies and queries.

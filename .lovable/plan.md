

# Merge Multi-Tenant Architecture Doctrine into `.cursor/rules/multi-tenancy-rbac.mdc`

## What Changes

The existing file covers **data isolation rules, RLS patterns, role system, and frontend permission checks**. The Multi-Tenant Architecture Doctrine adds **entity definitions, hierarchy model, naming/terminology enforcement, and feature design guardrails** that are currently not codified anywhere in the rules.

The merged file will be a single authoritative governance document with no duplication.

## Merged Structure

The new file will have these sections (items marked **NEW** are from the Doctrine):

1. **Non-Negotiable Definitions** (NEW) -- Platform, Organization, User, Role, Location, Client definitions with the rule that these terms are never interchangeable
2. **Entity Hierarchy Model** (NEW) -- The tree (Platform > Organization > Location > Team > Domain Objects) with scoping rules
3. **Data Isolation** (existing) -- Database-level and frontend-level RLS/query rules (unchanged)
4. **Role System** (existing) -- App Roles and Platform Roles (unchanged)
5. **Frontend Permission Checks** (existing) -- VisibilityGate, usePermission, useEffectiveRoles patterns (unchanged)
6. **Naming and Terminology Enforcement** (NEW) -- Language rules for "Platform" vs "Organization" vs "Account" in UI, copy, and code
7. **Feature Design Guardrails** (NEW) -- Rules preventing global/tenant confusion: brand tokenization scope, tenant settings ownership, platform admin isolation

## What Gets Removed (Deduplication)

- The Doctrine's data isolation rules (tenant-scoped data, no cross-org access) are already covered by the existing RLS section -- they will not be duplicated
- The Doctrine's permission enforcement rules are already covered by the existing frontend permission checks section

## Technical Details

- Single file edit: `.cursor/rules/multi-tenancy-rbac.mdc`
- Description line updated to reflect broader scope: "Non-negotiable multi-tenancy architecture, data isolation, terminology, and access control rules."
- `alwaysApply: true` remains
- No code files, database, or dependency changes




# Gap Closure: 2 Remaining Hardcoded Brand Strings

Two user-facing hardcoded "Zura" strings in edge functions were missed during the Phase 1 corrections.

## Changes

### 1. `supabase/functions/weekly-digest/index.ts` (line 128)

**Current:** `Automated weekly digest from Zura.`
**Fix:** Import `PLATFORM_NAME` from `_shared/brand.ts`, replace with `` `Automated weekly digest from ${PLATFORM_NAME}.` ``

### 2. `supabase/functions/demo-assistant/index.ts` (line 9)

**Current:** `...product consultant for Zura—a comprehensive salon management platform.`
**Fix:** Import `PLATFORM_NAME` and `PLATFORM_CATEGORY` from `_shared/brand.ts`, replace with `` `...product consultant for ${PLATFORM_NAME}—a ${PLATFORM_CATEGORY.toLowerCase()}.` ``

## Scope

- 2 files edited
- 2 string replacements
- No new tokens, no new files, no behavior changes
- After this, System Integrity Score reaches a true 10/10 for string-level tokenization

## What Remains (Phase 2 -- not in this task)

- 37 files with "Zura" in code identifiers (component names, hook names, interface names, table references) -- these are internal-only and do not affect users


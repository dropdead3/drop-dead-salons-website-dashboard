# Debug Log

Last updated: 2026-02-12 (Wave 1 in progress)

## Baseline

- `npm run lint` -> failed (`1199 problems`: `1100 errors`, `99 warnings`)
- `npm test` -> passed (`1 file`, `1 test`)
- `npm run build` -> passed (bundle warning: large main chunk; dynamic+static import warnings)
- Dev server already running on `http://localhost:8080`

## Lint Breakdown (top rules)

- `@typescript-eslint/no-explicit-any`: 1030
- `react-hooks/exhaustive-deps`: 58
- `react-refresh/only-export-components`: 40
- `no-case-declarations`: 29
- `prefer-const`: 25
- `no-control-regex`: 2

## Multilevel Agent Findings (initial pass)

### P0 (critical)

1. Permission bypass risk when route requires permission and user permissions are empty.
2. Platform sidebar routes existed for pages not registered in router (`health-scores`, `benchmarks`), causing blank content.

### P1 (high)

1. `/dashboard/platform` had no index route, resulting in empty outlet.
2. Persisted active org lookup used `.single()` and can fail for users without profile row.
3. Platform login ignored `state.from`, losing deep-link destination after auth.

### P2 (important follow-up)

1. Auth initialization race potential in `AuthContext` (`getSession` + `onAuthStateChange` updates).
2. Query defaults are not centrally configured in `QueryClient`.
3. Several pages use data queries without loading/error UX.
4. Main app bundle is oversized due to eager route imports.

## Fixes Applied in This Pass

- Updated `src/components/auth/ProtectedRoute.tsx` to always enforce `requiredPermission` checks (removed permissive `permissions.length > 0` guard).
- Updated `src/App.tsx`:
  - Added platform index redirect to `overview`.
  - Registered `/dashboard/platform/health-scores`.
  - Registered `/dashboard/platform/benchmarks`.
- Updated `src/contexts/OrganizationContext.tsx` persisted org lookup from `.single()` to `.maybeSingle()`.
- Updated `src/pages/PlatformLogin.tsx` to preserve and use `location.state.from` for post-login redirect when targeting platform routes.

## Verification After Fixes

- `npm test` -> passed
- `npm run build` -> passed
- Lints on edited files -> no new linter errors

## Wave 1 Execution (Auth Lane)

### A1 `authCoreAgent` completed

- Refactored `src/contexts/AuthContext.tsx` to a single `processSession` pipeline.
- Added stale async protection with request versioning and mounted guards.
- Centralized loading completion to reduce race-prone state updates.

### A2 `authRouteAgent` + `authRedirectAgent` completed

- Updated `src/hooks/useEffectivePermissions.ts` to return `{ permissions, isLoading }`.
- Updated `src/components/auth/ProtectedRoute.tsx` to include effective-permissions loading in spinner-first gating.
- Enforced deny-by-default with known empty effective permissions.
- Removed infinite spinner risk for users with no roles by eliminating the stale `roles.length === 0` loading guard.
- Redirect review for `src/pages/PlatformLogin.tsx` found behavior deterministic; no additional patch required.

### Wave 1 verification gate

- `npm test` -> passed
- `npm run build` -> passed
- Lints on touched files:
  - `src/contexts/AuthContext.tsx`
  - `src/components/auth/ProtectedRoute.tsx`
  - `src/hooks/useEffectivePermissions.ts`
  - `src/pages/PlatformLogin.tsx`
  - result: no new linter errors

### A3 regression coverage added

- Added focused guard tests in `src/components/auth/ProtectedRoute.test.tsx`.
- Coverage includes:
  - unauthenticated redirect to staff login on non-platform routes,
  - unauthenticated redirect to platform login on platform routes,
  - spinner-first gating while effective permissions are loading,
  - deny-by-default when required permission exists but effective permissions are empty,
  - View As denied path rendering,
  - allow path when permission exists.
- Post-A3 verification:
  - `npm test` -> passed (`2 files`, `7 tests`)
  - `npm run build` -> passed
  - lints on touched files -> no new errors

## Next Debug Queue

1. **Wave 2:** prevent silent data fallbacks in points services (`0` or `[]` on errors).
2. **Wave 3:** add loading/error UI in high-traffic query pages (`ManagementHub`, `Stats`, leaderboard flow).
3. **Wave 4:** introduce route-level lazy loading in `App.tsx` to split dashboard/platform modules.
4. **Wave 5:** expand regression gates for permission guard behavior and platform route accessibility.

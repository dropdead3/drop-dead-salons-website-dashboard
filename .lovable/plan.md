
# Update "Salon" Terminology to Inclusive "Account" Language

## Summary

Update all platform dashboard terminology to use inclusive language that applies to all beauty business types (salons, spas, esthetics, barbershops, med spas, wellness centers) instead of specifically referencing "salons".

---

## Changes Overview

The following text strings will be updated across the platform admin interface:

| Current Text | New Text |
|-------------|----------|
| "Salon Accounts" | "Accounts" |
| "Total Salons" | "Total Accounts" |
| "Active salon accounts" | "Active accounts" |
| "Salons being set up" | "Accounts being set up" |
| "Across all salons" | "Across all accounts" |
| "New Salon Account" | "New Account" |
| "Create your first salon account" | "Create your first account" |
| "Manage salon accounts..." | "Manage accounts..." |
| "Create Salon Account" | "Create Account" |
| "Set up a new salon organization" | "Set up a new organization" |
| "New salon account created" | "New account created" |
| "Import data...into salon accounts" | "Import data...into accounts" |
| "Choose which salon account..." | "Choose which account..." |
| "Select a salon organization..." | "Select an organization..." |

---

## Files to Modify

### 1. Platform Overview Page

**File**: `src/pages/dashboard/platform/Overview.tsx`

| Line | Current | New |
|------|---------|-----|
| 47 | "Manage salon accounts, migrations, and platform health" | "Manage accounts, migrations, and platform health" |
| 52 | "New Salon Account" | "New Account" |
| 59 | "Total Salons" | "Total Accounts" |
| 62 | "Active salon accounts" | "Active accounts" |
| 68 | "Salons being set up" | "Accounts being set up" |
| 82 | "Across all salons" | "Across all accounts" |
| 143 | "Create your first salon account to get started" | "Create your first account to get started" |

### 2. Accounts Page

**File**: `src/pages/dashboard/platform/Accounts.tsx`

| Line | Current | New |
|------|---------|-----|
| 94 | "Salon Accounts" | "Accounts" |
| 95 | "Manage all salon organizations on the platform" | "Manage all organizations on the platform" |
| 281 | "Create your first salon account to get started" | "Create your first account to get started" |

### 3. Create Organization Dialog

**File**: `src/components/platform/CreateOrganizationDialog.tsx`

| Line | Current | New |
|------|---------|-----|
| 134 | "Create Salon Account" | "Create Account" |
| 137 | "Set up a new salon organization on the platform" | "Set up a new organization on the platform" |

### 4. Platform Import Page

**File**: `src/pages/dashboard/platform/PlatformImport.tsx`

| Line | Current | New |
|------|---------|-----|
| 58 | "Import data from external software into salon accounts" | "Import data from external software into accounts" |
| 71 | "Choose which salon account to import data into" | "Choose which account to import data into" |
| 77 | "Select a salon organization..." | "Select an organization..." |

### 5. Dashboard Layout (Navigation)

**File**: `src/components/dashboard/DashboardLayout.tsx`

| Line | Current | New |
|------|---------|-----|
| 192 | "Salon Accounts" | "Accounts" |

### 6. Organization Stats Hook

**File**: `src/hooks/useOrganizationStats.ts`

| Line | Current | New |
|------|---------|-----|
| 64 | "New salon account created" | "New account created" |

---

## Visual Changes

### Before (Platform Overview)

```text
TOTAL SALONS          IN ONBOARDING         PENDING MIGRATIONS    TOTAL LOCATIONS
1                     0                     0                     2
Active salon accounts Salons being set up   Data imports...       Across all salons
```

### After (Platform Overview)

```text
TOTAL ACCOUNTS        IN ONBOARDING         PENDING MIGRATIONS    TOTAL LOCATIONS
1                     0                     0                     2
Active accounts       Accounts being set up Data imports...       Across all accounts
```

---

## Technical Notes

- The `business_type` field in the database remains unchanged (it still stores values like 'salon', 'spa', 'esthetics', etc.) - this is correct for categorization
- The `businessTypeLabels` mapping in `Accounts.tsx` remains unchanged since it displays the actual business type for each organization
- Customer-facing pages that reference the specific "Drop Dead Gorgeous" salon brand are NOT being changed (e.g., "Salon Policies" in the header)
- This change only affects internal platform administration terminology

---

## Implementation

This is a straightforward text replacement across 6 files with no logic changes required. All updates are simple string modifications that make the platform interface more inclusive for all beauty business types.


# Eliminate Hardcoded "Phorest" References from User-Facing UI

## Overview

Create a shared hook that resolves the active POS/CRM provider name dynamically, then update all 11 files with hardcoded "Phorest" user-facing strings to use it instead. Internal identifiers (variable names, table names, query keys, route paths) are out of scope.

## Step 1: Create `usePOSProviderLabel` Hook

**New file:** `src/hooks/usePOSProviderLabel.ts`

A lightweight hook built on top of the existing `usePOSConfig()` that returns:
- `providerName`: Title-cased provider name (e.g. "Phorest", "Boulevard") or `null` if none configured
- `providerLabel`: Same as above but with "POS" fallback when no provider is set
- `syncLabel`: e.g. "Phorest Sync" or "POS Sync"
- `isConnected`: boolean

This centralizes all provider name logic in one place.

## Step 2: Update 11 Files

### 2a. `PhorestWriteGateCard.tsx` (8 strings)
- Import `usePOSProviderLabel`
- Line 58: toast title -- "Phorest write-back" becomes `"{providerLabel} write-back"`
- Lines 60-61: toast descriptions -- "sync to Phorest" / "Phorest will not be updated" become dynamic
- Line 78: "manage Phorest write-back settings" becomes `"manage {providerLabel} write-back settings"`
- Line 88: heading "Sync Changes to Phorest" becomes `"Sync Changes to {providerLabel}"`
- Line 90: "pushed to your live Phorest system" becomes dynamic
- Line 127: "without pushing to Phorest" becomes dynamic
- Line 136: "Phorest data sync (reading FROM Phorest)" becomes dynamic

### 2b. `SidebarSyncStatusWidget.tsx` (2 strings)
- Line 121: tooltip "Phorest Sync" becomes `syncLabel`
- Line 141: label "Phorest Sync" becomes `syncLabel`

### 2c. `PhorestSyncPopout.tsx` (2 strings)
- Line 188: tooltip "Phorest Sync Status" becomes `"{syncLabel} Status"`
- Line 196: header "Phorest Sync" becomes `syncLabel`

### 2d. `StaffMatchingSuggestions.tsx` (1 string)
- Line 100: "Link your team to Phorest to track individual stats" becomes `"Link your team to {providerLabel} to track individual stats"`

### 2e. `ProductCategoryChart.tsx` (1 string)
- Line 81: "Product data syncs from Phorest sales transactions" becomes `"Product data syncs from {providerLabel} sales transactions"`

### 2f. `AssistantRequestsCalendar.tsx` (2 strings)
- Line 296: tooltip "Phorest Conflict" becomes `"{providerLabel} Conflict"` (or "Schedule Conflict" if no provider)
- Line 348: legend label "Phorest Conflict" becomes dynamic

### 2g. `LeaderboardContent.tsx` (2 strings)
- Line 460: "Live data from Phorest" becomes `"Live data from {providerLabel}"`
- Line 466: "Connect Phorest to see live rankings" becomes `"Connect {providerLabel} to see live rankings"`

### 2h. `Stats.tsx` (4 strings)
- Line 162: heading "PHOREST DATA - THIS WEEK" becomes `"{providerLabel} DATA - THIS WEEK"`
- Line 197: "Your account isn't linked to Phorest yet" becomes dynamic with `providerLabel`
- Line 269: badge "Phorest Data" becomes `"{providerLabel} Data"`
- Line 304: "Link your Phorest account to see live conversion metrics" becomes dynamic

### 2i. `PhorestSettings.tsx` (6 strings)
- Line 247: toast "a Phorest staff member" becomes `"a {providerLabel} staff member"`
- Line 311: heading "PHOREST INTEGRATION" becomes `"{providerLabel} INTEGRATION"`
- Line 313: "Manage Phorest API connection" becomes dynamic
- Line 514: "Link Team Members to Phorest Staff" becomes dynamic
- Line 516: description "Phorest staff profiles" becomes dynamic
- Line 608: placeholder "Select Phorest staff" becomes dynamic
- Line 655: table header "Phorest Name" becomes `"{providerLabel} Name"`

### 2j. `AccountIntegrationsCard.tsx` (1 string)
- Line 66: label "Phorest" becomes `providerLabel`

### 2k. `SystemHealth.tsx` (1 string)
- Line 166: "Last Phorest Sync" becomes `"Last {syncLabel}"`

## What This Does NOT Touch

- Internal variable/type names (phorestData, PhorestPerformer, etc.)
- Database table names (phorest_appointments, phorest_sync_log, etc.)
- Hook names (usePhorestSync, usePhorestConnection, etc.)
- Query keys (phorest-write-enabled, etc.)
- Edge function names and internals
- Route paths (/dashboard/admin/phorest-settings)
- The `usePhorestRequestConflicts` hook name and internal logic

## Risk Mitigation

- The new hook falls back gracefully: if `usePOSConfig()` returns null (no config table yet), `providerLabel` defaults to "POS" -- never shows a blank string
- All changes are string-only replacements in JSX/template literals; no logic, data flow, or component structure changes
- Existing functionality remains identical -- this is purely a display-layer refactor

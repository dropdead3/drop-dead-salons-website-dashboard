

# Rename "Access & Permissions" to "Roles & Controls" Everywhere

## Problem

The page title was updated to "Roles & Controls Hub" but the sidebar nav link and section header still say "Access & Permissions Hub" / "ACCESS & PERMISSIONS."

## Changes

Four files need a simple text rename:

### 1. `src/components/dashboard/DashboardLayout.tsx`
- Line 196 comment: "Access & Permissions section" -> "Roles & Controls section"
- Line 198 label: "Access & Permissions Hub" -> "Roles & Controls Hub"

### 2. `src/hooks/useSidebarLayout.ts`
- Line 22: section label "Access & Permissions" -> "Roles & Controls"

### 3. `src/components/dashboard/settings/SidebarPreview.tsx`
- Line 39 label: "Access & Permissions Hub" -> "Roles & Controls Hub"

### 4. `src/components/dashboard/settings/SidebarLayoutEditor.tsx`
- Line 145 comment: "Access & Permissions" -> "Roles & Controls"
- Line 146 label: "Access & Permissions Hub" -> "Roles & Controls Hub"

No structural or logic changes -- purely label/comment renames across these four files.


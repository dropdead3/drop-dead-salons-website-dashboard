

# Platform Incident Banner

## Overview
Build a system-wide incident notification bar -- styled like the amber/orange banner in the reference screenshot -- that appears at the very top of every dashboard page when there's an active platform issue. Platform admins can create, update, and resolve incidents; all organization users see the banner in real-time.

## How It Works

**For platform admins**: A new "Incidents" section in Platform Settings (or Platform Overview) lets them create an active incident with a message, severity, and optional status page link. Only one incident can be active at a time.

**For all dashboard users**: When an active incident exists, an amber banner renders above everything else in the DashboardLayout -- above the mobile header, above the impersonation banner, above all content. It spans full width (edge to edge, ignoring sidebar offset) and shows the message with an optional link. Users can dismiss it for the session, but it reappears if the incident is updated.

**Automatic incidents**: The existing `check-system-health` edge function already detects service outages and writes to `platform_notifications`. We'll extend it to also create/resolve incident records automatically when services go down or recover.

## Database

### New table: `platform_incidents`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| status | text | 'active', 'monitoring', 'resolved' |
| severity | text | 'info', 'warning', 'critical' |
| title | text | Short headline |
| message | text | Detailed message shown in the banner |
| link_text | text | Optional CTA text (e.g., "Open status page") |
| link_url | text | Optional URL |
| created_by | uuid | Platform user who created it |
| resolved_at | timestamptz | When resolved |
| resolved_by | uuid | Who resolved it |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

- RLS: All authenticated users can SELECT (they need to see the banner). Only platform admins can INSERT/UPDATE.
- Realtime enabled so the banner appears/disappears instantly across all sessions.

## Frontend Components

### 1. `src/components/dashboard/IncidentBanner.tsx`
- Queries `platform_incidents` for rows where `status` IN ('active', 'monitoring')
- Subscribes to realtime changes on the table
- Renders a full-width top bar with:
  - Warning icon (triangle)
  - Message text
  - Optional link/CTA
  - Dismiss button (stores dismissed incident ID + updated_at in sessionStorage so it reappears if updated)
- Severity-based colors:
  - **critical**: Red/orange gradient background (like the reference screenshot)
  - **warning**: Amber background
  - **info**: Blue background

### 2. Placement in `DashboardLayout.tsx`
- Rendered at the very top of the content wrapper, before the mobile header and before the impersonation banner
- Full-width (no sidebar padding offset) so it truly spans edge-to-edge like the reference
- Sticky at top with highest z-index

### 3. Platform Admin: Incident Management UI
- Add an "Active Incident" card to the Platform Overview page (`/dashboard/platform/overview`)
- Quick actions: "Create Incident", "Update Message", "Mark Resolved"
- Simple form: severity dropdown, title, message, optional link
- Shows history of past resolved incidents

## Edge Function Update

### `check-system-health/index.ts`
- After detecting a service is down: check if there's already an active incident. If not, auto-create one in `platform_incidents` with severity 'critical' and a message like "We're experiencing issues with [service]. Our team is investigating."
- After all services recover: if there's an auto-created active incident, update its status to 'resolved'
- Manual incidents (created by admins) are never auto-resolved

## Files to Create
1. **`src/components/dashboard/IncidentBanner.tsx`** -- The banner component with realtime subscription
2. **`src/hooks/useActiveIncident.ts`** -- Hook to query and subscribe to active incidents

## Files to Modify
1. **`src/components/dashboard/DashboardLayout.tsx`** -- Add IncidentBanner at the top of the layout, full-width before everything
2. **`supabase/functions/check-system-health/index.ts`** -- Auto-create/resolve incidents on service status changes
3. **Platform Overview page** -- Add incident management card for platform admins

## Database Migration
- Create `platform_incidents` table with RLS policies
- Enable realtime on the table

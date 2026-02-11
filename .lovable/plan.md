

# Client Health Hub -- Centralized Outreach & Relationship Management

## What We're Building

A dedicated **Client Health Hub** that consolidates every actionable client opportunity into one place -- at-risk clients, no-rebooks, win-back candidates, birthday outreach, and more -- with the ability to take immediate action (send emails, share with staff via Team Chat DMs, or export CSVs) directly from each segment.

## Where It Lives

1. **New dedicated page**: `/dashboard/admin/client-health` -- the full hub with all segments, filters, outreach tools, and tracking
2. **Summary widget on Client Directory**: A compact "Client Health Pulse" card on `/dashboard/clients` showing top-level metrics (e.g., "21 clients need rebooking", "8 at-risk clients") with a link to the full hub
3. **Sidebar entry**: Under Management Hub, labeled "Client Health"
4. **AI Insights integration**: Action items like "Reach out to 21 clients for rebooking" will get a "Begin Outreach" button linking directly to the relevant segment in the hub

## Hub Segments (Tabs or Sections)

| Segment | Data Source | Logic |
|---------|------------|-------|
| Needs Rebooking | `phorest_appointments` | Clients whose last appointment was X days ago with no future booking |
| At-Risk / Lapsing | `phorest_clients.last_visit` | Clients inactive for 60+ days (configurable threshold) |
| Win-Back Candidates | `phorest_clients.last_visit` | Clients inactive for 90+ days -- deeper lapsed |
| New Clients (No Return) | `phorest_appointments` | First-time visitors who never rebooked |
| Birthday Outreach | `phorest_clients` | Clients with upcoming birthdays (next 7/14/30 days) |
| High-Value Quiet | `phorest_clients.total_spend` + `last_visit` | Top spenders who have gone quiet |

Each segment shows:
- Client count and trend
- Filterable client list (name, last visit, total spend, assigned stylist)
- Bulk selection checkboxes
- Action bar with outreach options

## Outreach Actions (Per Segment)

### 1. Email via Resend
- Select clients, pick an existing email template (from `email_templates` table), preview, and send
- Reuses the existing `process-client-automations` Edge Function pattern
- Logs outreach to `client_automation_log` for tracking

### 2. Share with Staff via Team Chat DM
- Summarize the segment into a formatted message (e.g., "21 clients from last week didn't rebook -- here's the list")
- Opens the `ShareToDMDialog` (already built) to pick recipients
- Staff can then personally follow up

### 3. Export CSV
- One-click download of filtered client list
- Columns: Name, Email, Phone, Last Visit, Days Inactive, Total Spend, Assigned Stylist
- For use in Mailchimp, SMS platforms, or external CRMs

## AI Insights Integration

- On the AI Insights action items (like the screenshot: "Reach out to 21 clients for rebooking"), add a small "Begin Outreach" button next to "What you should do"
- Clicking it navigates to `/dashboard/admin/client-health?segment=needs-rebooking` with the relevant filters pre-applied

## Technical Details

### New Files
- `src/pages/dashboard/admin/ClientHealthHub.tsx` -- Main hub page with tabbed segments
- `src/components/dashboard/client-health/ClientHealthSummaryCard.tsx` -- Summary widget for Client Directory
- `src/components/dashboard/client-health/ClientSegmentTable.tsx` -- Reusable filtered client table with bulk selection
- `src/components/dashboard/client-health/BulkOutreachBar.tsx` -- Action bar (Email, Share, Export) that appears when clients are selected
- `src/components/dashboard/client-health/EmailOutreachDialog.tsx` -- Template picker and send confirmation dialog
- `src/hooks/useClientHealthSegments.ts` -- Hook that queries each segment's client list and counts

### Modified Files
- `src/App.tsx` -- Add route for `/dashboard/admin/client-health`
- `src/components/dashboard/SidebarNavContent.tsx` -- Add sidebar entry under Management Hub
- `src/pages/dashboard/admin/ManagementHub.tsx` -- Add card linking to Client Health
- `src/components/dashboard/AIInsightsDrawer.tsx` -- Add "Begin Outreach" button to `ActionItemCard` for client-related action items
- `src/components/dashboard/AIInsightsCard.tsx` -- Same "Begin Outreach" button addition
- Client Directory page -- Add `ClientHealthSummaryCard` widget

### Database
- No new tables needed -- leverages existing `phorest_clients`, `phorest_appointments`, `email_templates`, `client_automation_log`, and `reengagement_outreach`
- May add a `client_health_outreach_log` table later for hub-specific tracking, but Phase 1 reuses `client_automation_log`

### Edge Function
- Reuse `process-client-automations` for email sends
- Alternatively, create a lightweight `send-bulk-outreach` Edge Function that accepts a list of client IDs + template ID and sends via Resend -- this gives the hub direct control without needing automation rules

## Phased Approach (Recommended)

**Phase 1** (this implementation): Hub page with all segments, bulk email, Team Chat share, CSV export, AI insights integration

**Phase 2** (future): Outreach tracking dashboard (open rates, conversion to bookings), automated scheduling of recurring outreach, per-segment performance metrics


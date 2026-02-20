

## Enhance Assistant Schedule Page (Super Admin View)

### Current State

The Super Admin sees a bare "All Requests" tab with a list/calendar toggle and location filter. When there are no requests, it's just an empty state with "No requests found." Meanwhile, a richer admin page already exists at `/dashboard/admin/assistant-requests` (AssistantRequestsOverview) with stats, workload charts, activity cards, and coverage summaries -- but it's buried in the Management Hub and disconnected from this page.

### Gaps Identified

1. **No summary stats** -- Super admin has no quick visibility into pending, awaiting response, acceptance rates, or volume trends
2. **No assistant roster/coverage view** -- Can't see which assistants are available, their schedules, or coverage gaps by location/day
3. **No workload distribution** -- No visibility into whether assignments are balanced across assistants
4. **No "needs attention" callouts** -- Pending assignments and unresponded requests don't surface prominently
5. **No activity/performance data** -- No assisted revenue, assist counts, or pairing data
6. **No ability to manually assign** -- Super admin can't intervene when auto-assignment fails
7. **Redundant admin page** -- The rich AssistantRequestsOverview exists separately but isn't leveraged here

### Plan

Rather than duplicating the AssistantRequestsOverview components, the super admin view on this page will be restructured to incorporate the key operational panels inline, making it a proper command-level view.

**Changes to `src/pages/dashboard/AssistantSchedule.tsx`:**

For the admin/super_admin view, replace the current single "All Requests" tab with a richer tabbed layout:

1. **Overview Tab** (new, default for admin)
   - Stats grid: This Week count, Pending Assignment, Awaiting Response, Acceptance Rate
   - Summary row: Total, Completed, Total Declines, Cancelled
   - AssistantActivityCard (existing component -- assisted revenue and pairing data)
   - Recent Requests list (last 10, sorted by created_at)

2. **Needs Attention Tab** (new)
   - Pending and unresponded requests surfaced prominently
   - Manual assignment button per request (using existing ManualAssignmentDialog)
   - "All caught up" empty state when nothing pending

3. **Assistants Tab** (new)
   - Active assistants roster with avatar, name, location schedule grid (Mon-Sun dots)
   - AssistantWorkloadChart (existing component)
   - Coverage summary by location

4. **All Requests Tab** (existing, keep as-is)
   - Current list/calendar toggle behavior preserved

5. **Calendar Tab** (promote calendar to its own tab instead of toggle)
   - Uses existing AssistantRequestsCalendar or ScheduleCalendar

**Reused existing components (no new files needed):**
- `AssistantActivityCard`
- `AssistantWorkloadChart`
- `ManualAssignmentDialog`
- `AssistantPerformanceMetrics`

**Stylist and Stylist Assistant views remain unchanged** -- only the admin/super_admin branch gets the enhanced tabs.

### Technical Details

| File | Changes |
|------|---------|
| `src/pages/dashboard/AssistantSchedule.tsx` | Restructure the admin/super_admin view: add Overview, Needs Attention, and Assistants tabs with stat cards, existing chart components, manual assignment support, and coverage grid. Import reusable components from existing files. Keep stylist/assistant views untouched. |

No database changes needed. No new components needed -- all building blocks already exist. This is primarily a page-level composition change that brings the right data panels to where the super admin naturally navigates.

### Sequencing

1. Add imports for existing admin components (AssistantActivityCard, AssistantWorkloadChart, ManualAssignmentDialog, etc.)
2. Add stat calculation logic (reuse pattern from AssistantRequestsOverview)
3. Restructure admin tabs: Overview, Needs Attention, Assistants, All Requests
4. Wire up ManualAssignmentDialog for pending requests
5. Keep stylist/assistant tab logic untouched


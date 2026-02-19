

## Move "Subscribe to Calendar" from Top Nav to Settings > Integrations

### Why This Is the Right Home
The calendar sync is a one-time setup action, not a frequent-use control. Keeping it in the top nav bar adds visual noise to a surface reserved for high-frequency actions (navigation, search, visibility toggles). Moving it to Settings > Integrations groups it logically with other external connections (Phorest, Google Calendar, Stripe) where users expect to find sync/subscription features.

### Changes

**1. Remove from Top Nav Bar**
`src/components/dashboard/DashboardLayout.tsx`
- Remove the `Link2` icon button and its Tooltip wrapper (lines ~1152-1164)
- Remove the `CalendarSubscribeModal` render and `calSyncOpen` state
- Remove the `CalendarSubscribeModal` import

**2. Add Calendar Sync Card to Integrations Tab**
`src/components/dashboard/IntegrationsTab.tsx`
- Add a new "Calendar Sync" section at the top of the Integrations page (since it's an active, available feature -- not "coming soon")
- Render a dedicated card with:
  - Calendar icon + "Calendar Subscription" title
  - Description: "Subscribe to your Zura appointments from Apple Calendar, Google Calendar, or Outlook"
  - A "Manage" or "Set Up" button that opens the existing `CalendarSubscribeModal`
  - Status badge showing "Active" if a token exists, or "Not Set Up" if none
- Import `CalendarSubscribeModal` and `useCalendarFeedToken` to power the status badge and modal trigger

### Technical Details

**DashboardLayout.tsx removals:**
- State: `const [calSyncOpen, setCalSyncOpen] = useState(false);`
- Import: `CalendarSubscribeModal`
- JSX: The `<Tooltip>` block for Subscribe to Calendar and the `<CalendarSubscribeModal>` component

**IntegrationsTab.tsx additions:**
- Import `CalendarSubscribeModal` and `useCalendarFeedToken`
- Add local state `calSyncOpen` for the modal
- Add a "Calendar Sync" card above the existing integrations grid, styled consistently with the existing integration cards
- Show token status via the `useCalendarFeedToken` hook (token exists = "Active" badge, no token = "Not Set Up")

### Files Modified
- `src/components/dashboard/DashboardLayout.tsx` -- remove calendar subscribe button and modal
- `src/components/dashboard/IntegrationsTab.tsx` -- add calendar sync card with modal trigger


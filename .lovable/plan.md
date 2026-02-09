

# Consolidate Wizards into Their Respective Hubs

## What Changes

### 1. Payroll Hub becomes "Hiring & Payroll Hub"
- Rename the page title from "Payroll Hub" to "Hiring & Payroll Hub" across all references (page header, sidebar, quick links)
- Add a new **"Hire"** tab (with a UserPlus icon) to the existing tab bar, positioned first
- The Hire tab embeds the New Hire Wizard content inline (same multi-step flow, just rendered inside the tab instead of a standalone page)
- The standalone `/dashboard/admin/new-hire` route redirects to `/dashboard/admin/payroll?tab=hire` for backwards compatibility

### 2. Renter Hub gets an "Onboarding" tab
- Add an **"Onboarding"** tab (with a ClipboardList icon) to the existing Renters/Payments tab bar
- The Onboarding tab embeds the Renter Onboard Wizard inline
- The standalone `/dashboard/admin/onboard-renter` route redirects to `/dashboard/admin/booth-renters?tab=onboarding` for backwards compatibility

### 3. Navigation & Quick Links Updates
- **HubQuickLinks.tsx**: Rename "Payroll Hub" label to "Hiring & Payroll Hub"
- **Sidebar**: Update the Payroll nav label to "Hiring & Payroll"
- **ManagementHub.tsx**: Remove the standalone "New Hire Wizard" and "Renter Onboard Wizard" cards since they now live inside their respective hubs. Replace with cards that link to the hubs with the correct tab parameter (e.g., `/dashboard/admin/payroll?tab=hire`)

## Technical Details

### Payroll.tsx modifications
- Read `tab` from URL search params (like BoothRenters already does)
- Add `hire` tab value with the wizard content extracted from `NewHireWizard.tsx` (or import the wizard component directly and render it within the tab)
- Update page title and description

### BoothRenters.tsx modifications
- Add `onboarding` tab value
- Import and render `RenterOnboardWizard` content inline within the new tab
- The wizard's navigation (back/cancel) stays within the tab context

### Routing (App.tsx)
- Keep the old routes but add redirects to the new tab-based URLs so any existing links or bookmarks still work
- `/dashboard/admin/new-hire` redirects to `/dashboard/admin/payroll?tab=hire`
- `/dashboard/admin/onboard-renter` redirects to `/dashboard/admin/booth-renters?tab=onboarding`

### Files to modify
- `src/pages/dashboard/admin/Payroll.tsx` -- add Hire tab, rename title
- `src/pages/dashboard/admin/BoothRenters.tsx` -- add Onboarding tab
- `src/pages/dashboard/admin/NewHireWizard.tsx` -- extract wizard body into a reusable component, keep redirect wrapper
- `src/pages/dashboard/admin/RenterOnboardWizard.tsx` -- extract wizard body into a reusable component, keep redirect wrapper
- `src/App.tsx` -- update routes to redirect old paths
- `src/components/dashboard/HubQuickLinks.tsx` -- rename Payroll Hub label
- `src/pages/dashboard/admin/ManagementHub.tsx` -- update wizard cards to point to hub tabs
- Sidebar navigation file -- rename Payroll label


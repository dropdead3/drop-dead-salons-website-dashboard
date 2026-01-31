
# Trial Countdown Banner Implementation Plan

## Overview
Add a prominent trial countdown banner to the business owner dashboard that displays when their organization is in a trial period. The banner will show real-time countdown, escalate urgency as the trial nears expiration, and include a call-to-action to upgrade or add a payment method.

## Current State Analysis

### Existing Infrastructure
- **Database**: `trial_ends_at` field exists in both `organizations` and `organization_billing` tables
- **Backend Logic**: `trial-expiration` Edge Function handles automated emails and status transitions
- **Billing Hook**: `useBillingCalculations` already calculates `isInTrial` and `daysUntilTrialEnds`
- **Context**: `OrganizationContext` provides `effectiveOrganization` with organization data
- **LiveCountdown Component**: Existing component for real-time countdown (but designed for short durations)

### What's Missing
Business owners see **no visual indicator** of their trial status on their dashboard. They need:
- A global banner visible across the dashboard
- Real-time countdown (days/hours format for trials)
- Urgency escalation (color changes as trial nears end)
- Clear CTA to upgrade

## Implementation Details

### 1. Create Trial Status Hook
**File**: `src/hooks/useTrialStatus.ts`

A dedicated hook that combines organization and billing data to determine trial status:
- Fetches current organization from `OrganizationContext`
- Fetches billing data using `useOrganizationBilling`
- Uses `useBillingCalculations` to compute `isInTrial` and `daysUntilTrialEnds`
- Returns: `{ isInTrial, trialEndsAt, daysRemaining, urgencyLevel }`
- Urgency levels:
  - `normal`: 8+ days remaining (violet/purple theme)
  - `warning`: 3-7 days remaining (amber theme)
  - `critical`: 0-2 days remaining (red theme)

### 2. Create Trial Countdown Banner Component
**File**: `src/components/dashboard/TrialCountdownBanner.tsx`

A banner component following the existing pattern from `PlatformContextBanner` and `TodaysBirthdayBanner`:

**Features**:
- Full-width banner positioned at the top of the dashboard content area
- Gradient background that changes based on urgency level:
  - Normal: Purple/violet gradient (`from-violet-600/20 via-purple-600/20`)
  - Warning: Amber gradient (`from-amber-600/20 via-orange-600/20`)
  - Critical: Red gradient (`from-red-600/20 via-rose-600/20`)
- Left side: Sparkles icon + "Trial Period" label + countdown
- Right side: "Upgrade Now" CTA button
- Countdown displays:
  - 8+ days: "X days remaining"
  - 1-7 days: "X days, Y hours remaining"
  - <24 hours: Real-time countdown using modified `LiveCountdown` logic
- Optional dismiss functionality (dismissed state stored in localStorage, resets when urgency level increases)

**UI Elements**:
```
+------------------------------------------------------------------+
| [Sparkles] Trial Period - X days remaining      [Upgrade Now ->] |
+------------------------------------------------------------------+
```

### 3. Enhance LiveCountdown for Day-Level Countdowns
**File**: `src/components/dashboard/LiveCountdown.tsx`

Modify the existing component to handle longer durations:
- Add new prop `displayMode: 'compact' | 'full' | 'days'`
- `days` mode: Shows "X days, Y hours" for durations >24 hours
- Keep existing `compact` behavior for shorter durations
- Add urgency thresholds prop for customizable warning levels
- Export urgency calculation for reuse

### 4. Integrate Banner into Dashboard
**File**: `src/pages/dashboard/DashboardHome.tsx`

Add the `TrialCountdownBanner` component after the "Pending Approval" banner and before the "Birthday Banner":

```tsx
{/* Trial Countdown Banner - visible when organization is in trial */}
<TrialCountdownBanner />

{/* Today's Birthday Banner - visible to all */}
<TodaysBirthdayBanner />
```

The component will self-hide when not in trial (no conditional rendering needed at parent level).

### 5. Create Upgrade Modal/Page (Optional Enhancement)
**File**: `src/components/dashboard/UpgradeModal.tsx`

A dialog that opens when clicking "Upgrade Now":
- Shows current plan details
- Lists available plans from `useSubscriptionPlans`
- Redirects to payment setup or contacts admin
- For MVP: Simply navigate to a "Contact Us" or billing page

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useTrialStatus.ts` | Create | New hook for trial status logic |
| `src/components/dashboard/TrialCountdownBanner.tsx` | Create | New banner component |
| `src/components/dashboard/LiveCountdown.tsx` | Modify | Add `displayMode` prop for day-level countdowns |
| `src/pages/dashboard/DashboardHome.tsx` | Modify | Import and add `TrialCountdownBanner` |

## Technical Considerations

### Data Flow
```
OrganizationContext.effectiveOrganization
         ↓
useOrganizationBilling(organizationId)
         ↓
useBillingCalculations(billing, plan)
         ↓
{ isInTrial, daysUntilTrialEnds }
         ↓
TrialCountdownBanner (renders if isInTrial)
```

### Performance
- Uses existing React Query hooks (no new API calls)
- Countdown updates every minute for day-level, every second for <24 hours
- LocalStorage for dismiss state (minimal I/O)

### Edge Cases
- No billing record: Banner doesn't show
- `trial_ends_at` is null: Banner doesn't show
- User is platform admin viewing as org: Banner shows for that org's trial status
- Trial already expired: Banner shows "Trial Expired" with CTA to contact sales

## Urgency Escalation Logic

| Days Remaining | Theme | Animation | Update Frequency |
|---------------|-------|-----------|------------------|
| 8+ days | Violet | None | Every 10 minutes |
| 3-7 days | Amber | Subtle pulse | Every minute |
| 1-2 days | Red | Active pulse | Every minute |
| <24 hours | Red | Animated countdown | Every second |
| Expired | Red/Dark | Static "Expired" | N/A |

## Testing Checklist
- Banner appears when `subscription_status = 'trialing'`
- Banner hidden for active subscriptions
- Color transitions work at day thresholds
- Countdown updates correctly
- Dismiss works and respects urgency escalation
- CTA button navigates correctly
- Responsive design (mobile-friendly)
- Dark mode compatibility

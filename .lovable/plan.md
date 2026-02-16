

## Add Weekly Lever to Zura Business Insights (Role-Gated)

### What Changes

Embed the Weekly Lever (Executive Brief) directly inside the **Zura Business Insights** drawer and card on the dashboard home page. The lever section will only be visible to users with `super_admin` or account owner roles. All other users see the existing insights without the lever.

### Layout

The Weekly Lever will appear as a distinct section **above** the insights tabs inside the expanded drawer/card, creating a natural hierarchy: strategic lever first, then supporting insights below.

```text
+--------------------------------------------------+
|  ZURA BUSINESS INSIGHTS              [Refresh] [X]|
|                                                    |
|  [Sentiment summary + timestamp]                  |
|                                                    |
|  --- WEEKLY LEVER (super_admin only) ------------ |
|  [Lever recommendation or Silence State]          |
|  [Approve] [Modify] [Decline] [Snooze]            |
|  ------------------------------------------------ |
|                                                    |
|  [Key Insights] [Action Items] [More suggestions]  |
|  ... existing insight cards ...                    |
|                                                    |
|  Powered by Zura AI                               |
+--------------------------------------------------+
```

### Role Gating

- Uses `useEffectiveRoles()` from `src/hooks/useEffectiveUser.ts`
- Visible when roles include `super_admin` (account owners always have this role)
- Consistent with the existing pattern used throughout the app (e.g., `isCoach` checks)

### Technical Details

**Files to Modify:**

1. **`src/components/dashboard/AIInsightsDrawer.tsx`** (the expandable drawer on dashboard)
   - Import `useEffectiveRoles`, `useActiveRecommendation`, `WeeklyLeverBrief`, `SilenceState`, `EnforcementGateBanner`
   - Add a `isLeadership` check: `roles.includes('super_admin')`
   - Render the lever section between the sentiment summary and the tabs, wrapped in a conditional
   - Styled with a subtle top/bottom border separator to visually distinguish it from insights
   - Loading state uses the existing `Loader2` spinner pattern

2. **`src/components/dashboard/AIInsightsCard.tsx`** (the pinnable card variant)
   - Same integration: import lever hooks and components
   - Add lever section between the sentiment summary and the section headers
   - Same role gate with `useEffectiveRoles()`

### What Stays the Same

- The lever components (`WeeklyLeverBrief`, `SilenceState`, `EnforcementGateBanner`) are reused unchanged
- The `useActiveRecommendation` hook handles all data fetching
- No "Generate New" button here (that stays on the Analytics leadership tab) -- this is a read/act surface only
- No database changes needed
- The lever also remains on the Analytics Hub leadership tab as the full management surface


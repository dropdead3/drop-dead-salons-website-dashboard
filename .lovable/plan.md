

## Remove All Card Shadows Across the Dashboard

### Problem

Cards throughout the dashboard have visible shadows from multiple sources:
1. The base `Card` component (`src/components/ui/card.tsx` line 31) applies `shadow-sm` to every card globally
2. The design token `tokens.card.wrapper` adds `shadow-2xl` on top
3. Many cards also add `shadow-2xl`, `shadow-md`, or `shadow-lg` directly in their className

This creates a heavy, inconsistent look -- especially visible in light mode on the Goal Tracker, My Tasks, and widget cards.

### Solution

Remove shadows at every layer:

**1. Base Card component -- remove default shadow**

File: `src/components/ui/card.tsx`
- Change `"rounded-xl border bg-card text-card-foreground shadow-sm"` to `"rounded-xl border bg-card text-card-foreground"`

This is the single most impactful change -- it eliminates shadows from every card in the app at once.

**2. Design tokens -- remove shadow from card wrapper**

File: `src/lib/design-tokens.ts`
- `card.wrapper`: from `'rounded-2xl shadow-2xl'` to `'rounded-2xl'`
- `layout.cardBase`: from `'rounded-2xl shadow-2xl'` to `'rounded-2xl'`

**3. Inline shadow classes on dashboard cards**

Remove `shadow-2xl` from all dashboard card components that add it explicitly:

| File | Current | After |
|------|---------|-------|
| `WeeklyLeverSection.tsx` | `rounded-2xl shadow-2xl` | `rounded-2xl` |
| `AIInsightsCard.tsx` (2 instances) | `rounded-2xl shadow-2xl` | `rounded-2xl` |
| `AIInsightsSection.tsx` (2 instances) | `rounded-2xl shadow-2xl` | `rounded-2xl` |
| `SilenceState.tsx` (2 instances) | `rounded-2xl shadow-2xl` | `rounded-2xl` |
| `WeeklyLeverBrief.tsx` | `rounded-2xl shadow-2xl` | `rounded-2xl` |
| `PayrollDeadlineCard.tsx` (2 instances) | `shadow-md` | remove shadow class |
| `CampaignsTabContent.tsx` | `rounded-2xl shadow-md` | `rounded-2xl` |
| `PaydayCountdownBanner.tsx` | `shadow-md` references | remove shadow class |

**4. Non-dashboard shadows are left alone**

These are intentional and contextually appropriate:
- Dialogs/modals (`MissedDayDialog`, `UsePassConfirmDialog`) -- overlays need depth
- Tooltips and popovers (Recharts tooltips, dropdowns) -- floating UI needs shadow
- Drag-and-drop overlay states (`isDragging && 'shadow-lg'`) -- visual feedback
- QR code display (`QRCodeFullScreen`) -- presentation context
- Login pages (`PlatformLogin`, `UnifiedLogin`) -- standalone pages, not dashboard cards
- Sticky navigation elements (`StickyBookButton`, `ZuraReturnPill`) -- floating UI
- Hover-only shadows (`hover:shadow-md`) on interactive list items -- these are interactive feedback, not resting shadows

### Technical Details

- ~15 files modified (class string replacements only)
- No logic, layout, or functionality changes
- The base Card component change handles the majority of cards automatically
- Token update ensures all future cards using `tokens.card.wrapper` are shadow-free
- Dark mode unaffected (shadows were equally unwanted there)



# Font-Weight Cleanup (Remaining ~130 files) + Design Token System

## Part 1: Remaining Font-Weight Violations

~1,400 instances of `font-bold` and `font-semibold` remain across ~130 files. These will be replaced using the same rules as the previous batch:

| Current | Replacement |
|---|---|
| `font-bold` | `font-medium` |
| `font-semibold` | `font-medium` |
| `font-bold` on page headings | `font-display font-medium` |
| `font-serif font-bold` | Keep as-is (Laguna supports bold) |

### Files by area (all remaining)

**Dashboard components (~65 files):**
- Schedule: `CheckoutSummarySheet`, `AgendaView`, `ScheduleActionBar`, `QuickBookingPopover`, `MonthView`, and remaining booking/calendar files
- Analytics: `ExecutiveTrendChart`, `CorrelationMatrix`, `RentRevenueAnalytics`, remaining chart components
- Payroll: `ReviewStep`, `PayrollProviderSelector`, remaining step files
- Booth Renters: `PaymentsTabContent`, `StationAssignmentManager`, `CommissionStatementDialog`
- Settings: `ScheduleSettingsContent`, `AddLocationSeatsDialog`
- Reports: `SalesReportGenerator`, `ReportBuilderPage`
- Email: `EmailTemplatesManager`
- Misc: `ChangelogTimeline`, `MobileChangelogViewer`, `AssistantRequestsCalendar`, `HighFiveButton`, `GuidancePanel`, `ZuraStickyGuidance`, `RequestAssistantDialog`, `WalkInDialog`

**Pages (~28 files):**
- `RenterPayRent`, `RenterTaxDocuments`, `DashboardBuild`, `DemoFeatures`, `Changelog`, `TeamDirectory`, `Transactions`, `DesignSystem`, and all remaining page-level files

**Other components (~37 files):**
- `src/components/home/ServicesPreview`
- `src/components/demo/DemoChat`
- `src/components/huddle/AIHuddleGenerator`
- `src/components/day-rate/AgreementStep`
- `src/components/features/`, `src/components/auth/`, `src/components/coaching/`, `src/components/achievements/`, `src/components/executive-brief/`, `src/components/client-portal/`, `src/components/scheduling/`

---

## Part 2: Design Token System (Tokenization for Cohesion)

Currently, design rules live as documentation (`design-rules.ts`, `.cursor/rules/`) but are not consumable by components. New components are created with inconsistent class strings because there is no single source of truth to import.

### New file: `src/lib/design-tokens.ts`

A set of exportable, composable class-string constants that encode the full design system so every new component stays cohesive automatically.

```text
Tokens to define:

TYPOGRAPHY TOKENS
  heading.page      -> "font-display text-2xl font-medium tracking-wide"
  heading.section   -> "font-display text-base font-medium tracking-wide uppercase"
  heading.card      -> "font-display text-base font-medium tracking-wide"
  heading.subsection -> "text-xs font-medium text-muted-foreground uppercase tracking-[0.15em]"
  body.default      -> "font-sans text-sm text-foreground"
  body.muted        -> "font-sans text-sm text-muted-foreground"
  body.emphasis     -> "font-sans text-sm font-medium text-foreground"
  label.default     -> "font-sans text-sm font-medium"
  label.tiny        -> "font-sans text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
  stat.large        -> "font-display text-2xl font-medium"
  stat.xlarge       -> "font-display text-3xl font-medium"

LAYOUT TOKENS
  page.container    -> "px-6 lg:px-8 py-8 max-w-[1600px] mx-auto"
  card.base         -> "rounded-2xl shadow-2xl"
  card.padding      -> "p-6"

STATUS TOKENS
  status.booked     -> "bg-slate-100 text-slate-700"
  status.confirmed  -> "bg-green-100 text-green-800"
  status.checked_in -> "bg-blue-100 text-blue-800"
  status.completed  -> "bg-purple-100 text-purple-800"
  status.cancelled  -> "bg-gray-100 text-gray-600"
  status.no_show    -> "bg-red-100 text-red-800"

EMPTY STATE TOKENS
  empty.container   -> "text-center py-14"
  empty.icon        -> "w-12 h-12 mx-auto mb-4 opacity-20"
  empty.heading     -> "font-medium text-lg mb-2"
  empty.description -> "text-sm text-muted-foreground"

LOADING TOKENS
  loading.spinner   -> "h-8 w-8 animate-spin text-muted-foreground"
  loading.skeleton  -> "h-14 w-full"
```

### Usage pattern

```text
import { tokens } from '@/lib/design-tokens';

// Before (inconsistent, error-prone):
<h1 className="text-2xl font-bold">Revenue</h1>
<p className="text-2xl font-semibold">$12,400</p>

// After (tokenized, cohesive):
<h1 className={tokens.heading.page}>Revenue</h1>
<p className={tokens.stat.large}>$12,400</p>
```

Components can still use `cn()` to layer on conditional classes:

```text
<h3 className={cn(tokens.heading.card, isActive && 'text-primary')}>
```

### Update `design-rules.ts`

Expand `design-rules.ts` to re-export from `design-tokens.ts` and add a `getTokenFor(context)` helper that maps common scenarios to the correct token, making it discoverable for new component creation.

### Update `.cursor/rules/design-system.mdc`

Add a section documenting the token import pattern so AI-assisted code generation always uses tokens instead of raw class strings.

---

## Execution Order

1. Create `src/lib/design-tokens.ts` with all token constants
2. Update `src/lib/design-rules.ts` to reference tokens
3. Update `.cursor/rules/design-system.mdc` with token usage docs
4. Batch-replace all remaining `font-bold`/`font-semibold` instances across ~130 files (replacing with `font-medium` or the appropriate token where practical)
5. Final verification search to confirm zero remaining violations (excluding `font-serif` exceptions and string literals like documentation text)

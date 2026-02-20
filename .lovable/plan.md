
## Design Token Compliance -- Meetings & Accountability Page

### Current Issues Found

| # | Violation | Location | Fix |
|---|-----------|----------|-----|
| 1 | **Page title uses raw `font-display text-3xl lg:text-4xl`** | Line 221 | Use `tokens.heading.page` |
| 2 | **Page subtitle uses raw `text-muted-foreground`** | Line 222 | Use `tokens.body.muted` |
| 3 | **StatCard value uses raw `text-2xl font-display font-medium`** | Line 42 | Use `tokens.kpi.value` |
| 4 | **StatCard label uses raw `text-xs text-muted-foreground`** | Line 43 | Use `tokens.body.muted` with `text-xs` override |
| 5 | **StatCard icon box uses raw classes** | Line 38 | Use `tokens.card.iconBox` |
| 6 | **Card headers missing `tokens.card.title`** on CardTitle (lines 289, 344, 390) | 3 locations | Replace raw `font-display text-base tracking-wide` with `tokens.card.title` |
| 7 | **Card icon boxes use raw `w-10 h-10 bg-muted flex...`** | Lines 285, 340, 386 | Use `tokens.card.iconBox` |
| 8 | **Meeting row names use raw `font-medium text-sm`** | Lines 301, 355, 403 | Use `tokens.body.emphasis` |
| 9 | **Raw empty state text** in 3 cards (lines 321, 370, 427) | 3 locations | Replace with `EmptyState` component |
| 10 | **"View All" buttons use raw `text-muted-foreground hover:text-foreground`** | Lines 326, 375, 432 | Standardize styling |

### Technical Details

**File: `src/pages/dashboard/ScheduleMeeting.tsx`** (single file, all changes)

1. **Add imports**: `tokens` from `@/lib/design-tokens`, `EmptyState` from `@/components/ui/empty-state`

2. **Page header** (lines 221-224):
   - Title: `<h1 className={tokens.heading.page}>` (replaces raw font-display classes)
   - Subtitle: `<p className={tokens.body.muted}>` (replaces raw text-muted-foreground)

3. **StatCard component** (lines 34-48):
   - Icon container: use `tokens.card.iconBox` with color override via `cn()`
   - Value: `tokens.kpi.value`
   - Label: `cn(tokens.body.muted, "text-xs")`

4. **Three CardHeader blocks** (Upcoming Meetings, Pending Requests, Active Commitments):
   - Icon boxes: `tokens.card.iconBox`
   - CardTitle: `tokens.card.title`

5. **Meeting/request/commitment row text**:
   - Name/date spans with `font-medium text-sm` become `tokens.body.emphasis`
   - Secondary text already using `text-xs text-muted-foreground` is acceptable but gets `tokens.body.muted` with size override

6. **Three empty states** replaced with `<EmptyState>` component:
   - "No upcoming meetings scheduled" with Calendar icon
   - "No pending requests" with Inbox icon
   - "No active commitments" with ClipboardList icon

No database, routing, or structural changes. Pure design-token compliance pass.

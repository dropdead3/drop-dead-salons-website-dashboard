

## Fix Sub-Label and Empty State Typography Inconsistencies

### Audit Results

| Element | Changelog | Birthday | Anniversary | Schedule | Day Rate | Help Center | AI Tasks |
|---------|-----------|----------|-------------|----------|----------|-------------|----------|
| Empty state text | text-sm | text-xs | text-xs | text-xs | text-sm | text-sm | text-xs |
| Empty state padding | py-4 | py-2 | py-2 | none | py-4 | py-4 | py-2 |
| Section sub-label | text-xs | text-[10px] | text-[10px] | text-[10px] | text-xs font-medium | n/a | n/a |

### Standardization Rules

**Empty states**: All use `text-sm text-muted-foreground text-center py-4` (the larger, more spacious treatment seen in Changelog/Day Rate/Help Center). This feels more premium and less cramped.

**Section sub-labels** (e.g., "Coming Up", "Today's Bookings"): All use `text-xs text-muted-foreground uppercase tracking-wide` (no font-medium, consistent with the calm label treatment). Currently a mix of text-[10px] and text-xs.

**Content body text** (names, descriptions): Standardize to `text-sm` for primary content lines.

**Help Center empty icon**: Reduce from `h-8 w-8` to `h-6 w-6` to avoid feeling oversized relative to other widgets.

### Changes Per File

**1. `src/components/dashboard/BirthdayWidget.tsx`**
- Line 90: Change `text-[10px]` to `text-xs` on "Coming Up" label
- Line 129: Change `text-xs` to `text-sm` and `py-2` to `py-4` on empty state

**2. `src/components/dashboard/AnniversaryWidget.tsx`**
- Line 107: Change `text-[10px]` to `text-xs` on "Coming Up" label
- Line 159: Change `text-xs` to `text-sm` and `py-2` to `py-4` on empty state

**3. `src/components/dashboard/WorkScheduleWidgetCompact.tsx`**
- Line 35: Change `text-xs` to `text-sm` on "No locations assigned" empty state
- Line 84: Change `text-[10px]` to `text-xs` on "X days per week" label

**4. `src/components/dashboard/DayRateWidget.tsx`**
- Line 105: Remove `font-medium` from "Today's Bookings" sub-label (keep `text-xs`)
- Already correct on empty state (text-sm py-4)

**5. `src/components/dashboard/HelpCenterWidget.tsx`**
- Line 57: Change empty icon from `h-8 w-8` to `h-6 w-6`

**6. `src/components/dashboard/AITasksWidget.tsx`**
- Line 27: Change `text-xs` to `text-sm` and `py-2` to `py-4` on empty state

**7. `src/components/dashboard/ChangelogWidget.tsx`**
- Already correct (text-sm py-4 on empty state, text-xs on sub-label)

### What This Achieves
- Every widget empty state renders identically: centered, `text-sm`, generous `py-4` spacing
- Every section sub-label renders identically: `text-xs uppercase tracking-wide`
- No more visual jitter between widgets when content is absent

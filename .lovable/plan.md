

## Standardize All Dashboard Widgets to Tokenized Design System

### The Problem
All 7 dashboard widgets use different header structures, icon sizes, icon colors, title typography, and card wrappers. Only **AITasksWidget** correctly uses the design token system. The other 6 widgets each have their own ad-hoc styling.

### Current State (Inconsistencies)

| Widget | Icon Style | Title Style | Card Wrapper |
|--------|-----------|-------------|-------------|
| AI Tasks | `tokens.card.iconBox` + `tokens.card.icon` (correct) | `tokens.card.title` (correct) | `tokens.card.wrapper` (correct) |
| Birthdays | Raw `w-4 h-4 text-pink-500` | `font-display text-xs` | `p-4 min-w-[200px]` |
| Anniversaries | Raw `w-4 h-4 text-amber-500` | `font-display text-xs` | `p-4 min-w-[200px]` |
| My Schedule | Raw `w-4 h-4 text-blue-500` | `font-display text-xs` | `p-4 min-w-[200px]` |
| Day Rate | Raw `w-5 h-5 text-primary` | `font-display text-sm` | `p-4 space-y-4` |
| What's New | Inline `h-4 w-4 text-primary`, CardHeader | `text-sm font-medium` (not Termina uppercase) | CardHeader/CardContent |
| Help Center | Inline `h-4 w-4 text-muted-foreground`, CardHeader | `text-base font-medium` (not uppercase) | CardHeader/CardContent |

### Target State (All Widgets)
Every widget will follow the same tokenized header pattern:

```text
+------------------------------------------------------+
| [Icon Box 10x10] WIDGET TITLE          [Action Link] |
|                  Subtitle (optional)                  |
|                                                       |
|  [Content area]                                       |
+------------------------------------------------------+
```

### Standardized Header Pattern
```tsx
<Card className={cn("p-4", tokens.card.wrapper)}>
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3">
      <div className={tokens.card.iconBox}>
        <Icon className={tokens.card.icon} />
      </div>
      <h3 className={tokens.card.title}>WIDGET TITLE</h3>
    </div>
    {/* Optional: action link */}
  </div>
  {/* Content */}
</Card>
```

### Files to Modify (6 widgets)

**1. `src/components/dashboard/BirthdayWidget.tsx`**
- Replace raw `Cake` icon (`w-4 h-4 text-pink-500`) with `tokens.card.iconBox` + `tokens.card.icon`
- Replace title class `font-display text-xs tracking-wide` with `tokens.card.title`
- Add `tokens.card.wrapper` to Card
- Import `tokens` from design-tokens

**2. `src/components/dashboard/AnniversaryWidget.tsx`**
- Replace raw `Award` icon (`w-4 h-4 text-amber-500`) with `tokens.card.iconBox` + `tokens.card.icon`
- Replace title class with `tokens.card.title`
- Add `tokens.card.wrapper` to Card
- Import `tokens`

**3. `src/components/dashboard/WorkScheduleWidgetCompact.tsx`**
- Replace raw `Calendar` icon (`w-4 h-4 text-blue-500`) with `tokens.card.iconBox` + `tokens.card.icon`
- Replace title class with `tokens.card.title`
- Add `tokens.card.wrapper` to Card
- Import `tokens`

**4. `src/components/dashboard/DayRateWidget.tsx`**
- Replace raw `Armchair` icon (`w-5 h-5 text-primary`) with `tokens.card.iconBox` + `tokens.card.icon`
- Replace title class `font-display text-sm tracking-wide` with `tokens.card.title`
- Add `tokens.card.wrapper` to Card
- Replace stat icon containers (`w-8 h-8 rounded-full bg-primary/10`) with muted token-consistent styling
- Import `tokens`

**5. `src/components/dashboard/ChangelogWidget.tsx`**
- Replace `CardHeader`/`CardTitle` structure with flat `p-4` + tokenized header row
- Move `Sparkles` icon into `tokens.card.iconBox` container
- Title becomes uppercase `WHAT'S NEW` using `tokens.card.title`
- Unread badge stays in the right column
- Import `tokens`

**6. `src/components/dashboard/HelpCenterWidget.tsx`**
- Replace `CardHeader`/`CardTitle` structure with flat `p-4` + tokenized header row
- Move `HelpCircle` icon into `tokens.card.iconBox` container
- Title becomes uppercase `HELP CENTER` using `tokens.card.title`
- "View All" link stays in the right column
- Import `tokens`

### What Does NOT Change
- All internal widget content (birthday lists, schedule badges, day rate stats, etc.) stays the same
- The `AITasksWidget` is already correct and is not modified
- The `WidgetsSection.tsx` grid layout is unchanged
- No new tokens or components are created


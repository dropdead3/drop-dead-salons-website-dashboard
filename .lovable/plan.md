

## Fix Design System Violations in Assistant Schedule

### Violations and Fixes

| # | Violation | Location | Fix |
|---|-----------|----------|-----|
| 1 | `font-semibold` (BANNED, weight 600) | Summary strip lines 630, 636, 642, 648 | Replace with `font-medium` |
| 2 | Page title raw classes | Line 490 | Use `tokens.heading.page` |
| 3 | Card headers missing canonical layout | Lines 657, 686, 713, 781, 818 | Add icon-box + title per `CARD_HEADER_DESIGN_RULES.md` |
| 4 | `<strong>` tag renders bold (700) | Line 211 | Replace with `<span className={tokens.body.emphasis}>` |
| 5 | StatCard label missing Termina | Line 70 | Use `tokens.kpi.label` for the title span |
| 6 | Raw loading states | Lines 592, 786, 822 | Use `tokens.loading.spinner` with Loader2 |
| 7 | Plain-text empty state | Line 788 | Replace with `<EmptyState>` component |
| 8 | Hardcoded status badge colors | Lines 92-103, 160-165 | Import and use `APPOINTMENT_STATUS_BADGE` from design-tokens |
| 9 | Raw `font-medium` on assistant name | Line 732 | Use `tokens.body.emphasis` |

### Technical Details

**File: `src/pages/dashboard/AssistantSchedule.tsx`**

1. Add import for `tokens` from `@/lib/design-tokens` and `Loader2` from `lucide-react`

2. **Summary strip** -- Replace all four `font-semibold` with `font-medium`:
```tsx
<span className="font-medium text-foreground">{stats.total}</span>
```

3. **Page title** -- Replace raw classes with token:
```tsx
<h1 className={tokens.heading.page}>Assistant Schedule</h1>
```

4. **StatCard label** -- Switch to `tokens.kpi.label` (ensures Termina font for KPI labels):
```tsx
<span className={tokens.kpi.label}>{title}</span>
```

5. **Card headers** -- Apply canonical layout with icon-box to each card (Recent Requests, Needs Attention, Active Assistants, All Requests). Example:
```tsx
<CardHeader>
  <div className="flex items-center gap-3">
    <div className={tokens.card.iconBox}>
      <Inbox className={tokens.card.icon} />
    </div>
    <div>
      <CardTitle className={tokens.card.title}>RECENT REQUESTS</CardTitle>
      <CardDescription>Latest assistant request activity</CardDescription>
    </div>
  </div>
</CardHeader>
```

6. **`<strong>` tag** -- Replace with emphasis token:
```tsx
<span className={tokens.body.emphasis}>{request.client_name}</span>
```

7. **Loading states** -- Replace raw text with spinner:
```tsx
<div className="flex items-center justify-center h-64">
  <Loader2 className={tokens.loading.spinner} />
</div>
```

8. **Plain empty state (line 788)** -- Replace with component:
```tsx
<EmptyState icon={Inbox} title="No requests yet" description="..." />
```

9. **Status badge colors** -- Replace local `statusColors` maps with `APPOINTMENT_STATUS_BADGE` import from design-tokens. Map assistant request statuses (pending, assigned, completed, cancelled) to the closest canonical token equivalents.

10. **Assistant name** -- Use body emphasis token:
```tsx
<h4 className={tokens.body.emphasis}>{assistant.display_name || assistant.full_name}</h4>
```

### Scope

| File | Changes |
|------|---------|
| `src/pages/dashboard/AssistantSchedule.tsx` | All 9 fixes above -- typography, tokens, card headers, loading/empty states, status colors |

No database or routing changes needed. This is a pure design-token compliance pass.


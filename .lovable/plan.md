

## Add Bottom Footnote: "Daily Operating Average only counts days open"

### What's Changing

Add a subtle footnote line at the very bottom of both forecasting cards (after the Peak Day callout, before the card closes) that reads:

> *Daily Operating Average only counts days open*

This gives persistent clarity without requiring hover or interaction.

### Visual Placement

```text
+-----------------------------------------------+
| FORECASTING                                    |
| [stat cards]                                   |
| [chart]                                        |
| Peak day: Wednesday, Feb 18         $3,703.00  |
|                                                |
| * Daily Operating Average only counts days open|
+-----------------------------------------------+
```

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/dashboard/sales/WeekAheadForecast.tsx` | Add footnote text after the Peak Day callout, just before `</CardContent>` (~line 616) |
| `src/components/dashboard/sales/ForecastingCard.tsx` | Add footnote text after the Peak Day/Week callout, just before `</CardContent>` (~line 1047) |

The footnote will be styled as:
- `text-[11px] text-muted-foreground/40 italic pt-2` -- small, muted, italic, with a little top spacing
- Prefixed with `*` to match the user's formatting preference
- Only shown when the period uses operating-day logic (7 Days, EOM periods -- not Tomorrow)

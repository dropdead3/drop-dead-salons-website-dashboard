

## Beautify the Capacity Utilization Card

### Analysis of Current State

The card is functional but has several visual gaps compared to the project's luxury design standards:

1. **Progress bar** uses the default thin Progress component with harsh red -- feels clinical, not premium
2. **Summary stat tiles** (Unused Hours, Gap Revenue, Appointments) use plain `bg-muted/30` boxes with small icons -- lack the refined glass treatment seen elsewhere
3. **Daily utilization bars** are solid flat fills with no gradient or glass treatment -- inconsistent with the forecasting card's luxury glass bars
4. **Service Mix section** has a minimal donut chart that feels cramped (120px height, 45px radius)
5. **Opportunity callout** uses `bg-warning/10` with an emoji -- does not match the calm, advisory tone of the design system
6. **Section dividers** are basic `border-t` -- could use the gradient fade treatment seen in the top bar
7. **Bar chart labels** and typography don't fully leverage the design token system

### Planned Enhancements

**File:** `src/components/dashboard/sales/CapacityUtilizationCard.tsx`

#### 1. Refined Progress Bar
- Increase height from `h-3` to `h-2.5` with rounded-full for a sleeker profile
- Add a subtle background track styling with `bg-muted/50`
- Use warm, softer utilization colors (muted-foreground tones for low utilization instead of harsh red)

#### 2. Elevated Summary Stat Tiles
- Replace `bg-muted/30` with `bg-card border border-border/40 rounded-xl` for a subtle card-within-card glass effect
- Increase padding from `p-3` to `p-4`
- Bump stat values from `text-lg` to `text-xl` for more presence
- Place icons inside a `w-8 h-8 rounded-lg bg-muted` container (matching the card header icon box pattern)

#### 3. Luxury Glass Utilization Bars
- Add SVG `<defs>` with a vertical linear gradient using `hsl(var(--muted-foreground))` at 0.45/0.18 opacity (matching the forecasting card treatment)
- Add a glass stroke outline (1px, foreground at 0.12 opacity)
- Increase bar border radius from `[4,4,0,0]` to `[6,6,0,0]`

#### 4. Enhanced Service Mix Section
- Replace plain `border-t` divider with a gradient fade line (`bg-gradient-to-r from-transparent via-border/40 to-transparent`)
- Increase donut chart height from 120px to 140px, inner/outer radius from 25/45 to 30/52
- Add subtle spacing between legend items

#### 5. Refined Opportunity Callout
- Replace `bg-warning/10` with `bg-muted/40 border border-border/40` for a calmer, advisory tone
- Remove emoji from peak day text
- Use `text-foreground` for the heading instead of `text-warning` -- keep it calm and confident
- Softer icon color

#### 6. Section Divider Upgrades
- Replace `border-t border-border/50` with a 1px gradient line: `h-px bg-gradient-to-r from-transparent via-border/40 to-transparent`

**File:** `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`

Same improvements applied to the Analytics Hub version for consistency:
- Same stat tile elevation
- Same gradient bar treatment
- Same donut chart sizing
- Same callout refinement
- Same divider treatment

### Technical Summary

| Element | Before | After |
|---------|--------|-------|
| Stat tiles | `bg-muted/30 p-3 rounded-lg` | `bg-card border border-border/40 p-4 rounded-xl` |
| Stat values | `text-lg` | `text-xl` |
| Stat icons | Bare 4x4 icon | `w-8 h-8 bg-muted rounded-lg` container |
| Bar chart | Flat solid fills | SVG gradient (muted-foreground 0.45 to 0.18) + glass stroke |
| Bar radius | `[4,4,0,0]` | `[6,6,0,0]` |
| Donut chart | 120px / radius 25-45 | 140px / radius 30-52 |
| Section divider | `border-t border-border/50` | Gradient fade line |
| Opportunity callout | `bg-warning/10` + emoji | `bg-muted/40 border-border/40` advisory tone |
| Progress track | `h-3` | `h-2.5` with `bg-muted/50` track |


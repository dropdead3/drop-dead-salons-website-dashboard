

## Fix KPI Tile Typography and Establish Token Rule

### Problem
The KPI summary tiles use `font-sans` (Aeonik Pro) for labels like "TOTAL VISITS", "RETURNING %". Per design rules, uppercase metric labels in dashboard tiles should use Termina (`font-display`) for consistency with the rest of the analytics system.

### Changes

#### 1. Add KPI tile tokens to the design token system

**File:** `src/lib/design-tokens.ts`

Add a new `kpi` token group:
- `kpi.tile` -- tile container classes (rounded-xl, border, bg-card, padding)
- `kpi.label` -- Termina, 11px, uppercase, tracked, muted (replaces raw classes on line 100 of StaffKPISummary)
- `kpi.value` -- font-display text-xl font-medium (already used but now tokenized)
- `kpi.change` -- 10px font-medium for trend badges

Also add `kpi-label`, `kpi-value` to the `getTokenFor` helper.

#### 2. Apply tokens to StaffKPISummary

**File:** `src/components/dashboard/sales/StaffKPISummary.tsx`

- Replace the label `span` classes (line 100) with `tokens.kpi.label`
- Replace the value `span` classes (line 105) with `tokens.kpi.value`
- Replace the tile container classes (line 94) with `tokens.kpi.tile`
- Replace the skeleton tile classes (line 39) with `tokens.kpi.tile`

#### 3. Update design rules documentation

**File:** `src/lib/design-rules.ts`

Add a note in `EMPHASIS_ALTERNATIVES` that KPI tile labels must use `tokens.kpi.label` (Termina, not Aeonik).

### Technical Detail

The key fix is changing the label from:
```
text-[11px] font-medium text-muted-foreground uppercase tracking-wider
```
to:
```
font-display text-[11px] font-medium text-muted-foreground uppercase tracking-wider
```

This ensures Termina renders for the label text, matching the stat values and the rest of the analytics system. Tokenizing it prevents future drift.


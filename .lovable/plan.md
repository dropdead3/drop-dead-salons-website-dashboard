

## Fix Table Column Headers: Title Case with Aeonik Pro

### The Problem

Table column headers across the dashboard are rendering in ALL CAPS using Aeonik Pro (font-sans). The screenshot shows "STYLIST", "LEVEL", "SVC %", "RETAIL %", "SOURCE" -- all uppercase. Per the design system, font-sans (Aeonik Pro) should NEVER be uppercase. Only font-display (Termina) gets uppercase treatment.

Column headers should use Aeonik Pro with standard Title Case capitalization: "Stylist", "Level", "Svc %", "Retail %", "Source".

### Root Cause

Two separate patterns cause this:

1. **TeamCommissionRoster.tsx** (line 195): Uses a custom grid header row with explicit `uppercase` class
2. **CommissionIntelligence.tsx** and other tables: Use `TableHead` component -- no uppercase in the component, but some render content in caps

### Plan

**1. Add a `table.columnHeader` token to `design-tokens.ts`**

A new token that encodes the correct column header style: Aeonik Pro, small text, medium weight, muted color, wider tracking -- but NO uppercase.

```
table: {
  columnHeader: 'font-sans text-[11px] font-medium text-muted-foreground tracking-wider',
}
```

**2. Fix `TeamCommissionRoster.tsx`**

Remove `uppercase` from the custom grid header row (line 195) and apply the new `tokens.table.columnHeader` token. Change text content to Title Case:
- "Stylist", "Level", "Svc %", "Retail %", "Source"

**3. Audit `CommissionIntelligence.tsx`**

Verify the `TableHead` content uses Title Case (it likely already does since it uses natural text). No changes expected.

**4. Update `design-rules.ts`**

Add a rule documenting that table column headers must use font-sans (Aeonik Pro) with Title Case -- never uppercase.

**5. Update design system rule files**

Add the table column header rule to `.cursor/rules/design-system.mdc` so future generation follows this pattern.

### Files Changed

| File | Change |
|------|--------|
| `src/lib/design-tokens.ts` | Add `table.columnHeader` token |
| `src/components/dashboard/settings/TeamCommissionRoster.tsx` | Remove `uppercase`, apply token, Title Case text |
| `src/lib/design-rules.ts` | Add column header rule |
| `.cursor/rules/design-system.mdc` | Document table column header standard |

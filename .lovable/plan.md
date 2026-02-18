

## Fix: KPI Tile Headers Missing `font-display` (Termina)

The four KPI stat cards at the top of the Services tab render their labels ("SERVICE REVENUE", "ACTIVE SERVICES", "AVG SERVICE TICKET", "REV / CHAIR HOUR") in Aeonik Pro (body font) instead of Termina (display font).

Per the design system, uppercase tracked headings in card headers must use `font-display`.

### Change

**File:** `src/components/dashboard/analytics/ServicesContent.tsx`
**Line 100** -- KpiTile label class

Current:
```
text-xs font-medium text-muted-foreground uppercase tracking-wider
```

Updated:
```
text-xs font-display font-medium text-muted-foreground uppercase tracking-wider
```

This adds `font-display` so the labels render in Termina with proper tracking, matching every other card header in the analytics suite (Service Category Mix, Rebooking Rates, Bundling Intelligence, etc.).

One line change, no other files affected.


# Analytics Card Header Design Rules

## Canonical Layout

Every analytics card in the dashboard **must** follow this header structure:

```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    {/* LEFT: Icon + Title + Description */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <CardTitle className="font-display text-base tracking-wide">
            CARD TITLE
          </CardTitle>
          <MetricInfoTooltip description="..." />
        </div>
        <CardDescription>Subtitle text</CardDescription>
      </div>
    </div>

    {/* RIGHT: Filters, badges, toggles */}
    <div className="flex items-center gap-2">
      <AnalyticsFilterBadge locationId={...} dateRange={...} />
      {/* Optional: stat badges, view toggles */}
    </div>
  </div>
</CardHeader>
```

## Rules

### 1. Two-Column Header (`justify-between`)
- **Left column**: Icon container → Title block (title + description stacked)
- **Right column**: Filter badge, stat badges, and any view toggles
- Never stack filters/badges below the title in a separate row

### 2. Icon Container
- Always `w-10 h-10 bg-muted rounded-lg` with `w-5 h-5 text-primary` icon
- Source: `design-tokens.ts` → `card.iconContainer` / `card.icon`

### 3. Title Typography
- `font-display text-base tracking-wide` (Termina, uppercase)
- `MetricInfoTooltip` immediately after the title, inside the same flex row
- Font weight capped at `font-medium` (500) — no bold

### 4. Filter Badge Placement
- `<AnalyticsFilterBadge>` always goes in the **right column**
- If the card also has view toggles (e.g., "New Clients" / "Retention"), they sit adjacent to the filter badge in the same right-column flex container

### 5. Stat Badges
- Count badges (`Badge variant="outline"`) and revenue badges (`Badge variant="secondary"`) go in the **right column**, after the filter badge
- On narrow viewports they wrap naturally via `flex-wrap`

### 6. Sort / View Toggles Inside CardContent
- `FilterTabsList` / `FilterTabsTrigger` toggles (e.g., "By Revenue" / "By Frequency") belong **inside `<CardContent>`**, not in the header
- Add `className="mb-4"` to `FilterTabsList` for spacing above the chart

### 7. Sub-Cards (e.g., Bundling Intelligence)
- When a section renders multiple sub-cards inside a wrapper, only the **first** sub-card needs the `AnalyticsFilterBadge`
- Subsequent sub-cards within the same section can omit the filter badge to reduce visual noise

## Anti-Patterns (Do Not)

❌ Stack badges/filters in a `space-y-2` block below the title  
❌ Put `AnalyticsFilterBadge` inside the left column with the title  
❌ Use `font-bold` or `font-semibold` on card titles  
❌ Place sort toggles (`FilterTabsList`) inside `CardHeader`  
❌ Use different icon container sizes across cards  
❌ Omit `MetricInfoTooltip` from card titles  

## Reference Cards (Correct Implementation)

- `ServicesContent.tsx` → `efficiency_matrix`, `rebook_rates`, `price_realization`, `demand_trends`, `category_mix`, `client_type`
- `RevPerHourByCategoryChart.tsx`
- `ServicePopularityChart.tsx` (combined Service + Category card)

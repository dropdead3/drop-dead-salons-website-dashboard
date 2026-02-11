

## Remove Internal Pin Icons and Apply Inline Hover Footer Pattern Everywhere

### Problem
Many analytics cards still have the `CommandCenterVisibilityToggle` (pin icon) embedded directly in their card headers. This is inconsistent with the new inline hover footer pattern established in `PinnableCard`, and some cards that are already wrapped in `PinnableCard` have **duplicate** pin controls.

### Strategy
Two types of changes are needed:

**Type A -- Remove duplicate toggles**: Cards already wrapped in `PinnableCard` by their parent have duplicate pin icons. Remove the internal `CommandCenterVisibilityToggle` from these cards.

**Type B -- Add inline hover footer**: Cards NOT wrapped in `PinnableCard` need the internal toggle removed from the header and replaced with the collapsible inline footer pattern (matching `PinnableCard`'s approach).

---

### Type A: Remove Duplicate Toggles (3 files)

These cards are already wrapped in `PinnableCard` in their parent component, so the internal toggle is redundant:

1. **`src/components/dashboard/WebsiteAnalyticsWidget.tsx`**
   - Wrapped in `PinnableCard` in `MarketingTabContent.tsx`
   - Remove the `CommandCenterVisibilityToggle` from the header

2. **`src/components/dashboard/sales/ClientFunnelCard.tsx`**
   - Wrapped in `PinnableCard` in `SalesTabContent.tsx`
   - Remove the `CommandCenterVisibilityToggle` from the header

3. **`src/components/dashboard/sales/ForecastingCard.tsx`**
   - Wrapped in `PinnableCard` in `SalesTabContent.tsx`
   - Remove the `CommandCenterVisibilityToggle` from the header

---

### Type B: Add Inline Hover Footer (7 files)

These cards are NOT wrapped in `PinnableCard`. The approach for each:
- Remove `CommandCenterVisibilityToggle` from the card header
- Wrap the card's outermost `<Card>` element in a `group` container
- Add the collapsible footer row after the card (same pattern as `PinnableCard`)

4. **`src/components/dashboard/StylistWorkloadCard.tsx`**
   - Has 3 render paths (loading, empty, main) -- each has the toggle in the header
   - Remove all 3 internal toggles
   - Wrap in group container with inline hover footer

5. **`src/components/dashboard/HiringCapacityCard.tsx`**
   - Remove toggle from header
   - Wrap in group container with inline hover footer

6. **`src/components/dashboard/NewBookingsCard.tsx`**
   - Remove toggle from header
   - Wrap in group container with inline hover footer

7. **`src/components/dashboard/StaffingTrendChart.tsx`**
   - Remove toggle from header
   - Wrap in group container with inline hover footer

8. **`src/components/dashboard/ClientEngineOverview.tsx`**
   - Remove toggle from header
   - Wrap in group container with inline hover footer

9. **`src/components/dashboard/StylistsOverviewCard.tsx`**
   - Two exported components (`StylistsOverviewCard` and `StaffOverviewCard`), each with a toggle
   - Remove both internal toggles
   - Wrap each in group container with inline hover footer

10. **`src/components/dashboard/ProgramCompletionFunnel.tsx`**
    - Remove toggle from header
    - Wrap in group container with inline hover footer

---

### Inline Hover Footer Pattern (applied to Type B cards)

Each card will get this wrapper structure:

```tsx
<div className="relative group">
  <Card> {/* existing card unchanged */} </Card>
  <div className="max-h-0 opacity-0 group-hover:max-h-10 group-hover:opacity-100 overflow-hidden transition-all duration-200 ease-in-out">
    <div className="flex items-center justify-end gap-0.5 px-3 py-1 border-t border-border/30">
      <CommandCenterVisibilityToggle elementKey="..." elementName="..." />
    </div>
  </div>
</div>
```

Note: The `ZuraCardInsight` component is only included in `PinnableCard`-wrapped cards (which pass metric data). For these standalone cards, only the pin toggle appears in the footer.

### Files Modified (10 total)
1. `src/components/dashboard/WebsiteAnalyticsWidget.tsx` -- remove duplicate toggle
2. `src/components/dashboard/sales/ClientFunnelCard.tsx` -- remove duplicate toggle
3. `src/components/dashboard/sales/ForecastingCard.tsx` -- remove duplicate toggle
4. `src/components/dashboard/StylistWorkloadCard.tsx` -- move toggle to hover footer
5. `src/components/dashboard/HiringCapacityCard.tsx` -- move toggle to hover footer
6. `src/components/dashboard/NewBookingsCard.tsx` -- move toggle to hover footer
7. `src/components/dashboard/StaffingTrendChart.tsx` -- move toggle to hover footer
8. `src/components/dashboard/ClientEngineOverview.tsx` -- move toggle to hover footer
9. `src/components/dashboard/StylistsOverviewCard.tsx` -- move toggle to hover footer (both exports)
10. `src/components/dashboard/ProgramCompletionFunnel.tsx` -- move toggle to hover footer


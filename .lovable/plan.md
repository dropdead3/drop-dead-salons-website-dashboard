

## Move "Time filter n/a" Badge to Bottom-Left Corner

### Change

**File:** `src/components/dashboard/PinnedAnalyticsCard.tsx`

Move the badge from its current position (between the header and metric value, lines 507-511) down into the footer row (line 518), positioned on the left side opposite the "View Forecast" link on the right.

### Before
The badge sits awkwardly between the card title and the dollar amount, taking up vertical space and breaking the visual flow.

### After
The badge will anchor to the bottom-left of the card, sitting in the same row as the "View ..." link. The footer `div` will use `justify-between` (instead of `justify-end`) so the badge sits left and the link sits right. When there is no link, the badge still anchors bottom-left. Styling will also be refined slightly for a cleaner look: smaller text, softer background, and italic to feel like a quiet footnote rather than a UI element.

### Technical Detail

1. **Remove** the badge block from lines 507-511 (its current position after the header).
2. **Update** the footer `div` (line 518) from `justify-end` to `justify-between items-center`.
3. **Insert** the badge as the first child inside the footer div, before the link:
   ```tsx
   <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/30 min-h-[28px]">
     {TIME_INDEPENDENT_CARDS.has(cardId) && filters.dateRange !== 'today' ? (
       <span className="text-[10px] italic text-muted-foreground/50">
         Time filter n/a
       </span>
     ) : <span />}
     {link && (
       <Link ...>View {link.label} <ChevronRight /></Link>
     )}
   </div>
   ```

This places the badge as a subtle, italic footnote in the bottom-left corner, balanced against the action link on the right.


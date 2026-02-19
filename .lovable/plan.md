

## Replace Icon Toggle with Filter Tab Toggle for Simple/Detailed View

### What changes
The current Simple/Detailed view toggle is a single icon button that flips between two icons with a tooltip. We will replace it with the existing `FilterTabsList` / `FilterTabsTrigger` component pair, showing two labeled tabs: **Simple** and **Detailed**.

### File: `src/components/dashboard/AnalyticsFilterBar.tsx`

#### 1. Update imports
- Remove: `LayoutGrid`, `List` from lucide-react; `Button`; `Tooltip`, `TooltipContent`, `TooltipTrigger`
- Add: `Tabs`, `FilterTabsList`, `FilterTabsTrigger` from `@/components/ui/tabs`

#### 2. Replace the toggle block (lines 66-82)

Replace the icon `Button` wrapped in a `Tooltip` with:

```tsx
{onCompactChange && (
  <Tabs
    value={compact ? 'simple' : 'detailed'}
    onValueChange={(v) => onCompactChange(v === 'simple')}
  >
    <FilterTabsList>
      <FilterTabsTrigger value="simple">Simple</FilterTabsTrigger>
      <FilterTabsTrigger value="detailed">Detailed</FilterTabsTrigger>
    </FilterTabsList>
  </Tabs>
)}
```

This uses the existing tokenized `FilterTabsList` and `FilterTabsTrigger` components (compact pill-style tabs at 8px height), which visually match other filter toggles in the analytics section and provide clear textual labels instead of ambiguous icons.

### No other files change
The `FilterTabsList` and `FilterTabsTrigger` components already exist and are exported from `@/components/ui/tabs`. No new components or tokens are needed.

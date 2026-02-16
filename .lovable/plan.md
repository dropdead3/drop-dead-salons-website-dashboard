

# Replace ToggleGroup with Tokenized Tab Selectors in ForecastingCard

## Problem
The ForecastingCard uses `ToggleGroup` / `ToggleGroupItem` with custom inline styles (`bg-muted/50 p-1 rounded-lg`, custom `data-[state=on]:` classes) for its period selector and drill-down type selector. This violates the standardized tab bar design system, which uses `Tabs` / `TabsList` / `TabsTrigger` with tokenized styles (h-11, p-1.5, borderRadius 9px container / 6px triggers, glass active state).

## What Changes

**File: `src/components/dashboard/sales/ForecastingCard.tsx`**

### 1. Period Selector (lines 546-567)
Replace the `ToggleGroup` with `Tabs` + `TabsList` + `TabsTrigger`:

```
Before:
<ToggleGroup type="single" value={period} onValueChange={...} className="bg-muted/50 p-1 rounded-lg">
  <ToggleGroupItem value="tomorrow" className="text-xs px-2.5 py-1 h-7 ...">Tomorrow</ToggleGroupItem>
  ...
</ToggleGroup>

After:
<Tabs value={period} onValueChange={...}>
  <TabsList>
    <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
    <TabsTrigger value="todayToEom">EOM</TabsTrigger>
    <TabsTrigger value="7days">7 Days</TabsTrigger>
    <TabsTrigger value="30days">30 Days</TabsTrigger>
    <TabsTrigger value="60days">60 Days</TabsTrigger>
  </TabsList>
</Tabs>
```

This automatically picks up the tokenized styles: h-11 container, p-1.5, rounded-[9px] outer / rounded-[6px] inner, glass active state (`bg-white/[0.08]`, `ring-1 ring-white/[0.12]`, `backdrop-blur-sm`).

### 2. Drill-Down Type Selector (lines 664-679)
Same replacement for the "Drill down by" toggle:

```
Before:
<ToggleGroup type="single" value={breakdownType} onValueChange={...} className="bg-muted/50 p-1 rounded-lg">
  <ToggleGroupItem value="category" ...>Category</ToggleGroupItem>
  ...
</ToggleGroup>

After:
<Tabs value={breakdownType} onValueChange={...}>
  <TabsList>
    <TabsTrigger value="category">Category</TabsTrigger>
    <TabsTrigger value="location">Location</TabsTrigger>
    <TabsTrigger value="stylist">Service Provider</TabsTrigger>
  </TabsList>
</Tabs>
```

### 3. Import Updates
- Remove: `ToggleGroup, ToggleGroupItem` import
- Add: `Tabs, TabsList, TabsTrigger` from `@/components/ui/tabs`

### Key Detail
Since `Tabs` uses `onValueChange` (same as `ToggleGroup`), the callback signatures are compatible. The `value` prop works identically. No state management changes needed -- this is a pure UI swap.


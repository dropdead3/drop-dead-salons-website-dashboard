
# Improve Tab Hierarchy Visual Design

## Problem

Currently, both the main Analytics tabs (Sales, Operations, Marketing, Program, Reports) and the sub-tabs within Reports (Sales, Staff, Clients, Operations, Financial) use identical styling:
- Same `bg-muted` background
- Same size and spacing
- Same visual weight

This makes it unclear that the second row is a **child** of the selected "Reports" tab.

## Solution Options

### Option A: Visual Differentiation via Styling (Recommended)

Differentiate sub-tabs with lighter/more subtle styling:

```text
Main Tabs:    [$ Sales] [Operations] [Marketing] [Program] [■ Reports]  ← Full bg-muted pill style
                                                                ↓
Sub-tabs:      $ Sales   Staff   Clients   Operations   Financial      ← Underline style, no background
                ─────
```

**Implementation:**
- Keep main tabs with current solid pill style (`bg-muted`)
- Change sub-tabs to use an underline/border-bottom style (no background)
- Add a subtle left border or indentation to show hierarchy
- Optionally add a small label like "Report Type" above sub-tabs

### Option B: Contextual Label + Visual Grouping

Add a section header and visual container to group sub-tabs:

```text
[$ Sales] [Operations] [Marketing] [Program] [■ Reports]

┌─ Report Categories ────────────────────────────────┐
│  [$ Sales] [Staff] [Clients] [Operations] [Financial]  │
└────────────────────────────────────────────────────┘
```

### Option C: Segmented Control for Sub-tabs

Use a different component style entirely (like a segmented control or button group):

```text
[$ Sales] [Operations] [Marketing] [Program] [■ Reports]

Export Type:  ●Sales  ○Staff  ○Clients  ○Operations  ○Financial
```

## Recommended Approach: Option A + Label

Combine visual differentiation with a contextual label for maximum clarity:

```text
┌─────────────────────────────────────────────────────────────────┐
│  [$ Sales] [Operations] [Marketing] [Program] [■ Reports]       │  ← Main tabs (pill style)
│                                                                  │
│  Report Category                                                 │  ← Section label
│   $ Sales   Staff   Clients   Operations   Financial            │  ← Sub-tabs (underline style)
│   ═══════                                                        │     with active underline
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### File: `src/components/dashboard/analytics/ReportsTabContent.tsx`

**Changes:**
1. Add a contextual label above the sub-tabs: "Report Category"
2. Apply different styling to the TabsList - remove `bg-muted`, use transparent background
3. Style TabsTriggers with underline indicator instead of background pill

```tsx
<div className="space-y-6">
  {/* Category Label + Sub-tabs */}
  <div className="space-y-2">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      Report Category
    </span>
    <Tabs value={activeCategory} onValueChange={setActiveCategory}>
      <TabsList className="bg-transparent h-auto p-0 gap-4">
        {reportCategories.map((cat) => (
          <TabsTrigger 
            key={cat.id} 
            value={cat.id} 
            className="gap-2 px-1 py-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <cat.icon className="w-4 h-4" />
            <span>{cat.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {/* ... TabsContent remains same ... */}
    </Tabs>
  </div>
</div>
```

### Visual Comparison

| Element | Main Tabs | Sub-tabs |
|---------|-----------|----------|
| Background | `bg-muted` pill container | Transparent |
| Active indicator | White/background fill | Underline border |
| Spacing | Contained in pill | Inline with gaps |
| Text style | Same | Same |
| Icons | Yes | Yes |

### Alternative: Create a SubTabsList Variant

For reusability across Sales and Operations sub-tabs too, create a variant:

```tsx
// In tabs.tsx or as a new component
const SubTabsList = React.forwardRef<...>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center gap-4 bg-transparent p-0 text-muted-foreground",
      className,
    )}
    {...props}
  />
));

const SubTabsTrigger = React.forwardRef<...>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center gap-2 px-1 py-2 text-sm font-medium border-b-2 border-transparent transition-all data-[state=active]:text-foreground data-[state=active]:border-primary",
      className,
    )}
    {...props}
  />
));
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/analytics/ReportsTabContent.tsx` | Add label, change sub-tab styling |
| (Optional) `src/components/ui/tabs.tsx` | Add SubTabsList/SubTabsTrigger variants |
| (Optional) `src/components/dashboard/analytics/SalesTabContent.tsx` | Apply same sub-tab style for consistency |
| (Optional) `src/components/dashboard/analytics/OperationsTabContent.tsx` | Apply same sub-tab style for consistency |

## Benefits

1. **Clear hierarchy** - Visually distinct parent/child relationship
2. **Contextual label** - Explicit "Report Category" removes ambiguity
3. **Consistent pattern** - Can apply same sub-tab style across all Analytics sections
4. **No layout changes** - Keeps same content organization
5. **Subtle but effective** - Doesn't add clutter, just clarifies relationship

## Summary

| Task | Description |
|------|-------------|
| Add section label | "Report Category" above sub-tabs |
| Restyle sub-tabs | Underline style instead of pill style |
| Apply to all sub-tabs | Consistent across Sales, Operations, Reports tabs |

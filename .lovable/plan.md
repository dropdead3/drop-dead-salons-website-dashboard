
# Bento-Style Settings Detail Pages

## Problem
When clicking into a settings category (e.g., System), all cards stack in a single full-width column. Small cards like "Help & Guidance" (one toggle), "Security" (two toggles), and "Sounds" (one toggle + 2 buttons) waste vertical space by stretching edge-to-edge.

## Solution
Apply a responsive 2-column bento grid to the category detail views where cards can sit side-by-side. Larger cards (like Appearance with its theme grid, or Notifications with its many controls) span the full width, while smaller cards share a row.

### Approach

For each category detail view in `Settings.tsx`, wrap the cards in a CSS grid layout:

```text
grid grid-cols-1 lg:grid-cols-2 gap-6
```

Cards that need full width get `lg:col-span-2`. Small cards naturally fill one column cell.

### Categories to Update

**System tab** (inline in Settings.tsx, lines 1192-1385):
- Appearance card: full width (has theme grid with 4 columns)
- Keyboard Shortcuts: half width
- Sounds: half width
- Help & Guidance: half width
- Security: half width
- Quick Login PIN: half width

**Notifications card** (rendered inside System, or standalone): full width due to staffing alerts section

**Email tab** (lines 954-1001): Already uses Tabs -- no change needed, each tab shows one card

**Other category pages** that render inline cards will get the same treatment where multiple cards exist:
- Service Flows (lines 1018-1023): 2 cards, can go side-by-side
- Feedback (lines 1423-1433): single card, no change

### Implementation Detail

The primary change is in `Settings.tsx`:

1. **System > Settings tab**: Change `className="space-y-6 mt-0"` to `className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-0"` and add `lg:col-span-2` to the Appearance card
2. **Service Flows section**: Wrap in a grid similarly

For external content components that render their own card stacks (like `ScheduleSettingsContent`, `LocationsSettingsContent`, etc.), those already have their own internal layouts and would be addressed separately if needed -- this change focuses on the inline-rendered detail views in Settings.tsx.

### Files Modified

| File | Change |
|------|--------|
| `src/pages/dashboard/admin/Settings.tsx` | Convert System tab and Service Flows section to 2-column bento grid; add col-span-2 to large cards |

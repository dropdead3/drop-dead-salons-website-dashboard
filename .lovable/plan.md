

# Apply Bento-Style Grid to Remaining Settings Pages

## Overview
After reviewing all settings content components, most pages either use a tabs-based layout (which already works well) or contain a single full-width card. Only two pages have multiple discrete cards that would benefit from the bento-style `grid grid-cols-1 lg:grid-cols-2 gap-6` layout used in the Website settings tabs.

## Pages to Update

### 1. ScheduleSettingsContent (3 cards)
Currently stacks three cards vertically with `space-y-6`:
- **Service Category Colors** (large, list-heavy with drag-and-drop) -- full width (`lg:col-span-2`)
- **Scheduling Blocks** (compact, just 2 entries) -- half width
- **Calendar Preview** (visual preview widget) -- half width

Change: Wrap the return content in `grid grid-cols-1 lg:grid-cols-2 gap-6`. Apply `lg:col-span-2` to the Service Category Colors card. Scheduling Blocks and Calendar Preview sit side-by-side on desktop.

### 2. KioskSettingsContent (2 sections)
Currently stacks the Organization Defaults collapsible card and Location Status card vertically.
- **Organization Defaults** (collapsible form) -- full width (`lg:col-span-2`) since it expands into a large form
- **Location Status Cards** -- full width (`lg:col-span-2`) since each location expands into settings

Given both sections expand to full width, applying the grid wrapper provides future flexibility but these cards will both span full width. This page is better left as-is since there is no natural side-by-side pairing.

### Pages NOT Changed (and why)
| Page | Reason |
|------|--------|
| LocationsSettingsContent | Single card containing the full locations list |
| RetailProductsSettingsContent | Tabs-based layout with data tables needing full width |
| ServicesSettingsContent | Two cards, but both are list-heavy with drag-and-drop; side-by-side would cramp them |
| StylistLevelsContent | Single card |
| DayRateSettingsContent | Tabs-based (Chairs + Agreement) |
| LoyaltySettingsContent | Tabs-based (6 tabs) |
| FormsTemplatesContent | Tabs-based (3 tabs) |

## Technical Details

### File: `src/components/dashboard/settings/ScheduleSettingsContent.tsx`
- Change the outer `<div className="space-y-6">` to `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`
- Add `lg:col-span-2` to the Service Category Colors `<Card>`
- The Scheduling Blocks and Calendar Preview cards remain without col-span, so they flow side-by-side on desktop

This is a small, targeted change -- only one file modified, keeping the scope tight and consistent with the existing pattern in WebsiteSettingsContent.

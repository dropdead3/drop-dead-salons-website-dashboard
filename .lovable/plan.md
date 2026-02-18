
# Bento-Style Layout for Website Settings Tabs

## Problem
All five Website Settings tabs (General, Theme, Booking, Retail, SEO & Legal) stack their cards in a single full-width column (`space-y-6`). Smaller cards like "Cookie Consent" (one toggle), "Social Links" (5 inputs), and "Legal Pages" (2 inputs) waste horizontal space on wide screens.

## Solution
Apply the same responsive 2-column bento grid used in the System settings tab. Large or content-heavy cards span full width; smaller cards sit side-by-side.

---

## Tab-by-Tab Layout

### General Tab (lines 158-281)
Change the wrapper from `space-y-6` to `grid grid-cols-1 lg:grid-cols-2 gap-6`.

| Card | Width | Reason |
|------|-------|--------|
| Custom Domain | Full (`lg:col-span-2`) | Wide input + button layout |
| Announcement Banner | Full (`lg:col-span-2`) | Many fields, long form |
| Social Links | Half | Just 5 input rows |
| Quick Actions (Editor/Preview buttons) | Half | Two buttons only |

### Booking Tab (lines 532-608)
Change wrapper to grid.

| Card | Width | Reason |
|------|-------|--------|
| Online Booking | Full (`lg:col-span-2`) | Multiple controls + select dropdown |
| Stylist & Service Visibility | Full (`lg:col-span-2`) | Coming Soon placeholder, fine at full width |

Since there are only 2 cards and both are reasonably sized, this tab benefits less but stays consistent. Both cards go full-width.

### Retail Tab (lines 658-792)
Change wrapper to grid.

| Card | Width | Reason |
|------|-------|--------|
| Online Shop | Half | Toggle + fulfillment options |
| Store Link + QR | Half | URL + QR code -- pairs nicely beside Online Shop |
| Store Products | Full (`lg:col-span-2`) | Data table needs full width |
| Store Appearance Configurator | Full (`lg:col-span-2`) | Color pickers + iframe preview |

### SEO & Legal Tab (lines 830-937)
Change wrapper to grid.

| Card | Width | Reason |
|------|-------|--------|
| Analytics & Tracking | Half | 4 ID inputs |
| Cookie Consent | Half | Single toggle -- tiny card |
| Legal Pages | Half | 2 URL inputs |

The save button at the bottom gets `lg:col-span-2` so it spans full width.

### Theme Tab
No changes -- it uses a dedicated editor layout with resizable panels, not a card stack.

---

## File Changes

| File | Change |
|------|--------|
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Replace `space-y-6` with `grid grid-cols-1 lg:grid-cols-2 gap-6` in GeneralTab, BookingTab, RetailTab, and SeoLegalTab; add `lg:col-span-2` to wide cards |

## Technical Detail

Each tab function's outermost `<div className="space-y-6">` becomes `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`. Cards that should remain full-width get `className="lg:col-span-2"` added. Cards with `self-stretch` behavior from CSS grid will automatically align their tops, creating the bento effect.

For the Retail tab, the conditionally rendered Store Link and Store Products cards already have the right conditional wrappers -- no logic changes needed, just className additions.

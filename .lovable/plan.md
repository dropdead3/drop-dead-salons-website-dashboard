

# Live Preview Panels for Website Settings Cards

## What This Does
Adds a real-time mini preview beside each settings card so you can see exactly how your changes will look on the live website as you type. Each card gets a compact preview panel showing the corresponding website component.

## Cards Getting Previews

### General Tab
- **Announcement Banner card** -- shows the actual announcement bar strip (background, prefix text, highlighted text, suffix, CTA button) updating live as you type
- **Social Links card** -- shows a mini footer "Connect" section with the social icons/links you've entered, reflecting which platforms have URLs

### Booking Tab
- No previews needed -- these are functional settings (toggles/dropdowns), not visual components

### SEO & Legal Tab  
- No previews needed -- these are IDs, URLs, and toggles with no visual website representation

### Retail Tab
- Already has the Store Appearance Configurator with a live iframe preview -- no changes needed

## Layout Approach

Each card that gets a preview will switch from a simple `<Card>` to a side-by-side layout:

```text
+-----------------------------+-------------------+
|  Card (form fields)         |  Live Preview     |
|  [inputs, toggles, etc.]    |  [mini component] |
+-----------------------------+-------------------+
```

On the General tab, the Announcement Banner card (currently `lg:col-span-2`) stays full-width but internally splits into a 2-column layout: left side is the form, right side is a contained preview of the announcement bar. The Social Links card stays half-width but gets a small preview strip below it showing which icons are active.

## Technical Detail

### Announcement Banner Preview
Render a self-contained mini version of the announcement bar inside the card, using the local `annLocal` state so it updates on every keystroke. The preview mirrors the markup from `Header.tsx` (lines 203-218): a `bg-secondary` strip with prefix, highlighted text, suffix, and CTA arrow link.

### Social Links Preview  
Render a compact footer-style "Connect" section below the inputs showing the social icons that have URLs filled in. Icons without URLs are shown as dimmed/disabled.

### Implementation
All changes are in `WebsiteSettingsContent.tsx`:

1. **Announcement Banner card** (lines 165-238): Wrap `CardContent` in a grid with the form on the left and a preview panel on the right. The preview panel renders a scaled-down announcement bar using `annLocal` values.

2. **Social Links card** (lines 241-266): Add a preview strip below the inputs showing active social platform icons with a mini visual representation.

### File Changes

| File | Change |
|------|--------|
| `src/components/dashboard/settings/WebsiteSettingsContent.tsx` | Add inline live preview panels to Announcement Banner and Social Links cards using local state for real-time updates |


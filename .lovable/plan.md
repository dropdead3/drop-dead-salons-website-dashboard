

# Enhanced Email Branding Configurator

## Overview

Upgrade the email branding settings from a basic 4-field form into a professional, sectioned configurator with additional customization options, a better layout, and always-visible live preview. This brings the email branding experience in line with Zura's premium design language.

## New Features

### 1. Footer Customization
- **Footer text**: Editable line (e.g., business address, tagline)
- **Social links**: Up to 4 social media URLs (Instagram, Facebook, TikTok, Website) rendered as icons in the email footer
- **"Powered by" toggle**: Option to show/hide the "Sent via Zura" attribution

### 2. Button Style Customization
- **Button corner radius**: Selector (sharp / rounded / pill) controlling CTA button border-radius in emails
- **Button text color**: Auto-calculated from accent (white or dark) with manual override option

### 3. Header Layout Options
- **Header style**: Choose between "centered" (current), "left-aligned", or "minimal" (thin accent bar, no logo block)
- **Header padding**: Compact vs standard vs spacious

### 4. Always-Visible Side-by-Side Preview
- Replace the toggle-based preview with a persistent side-by-side layout on desktop (stacked on mobile)
- Left column: settings form. Right column: live preview
- Desktop/mobile preview toggle stays in the preview panel header

### 5. Unsaved Changes Indicator
- Visual badge on the Save button area when changes are pending
- Confirmation prompt if navigating away with unsaved changes

## Database Changes

Add new columns to `organizations` table to persist the additional settings:

```sql
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS email_footer_text text,
  ADD COLUMN IF NOT EXISTS email_social_links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS email_show_attribution boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_button_radius text DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS email_header_style text DEFAULT 'centered';
```

## File Changes

### Modified: `src/components/dashboard/settings/EmailBrandingSettings.tsx`

Complete restructure into a two-column layout with organized sections:

**Layout:**
```text
+---------------------------+----------------------------+
| SETTINGS (scrollable)     | LIVE PREVIEW (sticky)      |
|                           |                            |
| -- Identity --            |  [Desktop] [Mobile]        |
| Sender Name | Reply-To    |  [Template selector]       |
|                           |                            |
| -- Visual --              |  +--------------------+    |
| Logo Source  | Accent      |  | [Header w/ logo]   |    |
|              | Color       |  | [Accent bar]       |    |
| Header Style | Btn Radius  |  | [Content area]     |    |
|                           |  | [Footer w/ social] |    |
| -- Footer --              |  +--------------------+    |
| Footer Text               |                            |
| Social Links (IG/FB/TT/W) |                            |
| Show "Sent via Zura" [x]  |                            |
|                           |                            |
| [Send Test] [Save]        |                            |
+---------------------------+----------------------------+
```

**Sections:**
1. **Identity** -- Sender name, reply-to (existing, cleaned up)
2. **Visual** -- Logo source, accent color, header style, button radius
3. **Footer** -- Footer text, social links, attribution toggle
4. **Actions** -- Send test + save (pinned at bottom of settings column)

### Modified: `supabase/functions/_shared/email-sender.ts`

Update `buildBrandedTemplate` to consume the new fields:
- Render social link icons in the footer
- Apply custom footer text
- Respect header style setting
- Apply button radius to CTA buttons
- Conditionally show/hide "Sent via Zura"

## Technical Details

### State Management
- All new fields follow the same pattern as existing ones: local state seeded from fetched data, `hasChanges` comparison, single save mutation
- Social links stored as `{ instagram?: string, facebook?: string, tiktok?: string, website?: string }`

### Preview Sync
- All settings reflect instantly in the preview (no save required to see changes)
- The preview mirrors `buildBrandedTemplate` output exactly so what you see is what recipients get

### Design Rules
- `font-display` for section headers, uppercase, wide tracking
- `font-medium` max weight (no bold/semibold)
- Semantic theme colors throughout
- Sections separated by subtle borders, not heavy cards

### Edge Function Update
- `buildBrandedTemplate` reads the new columns from `OrgBranding` type
- Social icons rendered as small linked images or Unicode symbols (no external image dependencies)
- Button radius maps: `sharp` = 0, `rounded` = 8px, `pill` = 100px

